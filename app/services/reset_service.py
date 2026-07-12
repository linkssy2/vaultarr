import os
import shutil
from pathlib import Path

from app.database.database import APP_DIR, DB_PATH, DB_DIR
from app.database.migrations import migrate

# Data that belongs to the active vault. Time capsules are excluded by default so a
# user can reset the app without destroying their backups.
VAULT_DATA_DIRS = [
    "covers",
    "manuals",
    "media",
    "cache",
    "manual_provider_cache",
    "imports",
    "acquisition_indexes",
    "settings",
]
OPTIONAL_BACKUP_DIRS = ["archives"]


def _remove_path(path: Path):
    try:
        if path.is_dir():
            shutil.rmtree(path)
            return True
        if path.exists():
            path.unlink()
            return True
    except Exception:
        return False
    return False


def reset_vault(delete_cached_assets: bool = True, delete_time_capsules: bool = False):
    """Reset Vaultarr to a first-run state.

    This clears the active database, settings, library roots, provider settings,
    and optionally cached media/manuals/provider indexes. It intentionally keeps
    Time Capsule archives unless explicitly requested.
    """
    APP_DIR.mkdir(parents=True, exist_ok=True)
    removed = []
    failed = []

    for path in [DB_PATH]:
        if path.exists():
            if _remove_path(path):
                removed.append(str(path))
            else:
                failed.append(str(path))

    # Remove stale SQLite sidecar files if present.
    for suffix in ["-wal", "-shm", "-journal"]:
        sidecar = Path(str(DB_PATH) + suffix)
        if sidecar.exists():
            if _remove_path(sidecar):
                removed.append(str(sidecar))
            else:
                failed.append(str(sidecar))

    # Settings are always reset. Media/manual/cache dirs are controlled by the UI.
    dirs = ["settings"]
    if delete_cached_assets:
        dirs.extend(d for d in VAULT_DATA_DIRS if d != "settings")
    if delete_time_capsules:
        dirs.extend(OPTIONAL_BACKUP_DIRS)

    for name in dict.fromkeys(dirs):
        path = APP_DIR / name
        if path.exists():
            if _remove_path(path):
                removed.append(str(path))
            else:
                failed.append(str(path))

    DB_DIR.mkdir(parents=True, exist_ok=True)
    migrate()

    return {
        "success": len(failed) == 0,
        "removed": removed,
        "failed": failed,
        "app_dir": str(APP_DIR),
    }
