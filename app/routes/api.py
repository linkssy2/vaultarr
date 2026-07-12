from flask import Blueprint, jsonify, abort, request
from pathlib import Path
import os
import shutil
import time
import hashlib
import requests
import re
import json
from urllib.parse import quote_plus

from app.database.database import get_connection
from app.services.preservation_engine import enrich_preservation
from app.services.media_service import all_media_results, cached_media, download_media_asset, media_count, MEDIA_DIR, delete_media_asset, clear_game_media_cache, media_cache_summary, cleanup_orphaned_media_files
from app.services.manual_service import MANUAL_PROVIDERS, manual_search_results, download_manual_pdf, manual_file_info, is_probably_pdf_url, manual_catalog_status, sync_manual_catalog, clear_manual_catalog, search_manual_catalog
from app.services.patch_service import patch_search_results, playability_score, patch_status
from app.services.launchbox_service import get_launchbox_details
from app.services.game_removal_service import remove_game
from app.services.metadata_service import (
    search_metadata_diagnostics,
    get_steam_details,
    get_wikipedia_details,
    get_rawg_details,
    get_igdb_details,
    get_steamgriddb_details,
    download_cover,
)

api_bp = Blueprint("api", __name__)


# ... (all your existing code stays exactly the same until the end) ...


# ==================== ROM / DOWNLOAD ENGINE ====================
from app.services.rom_service import download_rom, search_roms


@api_bp.route("/api/games/<int:game_id>/roms/search")
def api_rom_search(game_id):
    conn = get_connection()
    game = conn.execute("SELECT * FROM games WHERE id=?", (game_id,)).fetchone()
    conn.close()
    if game is None:
        abort(404)
    query = (request.args.get("query") or game["title"] or "").strip()
    platform = (request.args.get("platform") or game["platform"] or "").strip()
    results = search_roms(query, platform)
    return jsonify({"success": True, "game_id": game_id, "results": results})


@api_bp.route("/api/games/<int:game_id>/rom-link", methods=["POST"])
def api_rom_link(game_id):
    payload = request.get_json(silent=True) or {}
    rom_url = (payload.get("rom_url") or "").strip()
    rom_provider = (payload.get("rom_provider") or "User Link").strip()
    rom_title = (payload.get("rom_title") or "").strip()
    if not rom_url:
        return jsonify({"success": False, "message": "No ROM URL provided."}), 400
    conn = get_connection()
    conn.execute(
        "UPDATE games SET rom_url=?, rom_provider=?, rom_title=?, rom_checked_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP WHERE id=?",
        (rom_url, rom_provider, rom_title, game_id),
    )
    conn.commit()
    updated = conn.execute("SELECT * FROM games WHERE id=?", (game_id,)).fetchone()
    conn.close()
    return jsonify({"success": True, "game": enrich_game(row_to_dict(updated))})


@api_bp.route("/api/games/<int:game_id>/rom-download", methods=["POST"])
def api_rom_download(game_id):
    payload = request.get_json(silent=True) or {}
    rom_url = (payload.get("rom_url") or "").strip()
    rom_provider = (payload.get("rom_provider") or "Downloaded ROM").strip()
    if not rom_url:
        return jsonify({"success": False, "message": "No ROM URL provided."}), 400
    try:
        saved = download_rom(game_id, rom_url, "ROM", rom_provider)
    except Exception as exc:
        return jsonify({"success": False, "message": str(exc)}), 400
    conn = get_connection()
    updated = conn.execute("SELECT * FROM games WHERE id=?", (game_id,)).fetchone()
    conn.close()
    return jsonify({
        "success": True,
        "message": "ROM downloaded to local roms folder.",
        "rom": saved,
        "game": enrich_game(row_to_dict(updated)),
    })