import json
import os
import secrets
from pathlib import Path
from werkzeug.security import generate_password_hash, check_password_hash

from app.database.database import APP_DIR

SETTINGS_DIR = APP_DIR / "settings"
AUTH_PATH = SETTINGS_DIR / "auth.json"
SECRET_PATH = SETTINGS_DIR / "session_secret.key"

DEFAULT_AUTH_SETTINGS = {
    "enabled": False,
    "username": "admin",
    "password_hash": "",
}


def _truthy(value):
    return str(value or "").strip().lower() in {"1", "true", "yes", "on", "enabled"}


def get_secret_key():
    SETTINGS_DIR.mkdir(parents=True, exist_ok=True)
    env_secret = os.getenv("VAULTARR_SECRET_KEY", "").strip()
    if env_secret:
        return env_secret
    if SECRET_PATH.exists():
        existing = SECRET_PATH.read_text(encoding="utf-8").strip()
        if existing:
            return existing
    secret = secrets.token_urlsafe(48)
    SECRET_PATH.write_text(secret, encoding="utf-8")
    return secret


def load_auth_settings():
    SETTINGS_DIR.mkdir(parents=True, exist_ok=True)
    settings = dict(DEFAULT_AUTH_SETTINGS)

    if AUTH_PATH.exists():
        try:
            data = json.loads(AUTH_PATH.read_text(encoding="utf-8"))
            settings.update({k: data.get(k, settings[k]) for k in settings})
        except Exception:
            pass
    elif _truthy(os.getenv("VAULTARR_AUTH_ENABLED")):
        username = os.getenv("VAULTARR_ADMIN_USER", "admin").strip() or "admin"
        password = os.getenv("VAULTARR_ADMIN_PASSWORD", "").strip()
        settings["enabled"] = True
        settings["username"] = username
        if password:
            settings["password_hash"] = generate_password_hash(password)
            save_auth_settings(settings)

    settings["configured"] = bool(settings.get("password_hash"))
    return settings


def save_auth_settings(settings):
    SETTINGS_DIR.mkdir(parents=True, exist_ok=True)
    clean = dict(DEFAULT_AUTH_SETTINGS)
    clean.update(settings)
    clean["enabled"] = bool(clean.get("enabled"))
    clean["username"] = (clean.get("username") or "admin").strip() or "admin"
    clean.pop("configured", None)
    AUTH_PATH.write_text(json.dumps(clean, indent=2), encoding="utf-8")
    clean["configured"] = bool(clean.get("password_hash"))
    return clean


def update_auth_from_form(form):
    current = load_auth_settings()
    enabled = form.get("auth_enabled") == "on"
    username = (form.get("auth_username") or "admin").strip() or "admin"
    password = form.get("auth_password") or ""
    confirm = form.get("auth_password_confirm") or ""

    if password or confirm:
        if password != confirm:
            return False, "password_mismatch"
        if len(password) < 6:
            return False, "password_short"
        current["password_hash"] = generate_password_hash(password)

    if enabled and not current.get("password_hash"):
        return False, "password_required"

    current["enabled"] = enabled
    current["username"] = username
    save_auth_settings(current)
    return True, "security"


def auth_is_enabled():
    settings = load_auth_settings()
    return bool(settings.get("enabled") and settings.get("password_hash"))


def verify_credentials(username, password):
    settings = load_auth_settings()
    if not auth_is_enabled():
        return True
    if (username or "").strip() != settings.get("username"):
        return False
    return check_password_hash(settings.get("password_hash") or "", password or "")
