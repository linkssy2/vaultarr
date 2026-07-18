from flask import Blueprint, render_template, request, redirect
from pathlib import Path
from app.database.database import get_connection

onboarding_bp = Blueprint('onboarding', __name__)

@onboarding_bp.route('/onboarding')
def onboarding():
    conn = get_connection()
    libraries = conn.execute('SELECT * FROM libraries ORDER BY name').fetchall()
    game_count = conn.execute('SELECT COUNT(*) FROM games').fetchone()[0]
    conn.close()
    requested_step = request.args.get('step', '').strip().lower()
    allowed_steps = {'welcome', 'library', 'ready'}
    onboarding_step = requested_step if requested_step in allowed_steps else ('ready' if libraries else 'welcome')
    return render_template('onboarding.html', libraries=libraries, game_count=game_count, onboarding_step=onboarding_step)


@onboarding_bp.route('/onboarding/library', methods=['POST'])
def add_onboarding_library():
    name = request.form.get('name', '').strip()
    path = request.form.get('path', '').strip()
    if not path:
        return redirect('/onboarding?step=library&error=path')

    if not name:
        name = Path(path).name or path

    conn = get_connection()
    conn.execute('INSERT OR IGNORE INTO libraries (name,path) VALUES (?,?)', (name, path))
    conn.commit()
    conn.close()
    return redirect('/onboarding?step=ready&added=1')
