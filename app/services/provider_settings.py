import json
import os
from pathlib import Path

APP_DIR = Path(os.getenv("LOCALAPPDATA", ".")) / "Vaultarr"
SETTINGS_DIR = APP_DIR / "settings"
PROVIDERS_PATH = SETTINGS_DIR / "metadata_providers.json"

DEFAULT_PROVIDER_SETTINGS = {
    "rawg_api_key": "",
    "igdb_client_id": "",
    "igdb_client_secret": "",
    "steamgriddb_api_key": "",
    "enable_steam": True,
    "enable_wikipedia": True,
    "enable_rawg": True,
    "enable_igdb": True,
    "enable_steamgriddb": True,
    "enable_launchbox": True,
    "launchbox_metadata_url": "https://gamesdb.launchbox-app.com/Metadata.zip",
}


def load_provider_settings():
    SETTINGS_DIR.mkdir(parents=True, exist_ok=True)
    if not PROVIDERS_PATH.exists():
        save_provider_settings(DEFAULT_PROVIDER_SETTINGS)
        return dict(DEFAULT_PROVIDER_SETTINGS)
    try:
        data = json.loads(PROVIDERS_PATH.read_text(encoding="utf-8"))
        settings = dict(DEFAULT_PROVIDER_SETTINGS)
        settings.update(data)
        return settings
    except Exception:
        return dict(DEFAULT_PROVIDER_SETTINGS)


def save_provider_settings(settings):
    SETTINGS_DIR.mkdir(parents=True, exist_ok=True)
    clean = dict(DEFAULT_PROVIDER_SETTINGS)
    clean.update(settings)
    PROVIDERS_PATH.write_text(json.dumps(clean, indent=2), encoding="utf-8")
    return clean


def provider_settings_from_form(form):
    return {
        "rawg_api_key": form.get("rawg_api_key", "").strip(),
        "igdb_client_id": form.get("igdb_client_id", "").strip(),
        "igdb_client_secret": form.get("igdb_client_secret", "").strip(),
        "steamgriddb_api_key": form.get("steamgriddb_api_key", "").strip(),
        "enable_steam": form.get("enable_steam") == "on",
        "enable_wikipedia": form.get("enable_wikipedia") == "on",
        "enable_rawg": form.get("enable_rawg") == "on",
        "enable_igdb": form.get("enable_igdb") == "on",
        "enable_steamgriddb": form.get("enable_steamgriddb") == "on",
        "enable_launchbox": form.get("enable_launchbox") == "on",
        "launchbox_metadata_url": form.get("launchbox_metadata_url", "https://gamesdb.launchbox-app.com/Metadata.zip").strip() or "https://gamesdb.launchbox-app.com/Metadata.zip",
    }


def masked(value):
    value = value or ""
    if not value:
        return "Not set"
    if len(value) <= 8:
        return "Set"
    return f"{value[:4]}••••{value[-4:]}"
