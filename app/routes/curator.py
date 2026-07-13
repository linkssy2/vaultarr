import json
import threading
from flask import Blueprint, jsonify, redirect, request
from app.database.database import get_connection
from app.services.curator_service import run_game
from app.services.museum_scan_service import scan_status, start_scan

curator_bp = Blueprint('curator', __name__)
_worker_lock = threading.Lock()
_running = set()

def _json_no_cache(payload, status=200):
    response = jsonify(payload); response.status_code=status
    response.headers['Cache-Control']='no-store, no-cache, must-revalidate, max-age=0'
    response.headers['Pragma']='no-cache'; response.headers['Expires']='0'
    return response

def _worker(game_id):
    try: run_game(game_id)
    finally:
        with _worker_lock: _running.discard(game_id)

def _job_payload(game_id):
    conn=get_connection(); row=conn.execute("SELECT j.*, g.curator_score, g.curator_status FROM curator_jobs j JOIN games g ON g.id=j.game_id WHERE j.game_id=?",(game_id,)).fetchone(); conn.close()
    if not row: return None
    data=dict(row)
    try: data['result']=json.loads(data.get('result_json') or '{}')
    except Exception: data['result']={}
    return data

@curator_bp.route('/curator')
@curator_bp.route('/activity')
def retired_activity_page():
    return redirect('/museum')

@curator_bp.route('/api/museum-scan/start', methods=['POST'])
def api_museum_scan_start(): return _json_no_cache({'success':True, **start_scan()})

@curator_bp.route('/api/museum-scan/status')
def api_museum_scan_status(): return _json_no_cache({'success':True, **scan_status()})

# Retain game-level APIs for Focus Mode and advanced integrations.
@curator_bp.route('/api/curator/games/<int:game_id>/start', methods=['POST'])
def api_curator_game_start(game_id):
    conn=get_connection(); game=conn.execute('SELECT id FROM games WHERE id=?',(game_id,)).fetchone()
    if not game: conn.close(); return _json_no_cache({'success':False,'message':'Game not found.'},404)
    conn.execute("INSERT INTO curator_jobs(game_id,status,reason,progress,stage,result_json,updated_at) VALUES(?,'queued','manual',0,'Starting','{}',CURRENT_TIMESTAMP) ON CONFLICT(game_id) DO UPDATE SET status='queued',progress=0,stage='Starting',result_json='{}',last_error='',updated_at=CURRENT_TIMESTAMP",(game_id,)); conn.commit(); conn.close()
    with _worker_lock:
        if game_id not in _running:
            _running.add(game_id); threading.Thread(target=_worker,args=(game_id,),daemon=True).start()
    return _json_no_cache({'success':True,'game_id':game_id,'status':'queued','progress':0,'stage':'Starting'})

@curator_bp.route('/api/curator/games/<int:game_id>/status')
def api_curator_game_status(game_id):
    data=_job_payload(game_id)
    if not data: return _json_no_cache({'success':False,'message':'No preparation job found.'},404)
    return _json_no_cache({'success':True, **data})
