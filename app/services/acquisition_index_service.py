import csv
import hashlib
import io
import json
import re
from pathlib import Path
from urllib.parse import urlparse

from app.database.database import APP_DIR, get_connection

INDEX_DIR = APP_DIR / "acquisition_indexes"
ALLOWED_EXTENSIONS = {".json", ".csv"}
MAX_UPLOAD_BYTES = 25 * 1024 * 1024


def _clean(value, limit=2000):
    text = str(value or "").strip()
    return text[:limit]


def _normalize_title(value):
    text = _clean(value, 500).lower().replace("&", " and ")
    text = re.sub(r"\bthe\b", " ", text)
    text = re.sub(r"[^a-z0-9]+", " ", text)
    return " ".join(text.split())


def _valid_http_url(value):
    if not value:
        return True
    try:
        parsed = urlparse(value)
        return parsed.scheme in {"http", "https"} and bool(parsed.netloc)
    except Exception:
        return False


def _iter_json(raw):
    payload = json.loads(raw.decode("utf-8-sig"))
    if isinstance(payload, list):
        entries = payload
        name = "Imported JSON Catalog"
    elif isinstance(payload, dict):
        entries = payload.get("entries") or payload.get("games") or payload.get("items") or []
        name = _clean(payload.get("catalog_name") or payload.get("name") or "Imported JSON Catalog", 200)
    else:
        raise ValueError("JSON must contain an array of entries or an object with an entries array.")
    if not isinstance(entries, list):
        raise ValueError("The JSON entries value must be an array.")
    return name, entries


def _iter_csv(raw):
    text = raw.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(text))
    if not reader.fieldnames:
        raise ValueError("The CSV file does not contain a header row.")
    return "Imported CSV Catalog", list(reader)


def _entry_from_mapping(item):
    if not isinstance(item, dict):
        return None
    title = _clean(item.get("title") or item.get("name"), 500)
    if not title:
        return None
    source_page = _clean(item.get("source_page") or item.get("page_url") or item.get("source_url"), 2000)
    download_url = _clean(item.get("download_url") or item.get("url") or item.get("link"), 2000)
    if not _valid_http_url(source_page) or not _valid_http_url(download_url):
        return None
    try:
        size_bytes = int(item.get("size_bytes") or item.get("size") or 0)
    except (TypeError, ValueError):
        size_bytes = 0
    return {
        "title": title,
        "normalized_title": _normalize_title(title),
        "platform": _clean(item.get("platform") or item.get("system"), 250),
        "region": _clean(item.get("region"), 100),
        "version": _clean(item.get("version") or item.get("revision"), 120),
        "format": _clean(item.get("format") or item.get("file_format") or item.get("extension"), 100),
        "size_bytes": max(size_bytes, 0),
        "source_page": source_page,
        "download_url": download_url,
        "checksum_sha256": _clean(item.get("checksum_sha256") or item.get("sha256"), 128),
        "notes": _clean(item.get("notes") or item.get("description"), 2000),
    }


def import_catalog(file_storage, display_name=""):
    filename = Path(file_storage.filename or "catalog").name
    extension = Path(filename).suffix.lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise ValueError("Only JSON and CSV acquisition indexes are supported.")
    raw = file_storage.read(MAX_UPLOAD_BYTES + 1)
    if len(raw) > MAX_UPLOAD_BYTES:
        raise ValueError("The acquisition index is larger than the 25 MB upload limit.")
    if not raw:
        raise ValueError("The uploaded acquisition index is empty.")

    default_name, source_entries = _iter_json(raw) if extension == ".json" else _iter_csv(raw)
    entries = [entry for entry in (_entry_from_mapping(item) for item in source_entries) if entry]
    if not entries:
        raise ValueError("No valid acquisition entries were found in the uploaded file.")

    catalog_name = _clean(display_name or default_name or Path(filename).stem, 200)
    digest = hashlib.sha256(raw).hexdigest()
    INDEX_DIR.mkdir(parents=True, exist_ok=True)
    saved_name = f"{digest[:16]}{extension}"
    (INDEX_DIR / saved_name).write_bytes(raw)

    conn = get_connection()
    cursor = conn.execute(
        "INSERT INTO acquisition_indexes (name, original_filename, stored_filename, file_type, entry_count, sha256, enabled, imported_at, updated_at) VALUES (?,?,?,?,?,?,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)",
        (catalog_name, filename, saved_name, extension.lstrip("."), len(entries), digest),
    )
    index_id = cursor.lastrowid
    conn.executemany(
        """
        INSERT INTO acquisition_entries (
            index_id,title,normalized_title,platform,region,version,format,size_bytes,
            source_page,download_url,checksum_sha256,notes
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
        """,
        [(
            index_id, entry["title"], entry["normalized_title"], entry["platform"], entry["region"],
            entry["version"], entry["format"], entry["size_bytes"], entry["source_page"],
            entry["download_url"], entry["checksum_sha256"], entry["notes"]
        ) for entry in entries],
    )
    conn.commit()
    conn.close()
    return {"index_id": index_id, "name": catalog_name, "entries": len(entries)}


def list_catalogs():
    conn = get_connection()
    rows = conn.execute("SELECT * FROM acquisition_indexes ORDER BY name COLLATE NOCASE").fetchall()
    conn.close()
    return rows


def remove_catalog(index_id):
    conn = get_connection()
    row = conn.execute("SELECT stored_filename FROM acquisition_indexes WHERE id=?", (index_id,)).fetchone()
    conn.execute("DELETE FROM acquisition_entries WHERE index_id=?", (index_id,))
    conn.execute("DELETE FROM acquisition_indexes WHERE id=?", (index_id,))
    conn.commit()
    conn.close()
    if row and row["stored_filename"]:
        try:
            (INDEX_DIR / row["stored_filename"]).unlink(missing_ok=True)
        except OSError:
            pass


def set_catalog_enabled(index_id, enabled):
    conn = get_connection()
    conn.execute("UPDATE acquisition_indexes SET enabled=?, updated_at=CURRENT_TIMESTAMP WHERE id=?", (1 if enabled else 0, index_id))
    conn.commit()
    conn.close()


def search_catalogs(query, platform="", limit=80):
    normalized = _normalize_title(query)
    if not normalized:
        return []
    tokens = normalized.split()
    conn = get_connection()
    rows = conn.execute(
        """
        SELECT e.*, i.name AS index_name
        FROM acquisition_entries e
        JOIN acquisition_indexes i ON i.id=e.index_id
        WHERE i.enabled=1 AND e.normalized_title LIKE ?
        ORDER BY e.title COLLATE NOCASE
        LIMIT ?
        """,
        (f"%{normalized}%", max(limit * 2, 100)),
    ).fetchall()
    if not rows and tokens:
        clauses = " AND ".join(["e.normalized_title LIKE ?" for _ in tokens])
        rows = conn.execute(
            f"""
            SELECT e.*, i.name AS index_name
            FROM acquisition_entries e
            JOIN acquisition_indexes i ON i.id=e.index_id
            WHERE i.enabled=1 AND {clauses}
            ORDER BY e.title COLLATE NOCASE
            LIMIT ?
            """,
            tuple([f"%{token}%" for token in tokens] + [max(limit * 2, 100)]),
        ).fetchall()
    conn.close()

    platform_norm = _normalize_title(platform)
    results = []
    for row in rows:
        title_norm = row["normalized_title"] or ""
        if title_norm == normalized:
            score = 96
        elif normalized in title_norm:
            score = 88
        else:
            shared = len(set(tokens) & set(title_norm.split()))
            score = 55 + min(28, shared * 7)
        if platform_norm and platform_norm == _normalize_title(row["platform"]):
            score += 4
        results.append({**dict(row), "match_score": min(score, 100)})
    results.sort(key=lambda item: (-item["match_score"], item["title"].lower()))
    return results[:limit]


def attach_local_file(game_id, local_path, entry_id=None):
    path = _clean(local_path, 2000)
    if not path:
        raise ValueError("Choose or enter a local file path.")
    conn = get_connection()
    entry = None
    if entry_id:
        entry = conn.execute("SELECT * FROM acquisition_entries WHERE id=?", (entry_id,)).fetchone()
    conn.execute(
        """
        INSERT INTO game_acquisitions (game_id, entry_id, local_path, source_page, download_url, status, attached_at, updated_at)
        VALUES (?,?,?,?,?,'acquired',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
        ON CONFLICT(game_id) DO UPDATE SET
            entry_id=excluded.entry_id, local_path=excluded.local_path,
            source_page=excluded.source_page, download_url=excluded.download_url,
            status='acquired', updated_at=CURRENT_TIMESTAMP
        """,
        (game_id, entry_id, path, entry["source_page"] if entry else "", entry["download_url"] if entry else ""),
    )
    conn.commit()
    conn.close()


def get_game_acquisition(game_id):
    conn = get_connection()
    row = conn.execute(
        """
        SELECT ga.*, e.title AS entry_title, e.platform AS entry_platform, i.name AS index_name
        FROM game_acquisitions ga
        LEFT JOIN acquisition_entries e ON e.id=ga.entry_id
        LEFT JOIN acquisition_indexes i ON i.id=e.index_id
        WHERE ga.game_id=?
        """,
        (game_id,),
    ).fetchone()
    conn.close()
    return row
