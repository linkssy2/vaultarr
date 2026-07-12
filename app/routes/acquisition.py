from flask import Blueprint, request, redirect, jsonify, abort
from urllib.parse import quote_plus

from app.database.database import get_connection
from app.services.acquisition_index_service import (
    import_catalog, remove_catalog, set_catalog_enabled, search_catalogs,
    attach_local_file,
)

acquisition_bp = Blueprint("acquisition", __name__)


@acquisition_bp.route("/settings/acquisition-indexes/upload", methods=["POST"])
def upload_index():
    upload = request.files.get("index_file")
    if not upload or not upload.filename:
        return redirect("/settings?saved=acquisition_error&acquisition_error=Choose+a+JSON+or+CSV+file")
    try:
        result = import_catalog(upload, request.form.get("name", ""))
        return redirect(f"/settings?saved=acquisition_index&acquisition_entries={result['entries']}")
    except Exception as exc:
        return redirect(f"/settings?saved=acquisition_error&acquisition_error={quote_plus(str(exc)[:180])}")


@acquisition_bp.route("/settings/acquisition-indexes/<int:index_id>/toggle", methods=["POST"])
def toggle_index(index_id):
    set_catalog_enabled(index_id, request.form.get("enabled") == "on")
    return redirect("/settings?saved=acquisition_index_toggled")


@acquisition_bp.route("/settings/acquisition-indexes/<int:index_id>/delete", methods=["POST"])
def delete_index(index_id):
    remove_catalog(index_id)
    return redirect("/settings?saved=acquisition_index_removed")


@acquisition_bp.route("/api/games/<int:game_id>/acquisition/search")
def acquisition_search(game_id):
    conn = get_connection()
    game = conn.execute("SELECT title,platform FROM games WHERE id=?", (game_id,)).fetchone()
    conn.close()
    if not game:
        abort(404)
    query = request.args.get("q", "").strip() or game["title"]
    platform = request.args.get("platform", "").strip() or game["platform"] or ""
    return jsonify({"success": True, "query": query, "results": search_catalogs(query, platform)})


@acquisition_bp.route("/games/<int:game_id>/acquisition/attach", methods=["POST"])
def attach_acquisition(game_id):
    try:
        attach_local_file(game_id, request.form.get("local_path", ""), request.form.get("entry_id") or None)
        return redirect(f"/games/{game_id}?acquisition_saved=1#personal-acquisition")
    except Exception as exc:
        return redirect(f"/games/{game_id}?acquisition_error={quote_plus(str(exc)[:180])}#personal-acquisition")
