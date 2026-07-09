from flask import Blueprint, render_template, redirect
from app.services.stats_service import get_dashboard_stats
from app.database.database import get_connection

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/')
def dashboard():
    conn = get_connection()
    has_library = conn.execute('SELECT COUNT(*) FROM libraries').fetchone()[0] > 0
    conn.close()
    if not has_library:
        return redirect('/onboarding')
    return render_template('dashboard.html', stats=get_dashboard_stats())
