from flask import Blueprint, request, redirect, jsonify, abort
from urllib.parse import quote_plus

from app.database.database import get_connection
from app.services.acquisition_assistant_service import (
    search_vimm_reference, read_vimm_source_page, save_acquisition_source,
    attach_local_file,
)

acquisition_bp = Blueprint("acquisition", __name__)


@acquisition_bp.route("/api/games/<int:game_id>/acquisition/search")
def acquisition_search(game_id):
    conn = get_connection()
    game = conn.execute("SELECT title,platform FROM games WHERE id=?", (game_id,)).fetchone()
    conn.close()
    if not game:
        abort(404)
    query = request.args.get("q", "").strip() or game["title"]
    platform = request.args.get("platform", "").strip() or game["platform"] or ""
    try:
        results = search_vimm_reference(query, platform)
        return jsonify({"success": True, "query": query, "results": results})
    except Exception as exc:
        return jsonify({"success": False, "message": str(exc)[:220], "results": []}), 502


@acquisition_bp.route("/api/games/<int:game_id>/acquisition/read-source", methods=["POST"])
def acquisition_read_source(game_id):
    conn = get_connection()
    game = conn.execute("SELECT title,platform FROM games WHERE id=?", (game_id,)).fetchone()
    conn.close()
    if not game:
        abort(404)
    payload = request.get_json(silent=True) or {}
    try:
        result = read_vimm_source_page(payload.get("source_page", ""), game["title"], game["platform"] or "")
        return jsonify({"success": True, "result": result})
    except Exception as exc:
        return jsonify({"success": False, "message": str(exc)[:220]}), 400


@acquisition_bp.route("/api/games/<int:game_id>/acquisition/save", methods=["POST"])
def acquisition_save(game_id):
    try:
        save_acquisition_source(game_id, request.get_json(silent=True) or {})
        return jsonify({"success": True})
    except Exception as exc:
        return jsonify({"success": False, "message": str(exc)[:220]}), 400


@acquisition_bp.route("/games/<int:game_id>/acquisition/attach", methods=["POST"])
def attach_acquisition(game_id):
    try:
        attach_local_file(game_id, request.form.get("local_path", ""))
        return redirect(f"/games/{game_id}?acquisition_saved=1#acquisition-assistant")
    except Exception as exc:
        return redirect(f"/games/{game_id}?acquisition_error={quote_plus(str(exc)[:180])}#acquisition-assistant")
