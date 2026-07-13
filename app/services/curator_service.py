from __future__ import annotations

import json
from datetime import datetime

from app.database.database import get_connection
from app.services.provider_intelligence import apply_merge_best
from app.services.manual_service import manual_search_results, download_manual_pdf

CORE_FIELDS = ("description", "developer", "publisher", "release_year", "genre", "platform")


def _now():
    return datetime.now().isoformat(timespec="seconds")


def completeness_for_game(game):
    checks = {
        "identity": bool((game.get("metadata_source") or "").strip()),
        "description": bool((game.get("description") or "").strip()),
        "credits": bool((game.get("developer") or "").strip() or (game.get("publisher") or "").strip()),
        "release": bool((game.get("release_year") or "").strip()),
        "genre": bool((game.get("genre") or "").strip()),
        "platform": bool((game.get("platform") or "").strip()),
        "cover": bool((game.get("cover_path") or "").strip() or (game.get("cover_url") or "").strip()),
        "manual": bool((game.get("manual_file_path") or "").strip() or int(game.get("manual_count") or 0) > 0),
        "files": int(game.get("file_count") or 0) > 0 or int(game.get("manual_entry") or 0) == 1,
    }
    score = round(sum(1 for value in checks.values() if value) / len(checks) * 100)
    missing = [key for key, value in checks.items() if not value]
    return score, missing


def refresh_game_score(game_id):
    conn = get_connection()
    row = conn.execute("SELECT * FROM games WHERE id=?", (game_id,)).fetchone()
    if not row:
        conn.close()
        return None
    game = dict(row)
    score, missing = completeness_for_game(game)
    status = "museum_ready" if score >= 90 else ("needs_review" if score >= 55 else "cataloging")
    conn.execute(
        "UPDATE games SET curator_score=?, curator_status=?, curator_missing=?, updated_at=CURRENT_TIMESTAMP WHERE id=?",
        (score, status, json.dumps(missing), game_id),
    )
    conn.commit()
    conn.close()
    return {"score": score, "status": status, "missing": missing}


def _history(game_id, action, status, message, details=None):
    conn = get_connection()
    conn.execute(
        "INSERT INTO curator_history (game_id, action, status, message, details_json, created_at) VALUES (?,?,?,?,?,CURRENT_TIMESTAMP)",
        (game_id, action, status, message, json.dumps(details or {})),
    )
    conn.commit()
    conn.close()


def queue_game(game_id, reason="scan"):
    conn = get_connection()
    conn.execute(
        """
        INSERT INTO curator_jobs (game_id, status, reason, attempts, created_at, updated_at)
        VALUES (?, 'queued', ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT(game_id) DO UPDATE SET
          status=CASE WHEN curator_jobs.status='running' THEN curator_jobs.status ELSE 'queued' END,
          reason=excluded.reason,
          updated_at=CURRENT_TIMESTAMP
        """,
        (game_id, reason),
    )
    conn.commit()
    conn.close()


def queue_incomplete_games(reason="manual"):
    conn = get_connection()
    rows = conn.execute("SELECT * FROM games ORDER BY id").fetchall()
    conn.close()
    queued = 0
    for row in rows:
        game = dict(row)
        score, _ = completeness_for_game(game)
        if score < 90 and not int(game.get("curator_paused") or 0):
            queue_game(game["id"], reason)
            queued += 1
    return queued


def _auto_manual(game):
    if (game.get("manual_file_path") or "").strip() or int(game.get("manual_count") or 0) > 0:
        return {"skipped": True, "reason": "manual already present"}
    results = manual_search_results(game.get("title") or "", game.get("platform") or "", "all")
    candidates = [r for r in results if int(r.get("confidence") or r.get("score") or 0) >= 94 and r.get("manual_url")]
    if not candidates:
        return {"skipped": True, "reason": "no high-confidence manual"}
    best = candidates[0]
    saved = download_manual_pdf(game["id"], best["manual_url"], game.get("title") or "Manual")
    conn = get_connection()
    conn.execute(
        """
        UPDATE games SET manual_url=?, manual_provider=?, manual_file_path=?, manual_file_name=?,
          manual_file_size=?, manual_downloaded_at=CURRENT_TIMESTAMP, manual_checked_at=CURRENT_TIMESTAMP,
          updated_at=CURRENT_TIMESTAMP WHERE id=?
        """,
        (best["manual_url"], best.get("provider") or "Curator", saved["path"], saved["filename"], saved["size"], game["id"]),
    )
    conn.commit()
    conn.close()
    return {"downloaded": True, "provider": best.get("provider"), "filename": saved.get("filename")}


def run_game(game_id, include_manual=True, progress_callback=None):
    conn = get_connection()
    row = conn.execute("SELECT * FROM games WHERE id=?", (game_id,)).fetchone()
    if not row:
        conn.close()
        return {"success": False, "message": "Game not found."}
    game = dict(row)
    if int(game.get("curator_paused") or 0):
        conn.close()
        return {"success": False, "message": "Curator is paused for this game."}
    conn.execute("UPDATE games SET curator_status='cataloging', curator_last_error='', curator_last_run=? WHERE id=?", (_now(), game_id))
    conn.commit(); conn.close()

    actions = []
    def report(progress, stage):
        conn = get_connection()
        conn.execute("UPDATE curator_jobs SET status='running', progress=?, stage=?, updated_at=CURRENT_TIMESTAMP WHERE game_id=?", (int(progress), stage, game_id))
        conn.commit(); conn.close()
        if progress_callback:
            progress_callback(int(progress), stage)
    try:
        report(8, "Identifying game")
        if int(game.get("metadata_locked") or 0):
            actions.append({"metadata": "skipped", "reason": "metadata locked"})
        else:
            report(24, "Researching game information")
            result = apply_merge_best(game_id, game.get("title") or "", enrich=True)
            if result.get("success"):
                actions.append({"metadata": "merged", "message": result.get("message")})
            else:
                actions.append({"metadata": "review", "message": result.get("message")})

        report(52, "Building museum record")
        conn = get_connection(); refreshed = conn.execute("SELECT * FROM games WHERE id=?", (game_id,)).fetchone(); conn.close()
        if include_manual and refreshed:
            try:
                report(72, "Looking for a manual")
                actions.append({"manual": _auto_manual(dict(refreshed))})
            except Exception as exc:
                actions.append({"manual": "review", "message": str(exc)})

        report(90, "Calculating readiness")
        summary = refresh_game_score(game_id) or {"score": 0, "status": "needs_review", "missing": []}
        final_status = summary["status"]
        conn = get_connection()
        conn.execute("UPDATE games SET curator_status=?, curator_last_error='', curator_last_run=? WHERE id=?", (final_status, _now(), game_id))
        conn.execute("UPDATE curator_jobs SET status='complete', progress=100, stage='Museum Ready', result_json=?, attempts=attempts+1, last_error='', updated_at=CURRENT_TIMESTAMP WHERE game_id=?", (json.dumps(summary), game_id))
        conn.commit(); conn.close()
        _history(game_id, "curate", "complete", f"Cataloging finished at {summary['score']}%.", {"actions": actions, **summary})
        return {"success": True, "game_id": game_id, "actions": actions, **summary}
    except Exception as exc:
        conn = get_connection()
        conn.execute("UPDATE games SET curator_status='needs_review', curator_last_error=?, curator_last_run=? WHERE id=?", (str(exc), _now(), game_id))
        conn.execute("UPDATE curator_jobs SET status='failed', stage='Needs Review', result_json=?, attempts=attempts+1, last_error=?, updated_at=CURRENT_TIMESTAMP WHERE game_id=?", (json.dumps({'message': str(exc)}), str(exc), game_id))
        conn.commit(); conn.close()
        _history(game_id, "curate", "failed", str(exc))
        return {"success": False, "game_id": game_id, "message": str(exc)}


def run_queue(limit=5):
    conn = get_connection()
    rows = conn.execute("SELECT game_id FROM curator_jobs WHERE status IN ('queued','failed') ORDER BY updated_at ASC LIMIT ?", (max(1, min(int(limit), 25)),)).fetchall()
    conn.close()
    results = [run_game(row["game_id"]) for row in rows]
    return {"processed": len(results), "results": results}


def curator_status():
    conn = get_connection()
    counts = {row["status"]: row["count"] for row in conn.execute("SELECT status, COUNT(*) count FROM curator_jobs GROUP BY status").fetchall()}
    games = [dict(row) for row in conn.execute("""
        SELECT g.*,
               j.status AS curator_job_status,
               COALESCE(j.progress, 0) AS curator_job_progress,
               COALESCE(j.stage, '') AS curator_job_stage,
               COALESCE(j.last_error, '') AS curator_job_error
        FROM games g
        LEFT JOIN curator_jobs j ON j.game_id = g.id
        ORDER BY g.curator_score ASC, g.title COLLATE NOCASE
        LIMIT 100
    """).fetchall()]
    history = [dict(row) for row in conn.execute("SELECT h.*, g.title FROM curator_history h LEFT JOIN games g ON g.id=h.game_id ORDER BY h.id DESC LIMIT 20").fetchall()]
    conn.close()
    return {"counts": counts, "games": games, "history": history}
