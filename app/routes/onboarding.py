from flask import Blueprint, render_template
from app.database.database import get_connection

onboarding_bp = Blueprint('onboarding', __name__)

@onboarding_bp.route('/onboarding')
def onboarding():
    conn = get_connection()
    libraries = conn.execute('SELECT * FROM libraries ORDER BY name').fetchall()
    game_count = conn.execute('SELECT COUNT(*) FROM games').fetchone()[0]
    conn.close()
    return render_template('onboarding.html', libraries=libraries, game_count=game_count)
