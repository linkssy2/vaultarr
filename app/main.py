import os
from flask import Flask, request, redirect, session, url_for

from app.database.migrations import migrate
from app.routes.dashboard import dashboard_bp
from app.routes.library import library_bp
from app.routes.settings import settings_bp
from app.routes.media import media_bp
from app.routes.collections import collections_bp
from app.routes.metadata_queue import metadata_queue_bp
from app.routes.api import api_bp
from app.routes.preservation import preservation_bp
from app.routes.discovery import discovery_bp
from app.routes.archive import archive_bp
from app.routes.experience import experience_bp
from app.routes.onboarding import onboarding_bp
from app.routes.health import health_bp
from app.routes.auth import auth_bp
from app.services.auth_service import get_secret_key, auth_is_enabled, load_auth_settings
from app.services.theme_service import load_theme, css_variables

app = Flask(__name__)
app.secret_key = get_secret_key()

migrate()

@app.context_processor
def inject_theme():
    theme = load_theme()
    auth_settings = load_auth_settings()
    return {
        "theme": theme,
        "theme_css": css_variables(theme),
        "auth_enabled": bool(auth_settings.get("enabled") and auth_settings.get("password_hash")),
        "current_user": session.get("vaultarr_user"),
    }


@app.before_request
def require_authentication():
    if not auth_is_enabled():
        return None

    endpoint = request.endpoint or ""
    if endpoint.startswith("static") or endpoint in {"auth.login", "auth.logout"}:
        return None

    if session.get("vaultarr_user"):
        return None

    return redirect(url_for("auth.login", next=request.path))


app.register_blueprint(dashboard_bp)
app.register_blueprint(library_bp)
app.register_blueprint(settings_bp)
app.register_blueprint(media_bp)
app.register_blueprint(collections_bp)
app.register_blueprint(metadata_queue_bp)
app.register_blueprint(api_bp)
app.register_blueprint(preservation_bp)
app.register_blueprint(discovery_bp)
app.register_blueprint(archive_bp)
app.register_blueprint(experience_bp)
app.register_blueprint(onboarding_bp)
app.register_blueprint(health_bp)
app.register_blueprint(auth_bp)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("VAULTARR_PORT", "8787")))
