import os
import shutil
from pathlib import Path

from app.database.database import get_connection
from app.services.media_service import MEDIA_DIR
from app.services.metadata_service import COVERS_DIR
from app.services.manual_service import MANUALS_DIR


def ensure_ignored_paths_table(conn=None):
    owns = conn is None
    conn = conn or get_connection()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS ignored_game_paths (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            path TEXT NOT NULL UNIQUE,
            title TEXT DEFAULT '',
            ignored_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    if owns:
        conn.commit()
        conn.close()


def is_ignored_path(path, conn=None):
    owns = conn is None
    conn = conn or get_connection()
    ensure_ignored_paths_table(conn)
    row = conn.execute('SELECT 1 FROM ignored_game_paths WHERE path=?', (str(path),)).fetchone()
    if owns:
        conn.close()
    return row is not None


def _safe_unlink(root, relative_or_name):
    if not relative_or_name:
        return False
    root = Path(root).resolve()
    candidate = (root / str(relative_or_name)).resolve()
    try:
        candidate.relative_to(root)
    except ValueError:
        return False
    if candidate.is_file():
        candidate.unlink(missing_ok=True)
        return True
    return False


def remove_game(game_id, ignore_path=True, delete_cached_assets=True):
    conn = get_connection()
    ensure_ignored_paths_table(conn)
    game = conn.execute('SELECT * FROM games WHERE id=?', (game_id,)).fetchone()
    if not game:
        conn.close()
        return {'removed': False, 'message': 'Game not found.'}

    game = dict(game)
    media_rows = conn.execute('SELECT local_path FROM media_assets WHERE game_id=?', (game_id,)).fetchall()

    if ignore_path and game.get('path') and not str(game['path']).startswith('manual://'):
        conn.execute(
            'INSERT OR REPLACE INTO ignored_game_paths (path,title,ignored_at) VALUES (?,?,CURRENT_TIMESTAMP)',
            (game['path'], game.get('title', '')),
        )

    for table in ('media_assets', 'game_collection_attributes', 'game_collections', 'curator_jobs', 'curator_history'):
        try:
            conn.execute(f'DELETE FROM {table} WHERE game_id=?', (game_id,))
        except Exception:
            pass
    conn.execute('DELETE FROM games WHERE id=?', (game_id,))
    conn.commit()
    conn.close()

    removed_assets = 0
    if delete_cached_assets:
        for row in media_rows:
            removed_assets += 1 if _safe_unlink(MEDIA_DIR, row['local_path']) else 0
        media_folder = MEDIA_DIR / str(game_id)
        if media_folder.exists() and media_folder.is_dir():
            shutil.rmtree(media_folder, ignore_errors=True)

        for field in ('cover_path', 'preferred_cover_path'):
            removed_assets += 1 if _safe_unlink(COVERS_DIR, game.get(field, '')) else 0
        removed_assets += 1 if _safe_unlink(MANUALS_DIR, game.get('manual_file_path', '')) else 0

    return {
        'removed': True,
        'title': game.get('title', ''),
        'ignored': bool(ignore_path and game.get('path') and not str(game['path']).startswith('manual://')),
        'cached_assets_removed': removed_assets,
    }


def ignored_paths():
    conn = get_connection()
    ensure_ignored_paths_table(conn)
    rows = conn.execute('SELECT * FROM ignored_game_paths ORDER BY ignored_at DESC').fetchall()
    conn.close()
    return rows


def restore_ignored_path(ignore_id):
    conn = get_connection()
    ensure_ignored_paths_table(conn)
    conn.execute('DELETE FROM ignored_game_paths WHERE id=?', (ignore_id,))
    conn.commit()
    conn.close()
