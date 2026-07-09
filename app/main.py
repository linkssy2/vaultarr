from flask import Flask

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
from app.services.theme_service import load_theme, css_variables

app = Flask(__name__)

migrate()

@app.context_processor
def inject_theme():
    theme = load_theme()
    return {
        "theme": theme,
        "theme_css": css_variables(theme),
    }


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

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8787)
