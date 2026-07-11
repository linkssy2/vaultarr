import json
import os
from pathlib import Path

APP_DIR = Path(os.getenv("LOCALAPPDATA", ".")) / "Vaultarr"
SETTINGS_DIR = APP_DIR / "settings"
UI_SETTINGS_PATH = SETTINGS_DIR / "experience.json"

DEFAULT_UI_SETTINGS = {
    "advanced_mode": False,
    "auto_curate": True,
    "friendly_language": True,
}


def load_ui_settings():
    SETTINGS_DIR.mkdir(parents=True, exist_ok=True)
    if not UI_SETTINGS_PATH.exists():
        save_ui_settings(DEFAULT_UI_SETTINGS)
        return dict(DEFAULT_UI_SETTINGS)
    try:
        data = json.loads(UI_SETTINGS_PATH.read_text(encoding="utf-8"))
        settings = dict(DEFAULT_UI_SETTINGS)
        settings.update(data if isinstance(data, dict) else {})
        return settings
    except Exception:
        return dict(DEFAULT_UI_SETTINGS)


def save_ui_settings(settings):
    SETTINGS_DIR.mkdir(parents=True, exist_ok=True)
    clean = dict(DEFAULT_UI_SETTINGS)
    clean.update(settings or {})
    clean = {key: bool(clean.get(key)) for key in DEFAULT_UI_SETTINGS}
    UI_SETTINGS_PATH.write_text(json.dumps(clean, indent=2), encoding="utf-8")
    return clean


def ui_settings_from_form(form):
    return {
        "advanced_mode": form.get("advanced_mode") == "on",
        "auto_curate": form.get("auto_curate") == "on",
        "friendly_language": form.get("friendly_language") == "on",
    }
