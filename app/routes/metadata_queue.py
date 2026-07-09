from flask import Blueprint, render_template
from app.database.database import get_connection

metadata_queue_bp = Blueprint('metadata_queue', __name__)

@metadata_queue_bp.route('/metadata-queue')
def metadata_queue():
    conn=get_connection(); games=conn.execute("SELECT * FROM games WHERE metadata_source='' OR cover_path='' ORDER BY title").fetchall(); conn.close()
    return render_template('metadata_queue.html', games=games)
