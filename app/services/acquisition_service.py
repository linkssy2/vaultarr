from __future__ import annotations

import ipaddress
import os
import re
import socket
from pathlib import Path
from urllib.parse import unquote, urlparse

import requests

from app.database.database import APP_DIR, get_connection

ACQUISITIONS_DIR = Path(os.getenv("VAULTARR_ACQUISITIONS_DIR", str(APP_DIR / "acquisitions"))).resolve()
MAX_DOWNLOAD_BYTES = int(os.getenv("VAULTARR_MAX_ACQUISITION_BYTES", str(20 * 1024 * 1024 * 1024)))
ALLOWED_SCHEMES = {"http", "https"}


def _safe_filename(value: str, fallback: str = "download.bin") -> str:
    value = unquote(value or "").strip().replace("\\", "/").split("/")[-1]
    value = re.sub(r"[^A-Za-z0-9._()\- ]+", "_", value).strip(" .")
    return value[:180] or fallback


def _safe_subfolder(platform: str) -> str:
    value = re.sub(r"[^A-Za-z0-9._\- ]+", "_", (platform or "Unsorted").strip())
    return value[:80].strip(" .") or "Unsorted"


def _validate_public_url(url: str) -> str:
    parsed = urlparse(url)
    if parsed.scheme.lower() not in ALLOWED_SCHEMES or not parsed.hostname:
        raise ValueError("Only public HTTP or HTTPS download URLs are supported.")

    host = parsed.hostname.lower().rstrip(".")
    if host in {"localhost", "localhost.localdomain"}:
        raise ValueError("Local network addresses are not allowed.")

    try:
        addresses = {item[4][0] for item in socket.getaddrinfo(host, parsed.port or 443, type=socket.SOCK_STREAM)}
    except socket.gaierror as exc:
        raise ValueError("The download host could not be resolved.") from exc

    for address in addresses:
        ip = ipaddress.ip_address(address)
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved or ip.is_multicast:
            raise ValueError("Private or local network download addresses are not allowed.")
    return url


def _filename_from_response(response: requests.Response, url: str, title: str) -> str:
    disposition = response.headers.get("Content-Disposition", "")
    match = re.search(r"filename\*?=(?:UTF-8''|\")?([^\";]+)", disposition, flags=re.I)
    candidate = match.group(1) if match else Path(urlparse(url).path).name
    fallback = f"{_safe_filename(title, 'game')}.zip"
    return _safe_filename(candidate, fallback)


def save_acquisition_link(game_id: int, url: str, provider: str = "User-provided URL", title: str = "") -> dict:
    _validate_public_url(url)
    conn = get_connection()
    game = conn.execute("SELECT id FROM games WHERE id=?", (game_id,)).fetchone()
    if game is None:
        conn.close()
        raise ValueError("Game not found.")
    conn.execute(
        """
        UPDATE games SET rom_url=?, rom_provider=?, rom_title=?, rom_checked_at=CURRENT_TIMESTAMP,
        updated_at=CURRENT_TIMESTAMP WHERE id=?
        """,
        (url, provider[:120], title[:240], game_id),
    )
    conn.commit()
    conn.close()
    return {"success": True}


def download_acquisition(game_id: int, url: str, provider: str = "User-provided URL") -> dict:
    _validate_public_url(url)
    conn = get_connection()
    game = conn.execute("SELECT * FROM games WHERE id=?", (game_id,)).fetchone()
    conn.close()
    if game is None:
        raise ValueError("Game not found.")

    headers = {
        "User-Agent": "Vaultarr/1.5.0 (+self-hosted archival acquisition)",
        "Accept": "application/octet-stream,application/zip,application/x-7z-compressed,application/x-rar-compressed,*/*;q=0.5",
    }
    with requests.get(url, stream=True, timeout=(15, 120), allow_redirects=True, headers=headers) as response:
        response.raise_for_status()
        final_url = _validate_public_url(response.url)
        content_length = int(response.headers.get("Content-Length") or 0)
        if content_length and content_length > MAX_DOWNLOAD_BYTES:
            raise ValueError("The file is larger than Vaultarr's configured download limit.")

        filename = _filename_from_response(response, final_url, game["title"])
        target_dir = ACQUISITIONS_DIR / _safe_subfolder(game["platform"])
        target_dir.mkdir(parents=True, exist_ok=True)
        destination = target_dir / filename
        temporary = destination.with_suffix(destination.suffix + ".part")

        total = 0
        try:
            with temporary.open("wb") as handle:
                for chunk in response.iter_content(chunk_size=1024 * 1024):
                    if not chunk:
                        continue
                    total += len(chunk)
                    if total > MAX_DOWNLOAD_BYTES:
                        raise ValueError("The file exceeded Vaultarr's configured download limit.")
                    handle.write(chunk)
            temporary.replace(destination)
        except Exception:
            temporary.unlink(missing_ok=True)
            raise

    relative = destination.relative_to(ACQUISITIONS_DIR)
    conn = get_connection()
    conn.execute(
        """
        UPDATE games SET rom_url=?, rom_provider=?, rom_title=?, rom_file_path=?, rom_file_name=?,
        rom_file_size=?, rom_downloaded_at=CURRENT_TIMESTAMP, rom_checked_at=CURRENT_TIMESTAMP,
        updated_at=CURRENT_TIMESTAMP WHERE id=?
        """,
        (final_url, provider[:120], game["title"], str(relative), filename, total, game_id),
    )
    conn.commit()
    conn.close()
    return {"success": True, "filename": filename, "relative_path": str(relative), "size": total}
