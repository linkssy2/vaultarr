import hashlib
import json
import os
import shutil
import sqlite3
import tempfile
import zipfile
from datetime import datetime, timedelta
from pathlib import Path

from app.database.database import APP_DIR, DB_PATH

ARCHIVES_DIR = APP_DIR / "archives"
COVERS_DIR = APP_DIR / "covers"
MANUALS_DIR = APP_DIR / "manuals"
MEDIA_DIR = APP_DIR / "media"
CACHE_DIR = APP_DIR / "cache"
SETTINGS_DIR = APP_DIR / "settings"
IMPORTS_DIR = APP_DIR / "imports"
BACKUP_SETTINGS_FILE = SETTINGS_DIR / "archive_settings.json"
BACKUP_LOG_FILE = ARCHIVES_DIR / "backup_history.json"

ARCHIVE_VERSION = 1


def _now_stamp():
    return datetime.now().strftime("%Y-%m-%d_%H-%M-%S")


def _ensure_dirs():
    for path in [ARCHIVES_DIR, IMPORTS_DIR, COVERS_DIR, MANUALS_DIR, MEDIA_DIR, CACHE_DIR, SETTINGS_DIR, DB_PATH.parent]:
        path.mkdir(parents=True, exist_ok=True)


def _hash_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def _dir_size(path):
    if not path.exists():
        return 0
    total = 0
    for file in path.rglob("*"):
        if file.is_file():
            try:
                total += file.stat().st_size
            except OSError:
                pass
    return total


def _count_files(path):
    if not path.exists():
        return 0
    return sum(1 for item in path.rglob("*") if item.is_file())


def _safe_arcname(prefix, path):
    return str(Path(prefix) / path.name)


def _write_dir(zf, source_dir, archive_prefix, manifest_assets):
    if not source_dir.exists():
        return
    for item in source_dir.rglob("*"):
        if not item.is_file():
            continue
        rel = item.relative_to(source_dir)
        arcname = str(Path(archive_prefix) / rel)
        zf.write(item, arcname)
        try:
            manifest_assets.append({
                "path": arcname,
                "size": item.stat().st_size,
                "sha256": _hash_file(item),
            })
        except OSError:
            pass


def _copy_sqlite_snapshot(destination):
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    if not DB_PATH.exists():
        conn = sqlite3.connect(DB_PATH)
        conn.close()

    source = sqlite3.connect(DB_PATH)
    try:
        dest = sqlite3.connect(destination)
        try:
            source.backup(dest)
        finally:
            dest.close()
    finally:
        source.close()


def create_archive(name="", include_cache=True, include_provider_cache=True, destination_dir=None):
    _ensure_dirs()
    destination_dir = Path(destination_dir) if destination_dir else ARCHIVES_DIR
    destination_dir.mkdir(parents=True, exist_ok=True)

    safe_name = "".join(c for c in (name or "vaultarr_backup") if c.isalnum() or c in ("-", "_", " ")).strip().replace(" ", "_")
    filename = f"{safe_name or 'vaultarr_backup'}_{_now_stamp()}.vaultarr"
    output_path = destination_dir / filename

    manifest_assets = []
    with tempfile.TemporaryDirectory() as tmp:
        tmp_db = Path(tmp) / "vaultarr.sqlite3"
        _copy_sqlite_snapshot(tmp_db)

        manifest = {
            "format": "vaultarr_archive",
            "archive_version": ARCHIVE_VERSION,
            "created_at": datetime.now().isoformat(timespec="seconds"),
            "vaultarr_build": "Alpha 23.4",
            "assets": manifest_assets,
            "includes": {
                "database": True,
                "covers": COVERS_DIR.exists(),
                "manuals": MANUALS_DIR.exists(),
                "media": MEDIA_DIR.exists(),
                "settings": SETTINGS_DIR.exists(),
                "cache": bool(include_cache and CACHE_DIR.exists()),
                "provider_cache": bool(include_provider_cache and CACHE_DIR.exists()),
            },
        }

        with zipfile.ZipFile(output_path, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
            zf.write(tmp_db, "database/vaultarr.sqlite3")
            manifest_assets.append({"path": "database/vaultarr.sqlite3", "size": tmp_db.stat().st_size, "sha256": _hash_file(tmp_db)})

            _write_dir(zf, COVERS_DIR, "covers", manifest_assets)
            _write_dir(zf, MANUALS_DIR, "manuals", manifest_assets)
            _write_dir(zf, MEDIA_DIR, "media", manifest_assets)
            _write_dir(zf, SETTINGS_DIR, "settings", manifest_assets)
            if include_cache:
                _write_dir(zf, CACHE_DIR, "cache", manifest_assets)

            zf.writestr("manifest.json", json.dumps(manifest, indent=2))

    return archive_info(output_path)


def archive_info(path):
    path = Path(path)
    info = {
        "name": path.name,
        "path": str(path),
        "size": path.stat().st_size if path.exists() else 0,
        "size_mb": round((path.stat().st_size if path.exists() else 0) / 1024 / 1024, 2),
        "modified": datetime.fromtimestamp(path.stat().st_mtime).isoformat(timespec="seconds") if path.exists() else "",
        "valid": False,
        "created_at": "",
        "build": "",
        "assets": 0,
    }
    try:
        with zipfile.ZipFile(path, "r") as zf:
            with zf.open("manifest.json") as f:
                manifest = json.loads(f.read().decode("utf-8"))
            info["valid"] = manifest.get("format") == "vaultarr_archive"
            info["created_at"] = manifest.get("created_at", "")
            info["build"] = manifest.get("vaultarr_build", "")
            info["assets"] = len(manifest.get("assets", []))
    except Exception:
        pass
    return info


def list_local_archives():
    _ensure_dirs()
    return sorted([archive_info(p) for p in ARCHIVES_DIR.glob("*.vaultarr")], key=lambda i: i.get("modified", ""), reverse=True)


def common_cloud_folders():
    home = Path(os.path.expanduser("~"))
    candidates = [
        ("OneDrive", home / "OneDrive"),
        ("Dropbox", home / "Dropbox"),
        ("Google Drive", home / "Google Drive"),
        ("Google Drive", home / "My Drive"),
        ("Google Drive", home / "GoogleDrive"),
    ]
    found = []
    for provider, path in candidates:
        if path.exists():
            found.append({"provider": provider, "path": str(path), "exists": True})
    return found


def list_cloud_archives(folder):
    if not folder:
        return []
    path = Path(folder).expanduser()
    if not path.exists() or not path.is_dir():
        return []
    archives = []
    for pattern in ("*.vaultarr", "*.zip"):
        for file in path.glob(pattern):
            if file.is_file():
                archives.append(archive_info(file))
    return sorted(archives, key=lambda i: i.get("modified", ""), reverse=True)


def verify_archive(path):
    path = Path(path)
    if not path.exists():
        return {"valid": False, "message": "Archive was not found.", "info": {}}
    try:
        with zipfile.ZipFile(path, "r") as zf:
            bad = zf.testzip()
            if bad:
                return {"valid": False, "message": f"Archive failed zip integrity at {bad}.", "info": archive_info(path)}
            with zf.open("manifest.json") as f:
                manifest = json.loads(f.read().decode("utf-8"))
            if manifest.get("format") != "vaultarr_archive":
                return {"valid": False, "message": "Not a Vaultarr archive.", "info": archive_info(path)}
            return {"valid": True, "message": "Archive verified.", "info": archive_info(path), "manifest": manifest}
    except Exception as exc:
        return {"valid": False, "message": str(exc), "info": archive_info(path) if path.exists() else {}}


def _restore_dir(extracted_root, source_name, destination):
    source = extracted_root / source_name
    if not source.exists():
        return 0
    destination.mkdir(parents=True, exist_ok=True)
    count = 0
    for item in source.rglob("*"):
        if item.is_file():
            rel = item.relative_to(source)
            target = destination / rel
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(item, target)
            count += 1
    return count


def import_archive(path, mode="replace"):
    _ensure_dirs()
    path = Path(path)
    verified = verify_archive(path)
    if not verified.get("valid"):
        raise ValueError(verified.get("message") or "Archive failed verification.")

    backup_path = None
    if DB_PATH.exists():
        backup_path = ARCHIVES_DIR / f"pre_restore_database_{_now_stamp()}.sqlite3"
        shutil.copy2(DB_PATH, backup_path)

    with tempfile.TemporaryDirectory() as tmp:
        tmp_root = Path(tmp)
        with zipfile.ZipFile(path, "r") as zf:
            zf.extractall(tmp_root)

        restored = {"database": False, "covers": 0, "manuals": 0, "media": 0, "settings": 0, "cache": 0}

        if mode == "replace":
            db_file = tmp_root / "database" / "vaultarr.sqlite3"
            if db_file.exists():
                DB_PATH.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(db_file, DB_PATH)
                restored["database"] = True

        restored["covers"] = _restore_dir(tmp_root, "covers", COVERS_DIR)
        restored["manuals"] = _restore_dir(tmp_root, "manuals", MANUALS_DIR)
        restored["media"] = _restore_dir(tmp_root, "media", MEDIA_DIR)
        restored["settings"] = _restore_dir(tmp_root, "settings", SETTINGS_DIR)
        restored["cache"] = _restore_dir(tmp_root, "cache", CACHE_DIR)

    return {
        "success": True,
        "mode": mode,
        "restored": restored,
        "backup_database": str(backup_path) if backup_path else "",
    }


def save_uploaded_archive(file_storage):
    _ensure_dirs()
    original = Path(file_storage.filename or "uploaded.vaultarr").name
    if not original.endswith((".vaultarr", ".zip")):
        original = f"{original}.vaultarr"
    target = IMPORTS_DIR / f"import_{_now_stamp()}_{original}"
    file_storage.save(target)
    return archive_info(target)



def default_backup_settings():
    return {
        "enabled": False,
        "backup_folder": str(ARCHIVES_DIR),
        "schedule": "daily",
        "retention_count": 20,
        "include_cache": True,
        "verify_after_backup": True,
        "compress_backup": True,
        "keep_monthly_snapshots": False,
        "last_run": "",
        "next_run": "",
    }


def load_backup_settings():
    _ensure_dirs()
    settings = default_backup_settings()
    if BACKUP_SETTINGS_FILE.exists():
        try:
            with open(BACKUP_SETTINGS_FILE, "r", encoding="utf-8") as f:
                loaded = json.load(f)
            if isinstance(loaded, dict):
                settings.update(loaded)
        except Exception:
            pass
    settings["retention_count"] = max(1, int(settings.get("retention_count") or 20))
    if not settings.get("backup_folder"):
        settings["backup_folder"] = str(ARCHIVES_DIR)
    return settings


def save_backup_settings(data):
    _ensure_dirs()
    current = load_backup_settings()
    current.update({
        "enabled": bool(data.get("enabled")),
        "backup_folder": str(Path(data.get("backup_folder") or ARCHIVES_DIR).expanduser()),
        "schedule": data.get("schedule") or "daily",
        "retention_count": max(1, int(data.get("retention_count") or 20)),
        "include_cache": bool(data.get("include_cache")),
        "verify_after_backup": bool(data.get("verify_after_backup")),
        "compress_backup": bool(data.get("compress_backup", True)),
        "keep_monthly_snapshots": bool(data.get("keep_monthly_snapshots")),
    })
    current["next_run"] = calculate_next_run(current).isoformat(timespec="seconds") if current["enabled"] else ""
    SETTINGS_DIR.mkdir(parents=True, exist_ok=True)
    with open(BACKUP_SETTINGS_FILE, "w", encoding="utf-8") as f:
        json.dump(current, f, indent=2)
    return current


def _schedule_delta(schedule):
    schedule = (schedule or "daily").lower()
    if schedule == "hourly":
        return timedelta(hours=1)
    if schedule == "weekly":
        return timedelta(days=7)
    if schedule == "monthly":
        return timedelta(days=30)
    return timedelta(days=1)


def calculate_next_run(settings=None):
    settings = settings or load_backup_settings()
    last = settings.get("last_run")
    try:
        base = datetime.fromisoformat(last) if last else datetime.now()
    except Exception:
        base = datetime.now()
    next_run = base + _schedule_delta(settings.get("schedule"))
    if not last:
        next_run = datetime.now() + _schedule_delta(settings.get("schedule"))
    return next_run


def _load_backup_history():
    if not BACKUP_LOG_FILE.exists():
        return []
    try:
        with open(BACKUP_LOG_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data if isinstance(data, list) else []
    except Exception:
        return []


def _write_backup_history(items):
    ARCHIVES_DIR.mkdir(parents=True, exist_ok=True)
    with open(BACKUP_LOG_FILE, "w", encoding="utf-8") as f:
        json.dump(items[:100], f, indent=2)


def log_backup_event(kind, status, message, archive=None):
    items = _load_backup_history()
    items.insert(0, {
        "time": datetime.now().isoformat(timespec="seconds"),
        "kind": kind,
        "status": status,
        "message": message,
        "archive": archive or {},
    })
    _write_backup_history(items)


def prune_backups(folder=None, retention_count=None, keep_monthly=False):
    folder = Path(folder or ARCHIVES_DIR).expanduser()
    retention_count = max(1, int(retention_count or 20))
    if not folder.exists():
        return {"deleted": 0, "kept": 0}
    archives = sorted([p for p in folder.glob("*.vaultarr") if p.is_file()], key=lambda p: p.stat().st_mtime, reverse=True)
    protected = set(archives[:retention_count])
    if keep_monthly:
        seen_months = set()
        for item in archives:
            stamp = datetime.fromtimestamp(item.stat().st_mtime).strftime("%Y-%m")
            if stamp not in seen_months:
                protected.add(item)
                seen_months.add(stamp)
    deleted = 0
    for item in archives:
        if item in protected:
            continue
        try:
            item.unlink()
            deleted += 1
        except OSError:
            pass
    return {"deleted": deleted, "kept": len(protected)}


def run_scheduled_backup(manual=False):
    settings = load_backup_settings()
    folder = Path(settings.get("backup_folder") or ARCHIVES_DIR).expanduser()
    folder.mkdir(parents=True, exist_ok=True)
    try:
        info = create_archive(
            name="vaultarr_time_capsule" if not manual else "vaultarr_manual_backup",
            include_cache=settings.get("include_cache", True),
            destination_dir=folder,
        )
        verification = verify_archive(info["path"]) if settings.get("verify_after_backup", True) else {"valid": True, "message": "Verification skipped."}
        if not verification.get("valid"):
            log_backup_event("Manual Backup" if manual else "Automatic Backup", "error", verification.get("message", "Verification failed."), info)
            return {"success": False, "archive": info, "message": verification.get("message", "Verification failed.")}
        prune = prune_backups(folder, settings.get("retention_count"), settings.get("keep_monthly_snapshots"))
        settings["last_run"] = datetime.now().isoformat(timespec="seconds")
        settings["next_run"] = calculate_next_run(settings).isoformat(timespec="seconds") if settings.get("enabled") else ""
        with open(BACKUP_SETTINGS_FILE, "w", encoding="utf-8") as f:
            json.dump(settings, f, indent=2)
        message = f"Backup verified. Pruned {prune['deleted']} old backup(s)."
        log_backup_event("Manual Backup" if manual else "Automatic Backup", "ok", message, info)
        return {"success": True, "archive": info, "message": message, "prune": prune}
    except Exception as exc:
        log_backup_event("Manual Backup" if manual else "Automatic Backup", "error", str(exc))
        return {"success": False, "message": str(exc), "archive": {}}


def scheduled_backup_due():
    settings = load_backup_settings()
    if not settings.get("enabled"):
        return False
    next_run = settings.get("next_run")
    if not next_run:
        settings["next_run"] = calculate_next_run(settings).isoformat(timespec="seconds")
        with open(BACKUP_SETTINGS_FILE, "w", encoding="utf-8") as f:
            json.dump(settings, f, indent=2)
        return False
    try:
        return datetime.now() >= datetime.fromisoformat(next_run)
    except Exception:
        return True


def run_due_backup_if_needed():
    if scheduled_backup_due():
        return run_scheduled_backup(manual=False)
    return None


def archive_status(cloud_folder=""):
    _ensure_dirs()
    database_size = DB_PATH.stat().st_size if DB_PATH.exists() else 0
    covers_size = _dir_size(COVERS_DIR)
    manuals_size = _dir_size(MANUALS_DIR)
    media_size = _dir_size(MEDIA_DIR)
    cache_size = _dir_size(CACHE_DIR)
    estimated_size = database_size + covers_size + manuals_size + media_size + cache_size
    return {
        "app_dir": str(APP_DIR),
        "archives_dir": str(ARCHIVES_DIR),
        "database_exists": DB_PATH.exists(),
        "database_size_mb": round(database_size / 1024 / 1024, 2),
        "covers": _count_files(COVERS_DIR),
        "covers_size_mb": round(covers_size / 1024 / 1024, 2),
        "manuals": _count_files(MANUALS_DIR),
        "manuals_size_mb": round(manuals_size / 1024 / 1024, 2),
        "media": _count_files(MEDIA_DIR),
        "media_size_mb": round(media_size / 1024 / 1024, 2),
        "cache_size_mb": round(cache_size / 1024 / 1024, 2),
        "estimated_backup_size_mb": round(estimated_size / 1024 / 1024, 2),
        "local_archives": list_local_archives(),
        "scheduled_archives": list_cloud_archives(load_backup_settings().get("backup_folder")),
        "backup_settings": load_backup_settings(),
        "backup_history": _load_backup_history(),
        "cloud_folders": common_cloud_folders(),
        "cloud_archives": list_cloud_archives(cloud_folder),
    }
