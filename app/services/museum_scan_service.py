from __future__ import annotations

import json
import threading
from datetime import datetime

from app.database.database import get_connection
from app.services.scanner import scan_library
from app.services.game_removal_service import ignored_paths
from app.services.curator_service import refresh_game_score, run_game

_scan_lock = threading.Lock()
_scan_thread = None


def _now():
    return datetime.now().isoformat(timespec='seconds')


def _update(**fields):
    if not fields:
        return
    conn = get_connection()
    assignments = ', '.join(f"{key}=?" for key in fields)
    conn.execute(f"UPDATE museum_scan_jobs SET {assignments}, updated_at=CURRENT_TIMESTAMP WHERE id=1", tuple(fields.values()))
    conn.commit(); conn.close()


def scan_status():
    conn = get_connection()
    row = conn.execute("SELECT * FROM museum_scan_jobs WHERE id=1").fetchone()
    conn.close()
    if not row:
        return {'status':'idle','progress':0,'stage':'Ready','total_games':0,'checked_games':0,'queued_games':0,'completed_games':0,'failed_games':0,'current_game':'','summary':{}}
    data = dict(row)
    # A running state can survive an interrupted container/process even though
    # no worker exists anymore. Treat that as stale rather than making a page
    # refresh look like it started a new scan.
    if data.get('status') in {'scanning', 'preparing'} and not (_scan_thread and _scan_thread.is_alive()):
        _update(status='idle', progress=0, stage='Ready', current_game='', last_error='')
        data.update(status='idle', progress=0, stage='Ready', current_game='', last_error='')
    try:
        data['summary'] = json.loads(data.get('summary_json') or '{}')
    except Exception:
        data['summary'] = {}
    data['running'] = data.get('status') in {'scanning','preparing'}
    return data


def _upsert_scanned_game(conn, game):
    existing = conn.execute('SELECT id FROM games WHERE path=?', (game['path'],)).fetchone()
    values = (
        game['title'], game['size_bytes'], game['file_count'], game['executable_count'], game['executables'],
        game.get('manual_count',0), game.get('readme_count',0), game.get('archive_count',0),
        game.get('installer_count',0), game.get('disc_image_count',0), game.get('patch_count',0),
        game.get('soundtrack_count',0), game.get('bonus_count',0), game['last_scanned'], game['path']
    )
    if existing:
        conn.execute('''UPDATE games SET title=?,size_bytes=?,file_count=?,executable_count=?,executables=?,manual_count=?,readme_count=?,archive_count=?,installer_count=?,disc_image_count=?,patch_count=?,soundtrack_count=?,bonus_count=?,updated_at=CURRENT_TIMESTAMP,last_scanned=? WHERE path=?''', values)
        return existing['id'], False
    cur = conn.execute('''INSERT INTO games (library_id,title,path,size_bytes,file_count,executable_count,executables,manual_count,readme_count,archive_count,installer_count,disc_image_count,patch_count,soundtrack_count,bonus_count,last_scanned) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)''', (
        game['library_id'], game['title'], game['path'], game['size_bytes'], game['file_count'], game['executable_count'], game['executables'], game.get('manual_count',0), game.get('readme_count',0), game.get('archive_count',0), game.get('installer_count',0), game.get('disc_image_count',0), game.get('patch_count',0), game.get('soundtrack_count',0), game.get('bonus_count',0), game['last_scanned']))
    return cur.lastrowid, True


def _run_scan():
    added = updated = skipped = errors = completed = failed = 0
    try:
        _update(status='scanning', progress=1, stage='Scanning game folders', current_game='', started_at=_now(), finished_at='', last_error='', total_games=0, checked_games=0, queued_games=0, completed_games=0, failed_games=0, summary_json='{}')
        conn = get_connection()
        libraries = [dict(row) for row in conn.execute('SELECT * FROM libraries ORDER BY id').fetchall()]
        ignored = {row['path'] for row in ignored_paths()}
        scanned = []
        for library in libraries:
            result = scan_library(library)
            skipped += int(result.get('skipped',0)); errors += len(result.get('errors',[]))
            scanned.extend(result.get('games',[]))
        total_scan = max(1, len(scanned))
        _update(total_games=len(scanned))
        game_ids = []
        for index, game in enumerate(scanned, start=1):
            if game['path'] in ignored:
                skipped += 1
                continue
            game_id, is_new = _upsert_scanned_game(conn, game)
            game_ids.append(game_id)
            added += 1 if is_new else 0
            updated += 0 if is_new else 1
            conn.commit()
            progress = min(35, 2 + round(index / total_scan * 33))
            _update(progress=progress, checked_games=index, current_game=game.get('title',''))
        # Include manual entries and existing games not encountered in folder scans.
        all_rows = [dict(row) for row in conn.execute('SELECT * FROM games WHERE curator_paused=0 ORDER BY title COLLATE NOCASE').fetchall()]
        conn.close()
        targets = []
        for game in all_rows:
            score = (refresh_game_score(game['id']) or {}).get('score', game.get('curator_score') or 0)
            if score < 90:
                targets.append(game)
        _update(status='preparing', stage='Preparing museum records', queued_games=len(targets), total_games=max(len(scanned), len(all_rows)))
        target_total = max(1, len(targets))
        for index, game in enumerate(targets, start=1):
            _update(current_game=game.get('title',''), stage='Preparing game information', progress=min(97, 36 + round((index-1)/target_total*61)))
            result = run_game(game['id'], progress_callback=lambda p,s, i=index, n=target_total, title=game.get('title',''): _update(current_game=title, stage=s, progress=min(97, 36 + round(((i-1)+(p/100))/n*61))))
            if result.get('success'):
                completed += 1
            else:
                failed += 1
            _update(completed_games=completed, failed_games=failed)
        summary = {'added':added,'updated':updated,'skipped':skipped,'errors':errors,'prepared':completed,'needs_review':failed,'checked':len(all_rows)}
        _update(status='complete', progress=100, stage='Museum scan complete', current_game='', completed_games=completed, failed_games=failed, finished_at=_now(), summary_json=json.dumps(summary))
    except Exception as exc:
        _update(status='failed', stage='Scan needs attention', last_error=str(exc), finished_at=_now())
    finally:
        global _scan_thread
        with _scan_lock:
            _scan_thread = None


def start_scan():
    global _scan_thread
    with _scan_lock:
        if _scan_thread and _scan_thread.is_alive():
            return {'started':False, **scan_status()}
        current = scan_status()
        if current.get('running'):
            # Recover stale process state after a container restart.
            _update(status='idle', stage='Ready', progress=0, current_game='')
        _scan_thread = threading.Thread(target=_run_scan, name='vaultarr-museum-scan', daemon=True)
        _scan_thread.start()
    return {'started':True, **scan_status()}
