from flask import Blueprint, jsonify, render_template, request, redirect
from app.database.database import get_connection
from app.services.curator_service import curator_status, queue_incomplete_games, queue_game, run_game, run_queue, refresh_game_score

curator_bp = Blueprint('curator', __name__)

@curator_bp.route('/curator')
def curator_page():
    data = curator_status()
    return render_template('curator.html', **data)

@curator_bp.route('/curator/queue-all', methods=['POST'])
def curator_queue_all():
    queue_incomplete_games('manual')
    return redirect('/curator')

@curator_bp.route('/curator/run', methods=['POST'])
def curator_run():
    limit = request.form.get('limit', 5)
    run_queue(limit)
    return redirect('/curator')

@curator_bp.route('/api/curator/status')
def api_curator_status():
    return jsonify({'success': True, **curator_status()})

@curator_bp.route('/api/curator/games/<int:game_id>/run', methods=['POST'])
def api_curator_game_run(game_id):
    return jsonify(run_game(game_id))

@curator_bp.route('/api/curator/games/<int:game_id>/pause', methods=['POST'])
def api_curator_game_pause(game_id):
    payload = request.get_json(silent=True) or request.form
    paused = 1 if str(payload.get('paused', '1')).lower() not in {'0','false','off'} else 0
    conn=get_connection(); conn.execute('UPDATE games SET curator_paused=? WHERE id=?',(paused,game_id)); conn.commit(); conn.close()
    return jsonify({'success': True, 'paused': bool(paused)})
