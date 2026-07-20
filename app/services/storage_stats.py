import threading
import time
from pathlib import Path


_CACHE_TTL_SECONDS = 10.0
_cache = {}
_cache_lock = threading.Lock()
_scan_locks = {}


def directory_stats(path, max_age=_CACHE_TTL_SECONDS):
    root = Path(path)
    key = str(root.resolve())
    now = time.monotonic()

    with _cache_lock:
        cached = _cache.get(key)
        if cached and now - cached["stored_at"] < max_age:
            return dict(cached["stats"])
        scan_lock = _scan_locks.setdefault(key, threading.Lock())

    with scan_lock:
        now = time.monotonic()
        with _cache_lock:
            cached = _cache.get(key)
            if cached and now - cached["stored_at"] < max_age:
                return dict(cached["stats"])

        files = 0
        size = 0
        if root.exists():
            for item in root.rglob("*"):
                if not item.is_file():
                    continue
                files += 1
                try:
                    size += item.stat().st_size
                except OSError:
                    pass

        stats = {"files": files, "size": size}
        with _cache_lock:
            _cache[key] = {"stored_at": time.monotonic(), "stats": stats}
        return dict(stats)


def invalidate_directory_stats(path=None):
    with _cache_lock:
        if path is None:
            _cache.clear()
            return
        key = str(Path(path).resolve())
        _cache.pop(key, None)
