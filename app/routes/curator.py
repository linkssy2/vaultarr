import json
import threading
from flask import Blueprint, jsonify, render_template, request, redirect
from app.database.database import get_connection
from app.services.curator_service import curator_status, queue_incomplete_games, run_game, run_queue

curator_bp = Blueprint('curator', __name__)
_worker_lock = threading.Lock()
_running = set()

def _worker(game_id):
    try:
        run_game(game_id)
    finally:
        with _worker_lock:
            _running.discard(game_id)

def _job_payload(game_id):
    conn=get_connection()
    row=conn.execute("SELECT j.*, g.curator_score, g.curator_status FROM curator_jobs j JOIN games g ON g.id=j.game_id WHERE j.game_id=?",(game_id,)).fetchone()
    conn.close()
    if not row: return None
    data=dict(row)
    try: data['result']=json.loads(data.get('result_json') or '{}')
    except Exception: data['result']={}
    return data

@curator_bp.route('/curator')
@curator_bp.route('/activity')
def curator_page(): return render_template('curator.html', **curator_status())

@curator_bp.route('/curator/queue-all', methods=['POST'])
def curator_queue_all(): queue_incomplete_games('manual'); return redirect('/curator')

@curator_bp.route('/curator/run', methods=['POST'])
def curator_run(): run_queue(request.form.get('limit',5)); return redirect('/curator')

@curator_bp.route('/api/curator/status')
def api_curator_status(): return jsonify({'success':True, **curator_status()})

@curator_bp.route('/api/curator/games/<int:game_id>/start', methods=['POST'])
def api_curator_game_start(game_id):
    conn=get_connection(); game=conn.execute('SELECT id FROM games WHERE id=?',(game_id,)).fetchone()
    if not game: conn.close(); return jsonify({'success':False,'message':'Game not found.'}),404
    conn.execute("INSERT INTO curator_jobs(game_id,status,reason,progress,stage,result_json,updated_at) VALUES(?,'queued','manual',0,'Starting','{}',CURRENT_TIMESTAMP) ON CONFLICT(game_id) DO UPDATE SET status='queued',progress=0,stage='Starting',result_json='{}',last_error='',updated_at=CURRENT_TIMESTAMP",(game_id,))
    conn.commit(); conn.close()
    with _worker_lock:
        if game_id not in _running:
            _running.add(game_id); threading.Thread(target=_worker,args=(game_id,),daemon=True).start()
    return jsonify({'success':True,'game_id':game_id,'status':'queued','progress':0,'stage':'Starting'})

@curator_bp.route('/api/curator/games/<int:game_id>/status')
def api_curator_game_status(game_id):
    data=_job_payload(game_id)
    if not data: return jsonify({'success':False,'message':'No curator job found.'}),404
    return jsonify({'success':True, **data})

@curator_bp.route('/api/curator/games/<int:game_id>/pause', methods=['POST'])
def api_curator_game_pause(game_id):
    payload=request.get_json(silent=True) or request.form
    paused=1 if str(payload.get('paused','1')).lower() not in {'0','false','off'} else 0
    conn=get_connection(); conn.execute('UPDATE games SET curator_paused=? WHERE id=?',(paused,game_id)); conn.commit(); conn.close()
    return jsonify({'success':True,'paused':bool(paused)})
