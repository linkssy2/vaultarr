from flask import Blueprint, render_template, redirect
from app.services.health_service import system_health, optimize_database

health_bp = Blueprint('health', __name__)

@health_bp.route('/health')
def health():
    return render_template('health.html', health=system_health())

@health_bp.route('/health/optimize', methods=['POST'])
def health_optimize():
    optimize_database()
    return redirect('/health?optimized=1')
