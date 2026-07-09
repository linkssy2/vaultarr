import os
import sqlite3
from pathlib import Path

APP_DIR = Path(os.getenv("LOCALAPPDATA", ".")) / "Vaultarr"
DB_DIR = APP_DIR / "database"
DB_PATH = DB_DIR / "vaultarr.sqlite3"


def get_connection():
    DB_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn
