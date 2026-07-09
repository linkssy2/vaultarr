from pathlib import Path
import os
import sqlite3
from app.database.database import DB_PATH, APP_DIR, get_connection
from app.services.media_service import media_cache_summary
from app.services.launchbox_service import sync_status


def _count(conn, sql):
    try:
        return conn.execute(sql).fetchone()[0]
    except Exception:
        return 0


def system_health():
    conn = get_connection()
    games = _count(conn, 'SELECT COUNT(*) FROM games')
    libraries = _count(conn, 'SELECT COUNT(*) FROM libraries')
    media_assets = _count(conn, 'SELECT COUNT(*) FROM media_assets')
    manual_files = _count(conn, "SELECT COUNT(*) FROM games WHERE COALESCE(manual_file_path,'') != ''")
    bad_covers = _count(conn, "SELECT COUNT(*) FROM games WHERE COALESCE(cover_path,'') = ''")
    missing_metadata = _count(conn, "SELECT COUNT(*) FROM games WHERE COALESCE(description,'') = '' OR COALESCE(metadata_source,'') = ''")
    conn.close()

    db_size = DB_PATH.stat().st_size if DB_PATH.exists() else 0
    media_cache = media_cache_summary()
    launchbox = sync_status()

    checks = [
        {"name": "Database", "status": "Healthy" if DB_PATH.exists() else "Needs Setup", "detail": f"{round(db_size/1024/1024,2)} MB", "tone": "good" if DB_PATH.exists() else "warn"},
        {"name": "Libraries", "status": "Ready" if libraries else "No libraries", "detail": f"{libraries} root(s)", "tone": "good" if libraries else "warn"},
        {"name": "Games", "status": "Cataloged" if games else "Waiting", "detail": f"{games} games", "tone": "good" if games else "warn"},
        {"name": "Media Cache", "status": "Healthy", "detail": f"{media_cache.get('size_mb',0)} MB · {media_assets} tracked", "tone": "good"},
        {"name": "Manual Library", "status": "Indexed" if manual_files else "Optional", "detail": f"{manual_files} downloaded manuals", "tone": "good"},
        {"name": "LaunchBox", "status": "Synced" if launchbox.get('synced') else "Not synced", "detail": f"{launchbox.get('games',0)} records", "tone": "good" if launchbox.get('synced') else "neutral"},
    ]

    issues = []
    if not libraries:
        issues.append("Add a library root to begin scanning your collection.")
    if bad_covers:
        issues.append(f"{bad_covers} games are missing cover art.")
    if missing_metadata:
        issues.append(f"{missing_metadata} games need metadata review.")

    score = 100
    if not libraries: score -= 25
    if not games: score -= 20
    if games:
        score -= min(25, round((bad_covers / max(games, 1)) * 25))
        score -= min(25, round((missing_metadata / max(games, 1)) * 25))
    score = max(0, min(100, score))

    return {
        "score": score,
        "checks": checks,
        "issues": issues,
        "app_dir": str(APP_DIR),
        "db_path": str(DB_PATH),
        "games": games,
        "libraries": libraries,
        "media_cache": media_cache,
    }


def optimize_database():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.execute('VACUUM')
    conn.execute('ANALYZE')
    conn.close()
    return True
