import os
import requests
from pathlib import Path
from datetime import datetime
from app.database.database import get_connection

ROMS_DIR = Path(os.getenv('LOCALAPPDATA', '.')) / 'Vaultarr' / 'roms'
ROMS_DIR.mkdir(parents=True, exist_ok=True)

def download_rom(game_id, rom_url, title, provider="User"):
    """Download ROM and save to local roms folder"""
    try:
        response = requests.get(rom_url, stream=True, timeout=60, headers={"User-Agent": "Vaultarr/1.4"})
        response.raise_for_status()

        filename = rom_url.split("/")[-1]
        if not filename or "." not in filename:
            filename = f"{title.replace(' ', '_')}.zip"

        rom_path = ROMS_DIR / filename
        with open(rom_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)

        size = rom_path.stat().st_size

        conn = get_connection()
        conn.execute("""
            UPDATE games 
            SET rom_url=?, rom_provider=?, rom_title=?, rom_file_path=?, 
                rom_file_name=?, rom_file_size=?, rom_downloaded_at=CURRENT_TIMESTAMP,
                updated_at=CURRENT_TIMESTAMP 
            WHERE id=?
        """, (rom_url, provider, title, str(rom_path.name), filename, size, game_id))
        conn.commit()
        conn.close()

        return {"success": True, "path": str(rom_path.name), "size": size}
    except Exception as e:
        return {"success": False, "error": str(e)}


def search_roms(title, platform=""):
    """Placeholder for future provider search (Vimm, MyAbandonware, etc.)"""
    return []  # TODO: implement real search