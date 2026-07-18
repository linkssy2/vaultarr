import os
from pathlib import Path

from werkzeug.utils import secure_filename

from app.database.database import APP_DIR, get_connection


EMULATION_DIR = APP_DIR / "emulation"
GAME_DIR = EMULATION_DIR / "games"
BIOS_DIR = EMULATION_DIR / "bios"
MAX_ROM_BYTES = 4 * 1024 * 1024 * 1024
MAX_BIOS_BYTES = 4 * 1024 * 1024

SYSTEMS = {
    "nes": {
        "label": "Nintendo Entertainment System",
        "core": "nes",
        "extensions": (".nes",),
        "platforms": ("nes", "nintendo entertainment system", "famicom"),
    },
    "snes": {
        "label": "Super Nintendo",
        "core": "snes",
        "extensions": (".sfc", ".smc"),
        "platforms": ("snes", "super nintendo", "super famicom"),
    },
    "genesis": {
        "label": "Sega Genesis / Mega Drive",
        "core": "segaMD",
        "extensions": (".md", ".gen", ".smd", ".32x"),
        "platforms": ("genesis", "sega genesis", "mega drive", "megadrive", "32x"),
    },
    "gb": {
        "label": "Game Boy / Game Boy Color",
        "core": "gb",
        "extensions": (".gb", ".gbc"),
        "platforms": ("game boy", "gameboy", "game boy color", "gameboy color", "gb", "gbc"),
    },
    "gba": {
        "label": "Game Boy Advance",
        "core": "gba",
        "extensions": (".gba",),
        "platforms": ("game boy advance", "gameboy advance", "gba"),
    },
    "psx": {
        "label": "PlayStation",
        "core": "psx",
        "extensions": (".chd", ".pbp", ".zip"),
        "platforms": ("playstation", "playstation 1", "ps1", "psx"),
        "requires_bios": True,
    },
}


def _upload_size(upload):
    stream = upload.stream
    current = stream.tell()
    stream.seek(0, os.SEEK_END)
    size = stream.tell()
    stream.seek(current)
    return size


def _system_for_extension(filename):
    extension = Path(filename or "").suffix.lower()
    for key, system in SYSTEMS.items():
        if extension in system["extensions"]:
            return key
    return None


def _system_for_platform(platform):
    value = " ".join(str(platform or "").lower().replace("-", " ").split())
    if not value:
        return None
    for key, system in SYSTEMS.items():
        if value in system["platforms"]:
            return key
    return None


def _game_directory(game_id):
    return GAME_DIR / str(int(game_id))


def _stored_rom(game_id):
    directory = _game_directory(game_id)
    if not directory.exists():
        return None
    for path in sorted(directory.iterdir()):
        if path.is_file() and _system_for_extension(path.name):
            return path
    return None


def _bios_path(system_key):
    directory = BIOS_DIR / system_key
    if not directory.exists():
        return None
    for path in sorted(directory.iterdir()):
        if path.is_file() and path.suffix.lower() in {".bin", ".rom"}:
            return path
    return None


def _format_bytes(size):
    value = float(size or 0)
    for unit in ("B", "KB", "MB", "GB"):
        if value < 1024 or unit == "GB":
            return f"{value:.1f} {unit}" if unit != "B" else f"{int(value)} B"
        value /= 1024


def emulation_profile(game):
    game_id = int(game["id"])
    rom = _stored_rom(game_id)
    system_key = _system_for_extension(rom.name) if rom else _system_for_platform(game.get("platform"))
    all_extensions = sorted({extension for system in SYSTEMS.values() for extension in system["extensions"]})

    if not system_key:
        return {
            "available": False,
            "status": "missing_rom",
            "message": "Add a supported game file and Vaultarr will choose the player automatically.",
            "system": None,
            "system_label": "Classic console game",
            "accepted_extensions": all_extensions,
            "requires_bios": False,
            "rom": None,
            "bios": None,
        }

    system = SYSTEMS[system_key]
    bios = _bios_path(system_key) if system.get("requires_bios") else None
    base = {
        "available": False,
        "status": "missing_rom",
        "system": system_key,
        "system_label": system["label"],
        "core": system["core"],
        "accepted_extensions": list(system["extensions"]),
        "requires_bios": bool(system.get("requires_bios")),
        "rom": None,
        "bios": {"name": bios.name, "size": bios.stat().st_size, "size_label": _format_bytes(bios.stat().st_size)} if bios else None,
    }
    if not rom:
        base["message"] = f"Add your {system['label']} game file to play it in Vaultarr."
        return base

    base["rom"] = {"name": rom.name, "size": rom.stat().st_size, "size_label": _format_bytes(rom.stat().st_size)}
    if system.get("requires_bios") and not bios:
        base["status"] = "missing_bios"
        base["message"] = "Your game file is ready. Add your PlayStation BIOS once to finish player setup."
        return base

    base.update({
        "available": True,
        "status": "ready",
        "message": "Ready to play in Vaultarr.",
        "player_url": f"/games/{game_id}/player",
    })
    return base


def save_uploaded_rom(game_id, upload):
    filename = secure_filename(upload.filename or "")
    system_key = _system_for_extension(filename)
    if not system_key:
        allowed = ", ".join(sorted({extension for system in SYSTEMS.values() for extension in system["extensions"]}))
        raise ValueError(f"Unsupported game file. Use one of: {allowed}.")
    size = _upload_size(upload)
    if size <= 0:
        raise ValueError("The selected game file is empty.")
    if size > MAX_ROM_BYTES:
        raise ValueError("The selected game file is larger than Vaultarr's 4 GB player limit.")

    directory = _game_directory(game_id)
    directory.mkdir(parents=True, exist_ok=True)
    destination = directory / filename
    temporary = directory / f".{filename}.uploading"
    try:
        upload.stream.seek(0)
        upload.save(temporary)
        for existing in directory.iterdir():
            if existing.is_file() and existing != temporary:
                existing.unlink()
        temporary.replace(destination)
    finally:
        if temporary.exists():
            temporary.unlink()
    return destination, system_key


def remove_uploaded_rom(game_id):
    directory = _game_directory(game_id)
    if not directory.exists():
        return False
    removed = False
    for path in directory.iterdir():
        if path.is_file():
            path.unlink()
            removed = True
    return removed


def save_uploaded_bios(system_key, upload):
    if system_key not in SYSTEMS or not SYSTEMS[system_key].get("requires_bios"):
        raise ValueError("That system does not require a BIOS file.")
    filename = secure_filename(upload.filename or "")
    if Path(filename).suffix.lower() not in {".bin", ".rom"}:
        raise ValueError("Use a .bin or .rom BIOS file.")
    size = _upload_size(upload)
    if size <= 0 or size > MAX_BIOS_BYTES:
        raise ValueError("The BIOS file must be between 1 byte and 4 MB.")
    directory = BIOS_DIR / system_key
    directory.mkdir(parents=True, exist_ok=True)
    destination = directory / filename
    temporary = directory / f".{filename}.uploading"
    try:
        upload.stream.seek(0)
        upload.save(temporary)
        for existing in directory.iterdir():
            if existing.is_file() and existing != temporary:
                existing.unlink()
        temporary.replace(destination)
    finally:
        if temporary.exists():
            temporary.unlink()
    return destination


def resolve_rom(game_id):
    return _stored_rom(game_id)


def resolve_bios(system_key):
    return _bios_path(system_key)


def record_player_launch(game_id):
    conn = get_connection()
    conn.execute("""
        INSERT INTO game_play_activity (game_id, play_count, first_played_at, last_played_at)
        VALUES (?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT(game_id) DO UPDATE SET
            play_count = game_play_activity.play_count + 1,
            last_played_at = CURRENT_TIMESTAMP
    """, (int(game_id),))
    conn.commit()
    conn.close()
