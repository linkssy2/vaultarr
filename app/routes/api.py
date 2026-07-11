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


def row_to_dict(row):
    return dict(row) if row else None


def youtube_embed_url(url):
    url = (url or '').strip()
    if not url:
        return ''
    # Accept normal YouTube, youtu.be, Shorts, and already-embedded URLs.
    video_id = ''
    try:
        from urllib.parse import urlparse, parse_qs
        parsed = urlparse(url)
        host = (parsed.netloc or '').lower()
        path = parsed.path or ''
        if 'youtube.com' in host:
            if path.startswith('/embed/'):
                video_id = path.split('/embed/', 1)[1].split('/')[0]
            elif path.startswith('/shorts/'):
                video_id = path.split('/shorts/', 1)[1].split('/')[0]
            else:
                video_id = parse_qs(parsed.query).get('v', [''])[0]
        elif 'youtu.be' in host:
            video_id = path.strip('/').split('/')[0]
    except Exception:
        video_id = ''
    if not video_id:
        return ''
    safe = ''.join(ch for ch in video_id if ch.isalnum() or ch in ('-', '_'))
    # controls=0 lets Vaultarr own the visible play experience.
    return f'https://www.youtube.com/embed/{safe}?rel=0&modestbranding=1&controls=0&enablejsapi=1&playsinline=1' if safe else ''




def _plain_text(value):
    if not value:
        return ""
    if isinstance(value, str):
        return value
    if isinstance(value, dict):
        if value.get("simpleText"):
            return value.get("simpleText") or ""
        if isinstance(value.get("runs"), list):
            return "".join((run.get("text") or "") for run in value.get("runs", []))
    return ""


def _walk_json(value):
    if isinstance(value, dict):
        yield value
        for child in value.values():
            yield from _walk_json(child)
    elif isinstance(value, list):
        for child in value:
            yield from _walk_json(child)


def _extract_youtube_initial_data(html_text):
    marker = "ytInitialData"
    idx = html_text.find(marker)
    if idx < 0:
        return None
    brace_idx = html_text.find("{", idx)
    if brace_idx < 0:
        return None
    decoder = json.JSONDecoder()
    try:
        data, _ = decoder.raw_decode(html_text[brace_idx:])
        return data
    except Exception:
        return None


def _score_trailer_candidate(video_title, game_title, platform='', year=''):
    vt = (video_title or '').lower()
    gt = (game_title or '').lower()
    score = 30
    if gt and gt in vt:
        score += 35
    for token in re.findall(r"[a-z0-9]+", gt):
        if len(token) >= 3 and token in vt:
            score += 4
    if "official" in vt:
        score += 18
    if "trailer" in vt:
        score += 22
    if "launch" in vt or "announcement" in vt or "reveal" in vt:
        score += 8
    if platform and platform.lower() in vt:
        score += 8
    if year and str(year) in vt:
        score += 5
    penalties = {
        "walkthrough": 24,
        "longplay": 24,
        "full game": 24,
        "review": 18,
        "part ": 14,
        "episode": 12,
        "lets play": 18,
        "let's play": 18,
        "soundtrack": 18,
        "ost": 18,
        "speedrun": 18,
    }
    for word, penalty in penalties.items():
        if word in vt:
            score -= penalty
    return max(1, min(100, score))


def _youtube_trailer_candidates(query, game_title, platform='', year=''):
    url = f"https://www.youtube.com/results?search_query={quote_plus(query)}"
    response = requests.get(
        url,
        timeout=18,
        headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9",
        },
    )
    response.raise_for_status()
    data = _extract_youtube_initial_data(response.text)
    if not data:
        return []
    candidates = []
    seen = set()
    for node in _walk_json(data):
        renderer = node.get("videoRenderer") if isinstance(node, dict) else None
        if not renderer:
            continue
        video_id = renderer.get("videoId") or ""
        if not video_id or video_id in seen:
            continue
        title = _plain_text(renderer.get("title"))
        if not title:
            continue
        lower = title.lower()
        if "trailer" not in lower and "official" not in lower and "preview" not in lower:
            # Keep the finder focused. The external search link is still available for broad results.
            continue
        seen.add(video_id)
        thumbs = renderer.get("thumbnail", {}).get("thumbnails", []) if isinstance(renderer.get("thumbnail"), dict) else []
        thumb = thumbs[-1].get("url") if thumbs else f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg"
        watch_url = f"https://www.youtube.com/watch?v={video_id}"
        score = _score_trailer_candidate(title, game_title, platform, year)
        candidates.append({
            "source": "YouTube",
            "provider": "YouTube",
            "video_id": video_id,
            "title": title,
            "url": watch_url,
            "embed_url": youtube_embed_url(watch_url),
            "thumbnail": thumb,
            "duration": _plain_text(renderer.get("lengthText")),
            "published": _plain_text(renderer.get("publishedTimeText")),
            "confidence": score,
            "reason": "Official/trailer title match" if score >= 75 else "Likely trailer candidate",
        })
    candidates.sort(key=lambda item: item.get("confidence", 0), reverse=True)
    return candidates[:8]


def enrich_game(data):
    size_bytes = data.get("size_bytes") or 0
    data["size_gb"] = round(size_bytes / 1024 / 1024 / 1024, 2)
    data["size_mb"] = round(size_bytes / 1024 / 1024, 2)
    data["cover_src"] = f"/covers/{data['cover_path']}?v={data.get('updated_at') or data.get('last_scanned') or data.get('id') or '0'}" if data.get("cover_path") else ""
    data["preferred_cover_locked"] = int(data.get("preferred_cover_locked") or 0)
    data["executables_list"] = [x.strip() for x in (data.get("executables") or "").split(",") if x.strip()]
    data["source_type"] = data.get("source_type") or ("Manual" if data.get("manual_entry") else "Scanned")
    data["manual_entry"] = int(data.get("manual_entry") or 0)
    data["manual_file_src"] = f"/manuals/{data.get('manual_file_path')}" if data.get("manual_file_path") else ""
    data["manual_file_viewer_src"] = f"/manuals/{data.get('manual_file_path')}#toolbar=0&navpanes=0&scrollbar=0" if data.get("manual_file_path") else ""
    data["manual_file_size_mb"] = round((data.get("manual_file_size") or 0) / 1024 / 1024, 2)
    data["trailer_embed_src"] = data.get("trailer_embed_url") or youtube_embed_url(data.get("trailer_url") or "")
    data["trailer_status"] = "saved" if data.get("trailer_url") else "none"
    data["patch_status"] = patch_status(data)
    data["playability_score"] = playability_score(data)
    data["patch_saved"] = 1 if data.get("patch_url") else 0
    try:
        data["media_count"] = media_count(data.get("id"))
    except Exception:
        data["media_count"] = 0
    data["manual_url_is_pdf_candidate"] = is_probably_pdf_url(data.get("manual_url") or "")
    data["manual_status"] = "none"
    data["manual_file_valid"] = 0
    if data.get("manual_file_path"):
        info = manual_file_info(data.get("manual_file_path"))
        data["manual_file_valid"] = 1 if info.get("valid_pdf") else 0
        data["manual_status"] = "downloaded_pdf" if info.get("valid_pdf") else "invalid_pdf"
    elif data.get("manual_url"):
        data["manual_status"] = "linked_pdf" if data["manual_url_is_pdf_candidate"] else "linked_source"
    data["metadata_locked"] = int(data.get("metadata_locked") or 0)
    data = enrich_preservation(data)
    return data


def get_provider_details(source, external_id):
    source_key = (source or "").strip().lower()

    if source_key == "steam":
        return get_steam_details(external_id)

    if source_key == "wikipedia":
        return get_wikipedia_details(external_id)

    if source_key == "rawg":
        return get_rawg_details(external_id)

    if source_key == "igdb":
        return get_igdb_details(external_id)

    if source_key == "steamgriddb":
        return get_steamgriddb_details(external_id)

    if source_key == "launchbox":
        return get_launchbox_details(external_id)

    return None


def build_metadata_comparison(current, details):
    fields = [
        ("title", "Title"),
        ("description", "Description"),
        ("developer", "Developer"),
        ("publisher", "Publisher"),
        ("release_year", "Year"),
        ("genre", "Genre"),
        ("platform", "Platform"),
        ("cover_url", "Cover"),
    ]

    rows = []
    change_count = 0

    for key, label in fields:
        old_value = current.get(key) or ""
        if key == "cover_url" and not old_value:
            old_value = current.get("cover_path") or ""
        new_value = details.get(key) or ""

        if not new_value:
            continue

        changed = str(old_value).strip() != str(new_value).strip()
        if changed:
            change_count += 1

        rows.append({
            "field": key,
            "label": label,
            "current": old_value or "—",
            "incoming": new_value or "—",
            "changed": changed,
        })

    return {
        "source": details.get("metadata_source", ""),
        "external_id": details.get("metadata_external_id", ""),
        "title": details.get("title", ""),
        "cover_url": details.get("cover_url", ""),
        "change_count": change_count,
        "rows": rows,
    }


@api_bp.route("/api/games/<int:game_id>")
def api_game_detail(game_id):
    conn = get_connection()
    game = conn.execute("SELECT * FROM games WHERE id = ?", (game_id,)).fetchone()
    conn.close()

    if game is None:
        abort(404)

    return jsonify(enrich_game(row_to_dict(game)))


@api_bp.route("/api/games/<int:game_id>/metadata/search")
def api_metadata_search(game_id):
    query = request.args.get("query", "").strip()
    provider = request.args.get("provider", "all").strip() or "all"

    if not query:
        conn = get_connection()
        game = conn.execute("SELECT title FROM games WHERE id = ?", (game_id,)).fetchone()
        conn.close()
        if game:
            query = game["title"]

    if not query:
        return jsonify({
            "results": [],
            "logs": [{"provider": "Metadata", "status": "warning", "message": "Search query was empty."}],
        })

    data = search_metadata_diagnostics(query, provider)
    return jsonify(data)


@api_bp.route("/api/games/<int:game_id>/metadata/preview")
def api_metadata_preview(game_id):
    source = request.args.get("source", "").strip()
    external_id = request.args.get("external_id", "").strip()

    details = get_provider_details(source, external_id)
    if not details:
        return jsonify({"success": False, "message": "Metadata provider did not return details."}), 400

    conn = get_connection()
    game = conn.execute("SELECT * FROM games WHERE id = ?", (game_id,)).fetchone()
    conn.close()

    if game is None:
        abort(404)

    current = enrich_game(row_to_dict(game))
    comparison = build_metadata_comparison(current, details)

    return jsonify({
        "success": True,
        "details": details,
        "comparison": comparison,
    })


@api_bp.route("/api/games/<int:game_id>/metadata/apply", methods=["POST"])
def api_metadata_apply(game_id):
    payload = request.get_json(silent=True) or request.form
    source = (payload.get("source") or "").strip()
    external_id = (payload.get("external_id") or "").strip()

    details = get_provider_details(source, external_id)

    if not details:
        return jsonify({"success": False, "message": "Metadata provider did not return details."}), 400

    cover_path = ""
    try:
        cover_path = download_cover(game_id, details.get("cover_url", ""))
    except Exception:
        cover_path = ""

    conn = get_connection()
    conn.execute(
        """
        UPDATE games
        SET title = CASE WHEN ? != '' THEN ? ELSE title END,
            description = CASE WHEN ? != '' THEN ? ELSE description END,
            developer = CASE WHEN ? != '' THEN ? ELSE developer END,
            publisher = CASE WHEN ? != '' THEN ? ELSE publisher END,
            release_year = CASE WHEN ? != '' THEN ? ELSE release_year END,
            genre = CASE WHEN ? != '' THEN ? ELSE genre END,
            platform = CASE WHEN ? != '' THEN ? ELSE platform END,
            cover_url = CASE WHEN ? != '' THEN ? ELSE cover_url END,
            cover_path = CASE WHEN ? != '' THEN ? ELSE cover_path END,
            metadata_source = CASE WHEN ? != '' THEN ? ELSE metadata_source END,
            metadata_external_id = CASE WHEN ? != '' THEN ? ELSE metadata_external_id END,
            category = CASE WHEN category = '' OR category = 'Unsorted' THEN ? ELSE category END,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        """,
        (
            details.get("title", ""), details.get("title", ""),
            details.get("description", ""), details.get("description", ""),
            details.get("developer", ""), details.get("developer", ""),
            details.get("publisher", ""), details.get("publisher", ""),
            details.get("release_year", ""), details.get("release_year", ""),
            details.get("genre", ""), details.get("genre", ""),
            details.get("platform", ""), details.get("platform", ""),
            details.get("cover_url", ""), details.get("cover_url", ""),
            cover_path, cover_path,
            details.get("metadata_source", ""), details.get("metadata_source", ""),
            details.get("metadata_external_id", ""), details.get("metadata_external_id", ""),
            source if source in ("Steam", "RAWG", "IGDB") else "Unsorted",
            game_id,
        ),
    )
    conn.commit()
    game = conn.execute("SELECT * FROM games WHERE id = ?", (game_id,)).fetchone()
    conn.close()

    return jsonify({
        "success": True,
        "message": "Metadata applied.",
        "game": enrich_game(row_to_dict(game)),
    })


@api_bp.route("/api/search")
def api_global_search():
    query = request.args.get("q", "").strip()
    if not query:
        return jsonify({"success": True, "query": query, "total": 0, "games": [], "collections": []})

    fields = [
        "title", "path", "developer", "publisher", "genre", "description",
        "tags", "category", "notes", "executables", "platform", "release_year", "source_type"
    ]
    terms = [term for term in query.lower().split() if term]

    where_parts = []
    params = []
    for term in terms:
        like = f"%{term}%"
        where_parts.append("(" + " OR ".join([f"LOWER(COALESCE({field}, '')) LIKE ?" for field in fields]) + ")")
        params.extend([like] * len(fields))

    where_sql = " AND ".join(where_parts) if where_parts else "1=1"

    conn = get_connection()
    games = conn.execute(
        f"""
        SELECT * FROM games
        WHERE {where_sql}
        ORDER BY
          CASE WHEN LOWER(title) = ? THEN 0
               WHEN LOWER(title) LIKE ? THEN 1
               ELSE 2 END,
          title COLLATE NOCASE ASC
        LIMIT 16
        """,
        (*params, query.lower(), f"%{query.lower()}%"),
    ).fetchall()

    collections = []
    cats = conn.execute("SELECT COALESCE(category, 'Unsorted') name, COUNT(*) count FROM games GROUP BY COALESCE(category, 'Unsorted') ORDER BY count DESC").fetchall()
    for row in cats:
        name = row["name"] or "Unsorted"
        if query.lower() in name.lower():
            collections.append({"name": name, "count": row["count"]})
    conn.close()

    game_results = []
    for game in games:
        data = enrich_game(row_to_dict(game))
        game_results.append({
            "id": data.get("id"),
            "title": data.get("title"),
            "path": data.get("path"),
            "developer": data.get("developer"),
            "publisher": data.get("publisher"),
            "release_year": data.get("release_year"),
            "genre": data.get("genre"),
            "category": data.get("category"),
            "cover_src": data.get("cover_src"),
        })

    return jsonify({
        "success": True,
        "query": query,
        "total": len(game_results) + len(collections),
        "games": game_results,
        "collections": collections[:8],
    })


@api_bp.route("/api/manual-providers")
def api_manual_providers():
    return jsonify({"success": True, "providers": MANUAL_PROVIDERS})


@api_bp.route("/api/manual-catalog/status")
def api_manual_catalog_status():
    return jsonify({"success": True, **manual_catalog_status()})


@api_bp.route("/api/manual-catalog/search")
def api_manual_catalog_search():
    query = (request.args.get("query") or "").strip()
    platform = (request.args.get("platform") or "").strip()
    provider = (request.args.get("provider") or "all").strip()
    limit = request.args.get("limit", 50, type=int)
    if not query:
        return jsonify({"success": False, "message": "Enter a game title to search."}), 400
    return jsonify({"success": True, "query": query, "results": search_manual_catalog(query, platform, provider, limit), "catalog": manual_catalog_status()})


@api_bp.route("/api/manual-catalog/refresh", methods=["POST"])
def api_manual_catalog_refresh():
    payload = request.get_json(silent=True) or {}
    provider = (payload.get("provider") or "all").strip()
    force = bool(payload.get("force", True))
    result = sync_manual_catalog(force=force, provider_id=provider)
    return jsonify(result), (200 if result.get("success") else 409)


@api_bp.route("/api/manual-catalog/clear", methods=["POST"])
def api_manual_catalog_clear():
    return jsonify({"success": True, **clear_manual_catalog()})


@api_bp.route("/api/games/<int:game_id>/manuals/search")
def api_manual_search(game_id):
    conn = get_connection()
    game = conn.execute("SELECT * FROM games WHERE id=?", (game_id,)).fetchone()
    conn.close()
    if game is None:
        abort(404)

    query = (request.args.get("query") or game["title"] or "").strip()
    platform = (request.args.get("platform") or game["platform"] or "").strip()
    provider = (request.args.get("provider") or "all").strip()
    results = manual_search_results(query, platform, provider)
    return jsonify({"success": True, "game_id": game_id, **results})


@api_bp.route("/api/games/<int:game_id>/manual-link", methods=["POST"])
def api_manual_link(game_id):
    payload = request.get_json(silent=True) or {}
    manual_url = (payload.get("manual_url") or "").strip()
    manual_provider = (payload.get("manual_provider") or "User Link").strip()
    conn = get_connection()
    game = conn.execute("SELECT id FROM games WHERE id=?", (game_id,)).fetchone()
    if game is None:
        conn.close()
        abort(404)
    conn.execute(
        "UPDATE games SET manual_url=?, manual_provider=?, manual_checked_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP WHERE id=?",
        (manual_url, manual_provider, game_id),
    )
    conn.commit()
    updated = conn.execute("SELECT * FROM games WHERE id=?", (game_id,)).fetchone()
    conn.close()
    return jsonify({"success": True, "game": enrich_game(row_to_dict(updated))})


@api_bp.route("/api/games/<int:game_id>/manual-download", methods=["POST"])
def api_manual_download(game_id):
    payload = request.get_json(silent=True) or {}
    manual_url = (payload.get("manual_url") or "").strip()
    manual_provider = (payload.get("manual_provider") or "Downloaded Manual").strip()

    conn = get_connection()
    game = conn.execute("SELECT * FROM games WHERE id=?", (game_id,)).fetchone()
    if game is None:
        conn.close()
        abort(404)

    if not manual_url:
        conn.close()
        return jsonify({"success": False, "message": "No manual URL was provided."}), 400

    try:
        saved = download_manual_pdf(game_id, manual_url, game["title"] or "Manual")
    except Exception as exc:
        conn.close()
        return jsonify({"success": False, "message": str(exc)}), 400

    conn.execute(
        """
        UPDATE games
        SET manual_url=?,
            manual_provider=?,
            manual_file_path=?,
            manual_file_name=?,
            manual_file_size=?,
            manual_downloaded_at=CURRENT_TIMESTAMP,
            manual_checked_at=CURRENT_TIMESTAMP,
            updated_at=CURRENT_TIMESTAMP
        WHERE id=?
        """,
        (manual_url, manual_provider, saved["path"], saved["filename"], saved["size"], game_id),
    )
    conn.commit()
    updated = conn.execute("SELECT * FROM games WHERE id=?", (game_id,)).fetchone()
    conn.close()

    return jsonify({
        "success": True,
        "message": "Manual downloaded into the local Vaultarr manual archive.",
        "manual": saved,
        "game": enrich_game(row_to_dict(updated)),
    })


@api_bp.route("/api/games/<int:game_id>/manual-remove", methods=["POST"])
def api_manual_remove(game_id):
    conn = get_connection()
    game = conn.execute("SELECT * FROM games WHERE id=?", (game_id,)).fetchone()
    if game is None:
        conn.close()
        abort(404)

    conn.execute(
        """
        UPDATE games
        SET manual_url='',
            manual_provider='',
            manual_file_path='',
            manual_file_name='',
            manual_file_size=0,
            manual_downloaded_at='',
            manual_checked_at=CURRENT_TIMESTAMP,
            updated_at=CURRENT_TIMESTAMP
        WHERE id=?
        """,
        (game_id,),
    )
    conn.commit()
    updated = conn.execute("SELECT * FROM games WHERE id=?", (game_id,)).fetchone()
    conn.close()
    return jsonify({"success": True, "message": "Manual removed from this game record.", "game": enrich_game(row_to_dict(updated))})


@api_bp.route("/api/games/<int:game_id>/media/cached")
def api_media_cached(game_id):
    conn = get_connection()
    game = conn.execute("SELECT id FROM games WHERE id=?", (game_id,)).fetchone()
    conn.close()
    if game is None:
        abort(404)
    cached = cached_media(game_id)
    return jsonify({"success": True, "game_id": game_id, "cached": cached, "cache_count": len(cached)})


@api_bp.route("/api/games/<int:game_id>/media/search")
def api_media_search(game_id):
    provider = (request.args.get("provider") or "all").strip()
    conn = get_connection()
    game = conn.execute("SELECT * FROM games WHERE id=?", (game_id,)).fetchone()
    conn.close()
    if game is None:
        abort(404)
    data = all_media_results(row_to_dict(game), provider)
    return jsonify({"success": True, "game_id": game_id, **data})


@api_bp.route("/api/games/<int:game_id>/media/cache", methods=["POST"])
def api_media_cache(game_id):
    payload = request.get_json(silent=True) or {}
    url = (payload.get("url") or "").strip()
    title = (payload.get("title") or "Media").strip()
    provider = (payload.get("provider") or "Provider").strip()
    media_type = (payload.get("media_type") or "screenshot").strip()
    conn = get_connection()
    game = conn.execute("SELECT id FROM games WHERE id=?", (game_id,)).fetchone()
    conn.close()
    if game is None:
        abort(404)
    try:
        asset = download_media_asset(game_id, url, title, provider, media_type)
    except Exception as exc:
        return jsonify({"success": False, "message": str(exc)}), 400
    return jsonify({"success": True, "asset": asset})


@api_bp.route("/api/games/<int:game_id>/media/<int:asset_id>", methods=["DELETE"])
def api_media_delete_asset(game_id, asset_id):
    result = delete_media_asset(asset_id, game_id=game_id, remove_file=True)
    status = 200 if result.get("deleted") else 404
    return jsonify({"success": bool(result.get("deleted")), **result}), status


@api_bp.route("/api/games/<int:game_id>/media/clear", methods=["POST"])
def api_media_clear_game(game_id):
    payload = request.get_json(silent=True) or {}
    media_type = (payload.get("media_type") or "all").strip().lower()
    conn = get_connection()
    game = conn.execute("SELECT id FROM games WHERE id=?", (game_id,)).fetchone()
    conn.close()
    if game is None:
        abort(404)
    result = clear_game_media_cache(game_id, media_type=media_type)
    return jsonify({"success": True, **result})


@api_bp.route("/api/media/cache/summary")
def api_media_cache_summary():
    return jsonify({"success": True, **media_cache_summary()})


@api_bp.route("/api/media/cache/cleanup", methods=["POST"])
def api_media_cache_cleanup():
    result = cleanup_orphaned_media_files()
    return jsonify({"success": True, **result, **media_cache_summary()})






@api_bp.route("/api/games/<int:game_id>/cover/upload", methods=["POST"])
def api_upload_game_cover(game_id):
    upload = request.files.get("cover")
    provider = (request.form.get("provider") or "Manual Upload").strip()
    cover_type = (request.form.get("cover_type") or "box_cover").strip()
    if upload is None or not upload.filename:
        return jsonify({"success": False, "message": "No cover image uploaded."}), 400

    conn = get_connection()
    game = conn.execute("SELECT * FROM games WHERE id=?", (game_id,)).fetchone()
    conn.close()
    if game is None:
        abort(404)

    try:
        original_name = upload.filename or "cover"
        suffix = Path(original_name).suffix.lower()
        if suffix not in (".jpg", ".jpeg", ".png", ".webp"):
            content_type = (upload.mimetype or "").lower()
            if "png" in content_type:
                suffix = ".png"
            elif "webp" in content_type:
                suffix = ".webp"
            else:
                suffix = ".jpg"

        content = upload.read()
        if not content:
            raise ValueError("Uploaded cover image was empty.")

        valid_magic = (
            content.startswith(bytes([0xff, 0xd8])) or
            content.startswith(bytes([0x89, 0x50, 0x4e, 0x47])) or
            content[:4] == b"RIFF"
        )
        if not valid_magic:
            raise ValueError("Uploaded file does not look like a JPG, PNG, or WebP image.")

        covers_dir = Path(os.getenv('LOCALAPPDATA', '.')) / 'Vaultarr' / 'covers'
        covers_dir.mkdir(parents=True, exist_ok=True)
        fingerprint = hashlib.sha1(f"{game_id}:{original_name}:{provider}:{time.time_ns()}".encode("utf-8")).hexdigest()[:12]
        cover_path = f"game_{game_id}_manual_{fingerprint}{suffix}"
        destination = covers_dir / cover_path
        destination.write_bytes(content)
        if not destination.exists() or destination.stat().st_size == 0:
            raise ValueError("Could not save uploaded cover art.")

        conn = get_connection()
        conn.execute("""
          CREATE TABLE IF NOT EXISTS media_assets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            game_id INTEGER NOT NULL,
            provider TEXT DEFAULT '',
            media_type TEXT DEFAULT 'screenshot',
            title TEXT DEFAULT '',
            remote_url TEXT DEFAULT '',
            local_path TEXT DEFAULT '',
            width INTEGER DEFAULT 0,
            height INTEGER DEFAULT 0,
            cached_at TEXT DEFAULT '',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(game_id, remote_url)
          )
        """)

        old_cover_path = (game['cover_path'] or '').strip()
        old_cover_url = (game['cover_url'] or '').strip()
        if old_cover_path:
            conn.execute("""
              INSERT OR IGNORE INTO media_assets (game_id, provider, media_type, title, remote_url, local_path, cached_at)
              VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            """, (game_id, game['metadata_source'] or 'Previous Cover', 'cover', 'Previous Library Cover', old_cover_url or f'/covers/{old_cover_path}', ''))

        local_url = f"/covers/{cover_path}"
        conn.execute("""
          INSERT OR IGNORE INTO media_assets (game_id, provider, media_type, title, remote_url, local_path, cached_at)
          VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        """, (game_id, provider, 'cover', 'Manual Uploaded Cover', local_url, cover_path, ''))

        conn.execute(
            """
            UPDATE games
            SET cover_path=?, cover_url=?,
                preferred_cover_path=?, preferred_cover_url=?, preferred_cover_provider=?, preferred_cover_type=?, preferred_cover_locked=1,
                metadata_source=CASE WHEN metadata_source='' OR metadata_source IS NULL THEN ? ELSE metadata_source END,
                updated_at=CURRENT_TIMESTAMP
            WHERE id=?
            """,
            (cover_path, local_url, cover_path, local_url, provider, cover_type, provider, game_id),
        )
        conn.commit()
        updated = conn.execute("SELECT * FROM games WHERE id=?", (game_id,)).fetchone()
        conn.close()

        data = enrich_game(row_to_dict(updated))
        data["cover_src"] = f"/covers/{cover_path}?v={int(time.time())}"
        return jsonify({"success": True, "message": "Manual cover uploaded and saved.", "game": data})
    except Exception as exc:
        return jsonify({"success": False, "message": str(exc)}), 400


@api_bp.route("/api/games/<int:game_id>/cover/set", methods=["POST"])
def api_set_game_cover(game_id):
    payload = request.get_json(silent=True) or {}
    url = (payload.get("url") or "").strip()
    provider = (payload.get("provider") or "Cover Manager").strip()
    cover_type = (payload.get("cover_type") or payload.get("media_role") or "box_cover").strip()
    if not url:
        return jsonify({"success": False, "message": "No cover URL provided."}), 400

    conn = get_connection()
    game = conn.execute("SELECT * FROM games WHERE id=?", (game_id,)).fetchone()
    conn.close()
    if game is None:
        abort(404)

    try:
        cover_url = url
        covers_dir = Path(os.getenv('LOCALAPPDATA', '.')) / 'Vaultarr' / 'covers'
        covers_dir.mkdir(parents=True, exist_ok=True)

        clean_url = url.split("?", 1)[0]
        suffix = Path(clean_url).suffix.lower()
        if suffix not in (".jpg", ".jpeg", ".png", ".webp"):
            suffix = ".jpg"

        fingerprint = hashlib.sha1(f"{game_id}:{url}:{provider}:{time.time_ns()}".encode("utf-8")).hexdigest()[:12]
        cover_path = f"game_{game_id}_preferred_{fingerprint}{suffix}"
        destination = covers_dir / cover_path

        if url.startswith("/media-assets/"):
            rel = url.replace("/media-assets/", "", 1).split("?", 1)[0].strip().lstrip("/")
            source = MEDIA_DIR / rel
            if not source.exists():
                raise ValueError("Cached media file could not be found.")
            suffix = source.suffix.lower() if source.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp") else suffix
            cover_path = f"game_{game_id}_preferred_{fingerprint}{suffix}"
            destination = covers_dir / cover_path
            shutil.copyfile(source, destination)
            cover_url = url
        else:
            response = requests.get(url, timeout=25, headers={"User-Agent": "Vaultarr/Alpha22.7"})
            response.raise_for_status()
            content_type = response.headers.get("content-type", "").lower()
            if "image" not in content_type and not response.content[:12].startswith((bytes([0xff, 0xd8]), bytes([0x89, 0x50, 0x4e, 0x47]), b"RIFF")):
                raise ValueError("Selected cover URL did not return an image.")
            destination.write_bytes(response.content)

        if not destination.exists() or destination.stat().st_size == 0:
            raise ValueError("Could not save cover art.")

        conn = get_connection()

        # Alpha 28.1: preserve every selected/previous cover as a media-library asset.
        # Changing covers now switches the active cover instead of losing the older one.
        conn.execute("""
          CREATE TABLE IF NOT EXISTS media_assets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            game_id INTEGER NOT NULL,
            provider TEXT DEFAULT '',
            media_type TEXT DEFAULT 'screenshot',
            title TEXT DEFAULT '',
            remote_url TEXT DEFAULT '',
            local_path TEXT DEFAULT '',
            width INTEGER DEFAULT 0,
            height INTEGER DEFAULT 0,
            cached_at TEXT DEFAULT '',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(game_id, remote_url)
          )
        """)
        old_cover_path = (game['cover_path'] or '').strip()
        old_cover_url = (game['cover_url'] or '').strip()
        if old_cover_path:
            conn.execute("""
              INSERT OR IGNORE INTO media_assets (game_id, provider, media_type, title, remote_url, local_path, cached_at)
              VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            """, (game_id, game['metadata_source'] or 'Previous Cover', 'cover', 'Previous Library Cover', old_cover_url or f'/covers/{old_cover_path}', ''))
        conn.execute("""
          INSERT OR IGNORE INTO media_assets (game_id, provider, media_type, title, remote_url, local_path, cached_at)
          VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        """, (game_id, provider, 'cover', 'Selected Library Cover', cover_url, ''))

        conn.execute(
            """
            UPDATE games
            SET cover_path=?, cover_url=?,
                preferred_cover_path=?, preferred_cover_url=?, preferred_cover_provider=?, preferred_cover_type=?, preferred_cover_locked=1,
                metadata_source=CASE WHEN metadata_source='' OR metadata_source IS NULL THEN ? ELSE metadata_source END,
                updated_at=CURRENT_TIMESTAMP
            WHERE id=?
            """,
            (cover_path, cover_url, cover_path, cover_url, provider, cover_type, provider, game_id),
        )
        conn.commit()
        updated = conn.execute("SELECT * FROM games WHERE id=?", (game_id,)).fetchone()
        conn.close()

        data = enrich_game(row_to_dict(updated))
        data["cover_src"] = f"/covers/{cover_path}?v={int(time.time())}"
        return jsonify({"success": True, "message": "Library cover saved as preferred cover.", "game": data})
    except Exception as exc:
        return jsonify({"success": False, "message": str(exc)}), 400


@api_bp.route("/api/games/<int:game_id>/trailer/search")
def api_game_trailer_search(game_id):
    conn = get_connection()
    game = conn.execute("SELECT * FROM games WHERE id=?", (game_id,)).fetchone()
    conn.close()
    if game is None:
        abort(404)

    game_data = row_to_dict(game)
    title = (request.args.get("query") or game_data.get("title") or "").strip()
    platform = (game_data.get("platform") or "").strip()
    year = (str(game_data.get("release_year") or "")).strip()
    if not title:
        return jsonify({"success": False, "message": "No game title available for trailer search.", "results": []}), 400

    search_query = " ".join(part for part in [title, platform, year, "official trailer"] if part).strip()
    try:
        results = _youtube_trailer_candidates(search_query, title, platform, year)
        return jsonify({
            "success": True,
            "query": search_query,
            "results": results,
            "message": f"Found {len(results)} likely trailer candidate{'s' if len(results) != 1 else ''}.",
        })
    except Exception as exc:
        return jsonify({
            "success": False,
            "message": f"Trailer search failed: {exc}",
            "query": search_query,
            "results": [],
        }), 400

@api_bp.route("/api/games/<int:game_id>/trailer", methods=["POST"])
def api_game_trailer_save(game_id):
    payload = request.get_json(silent=True) or request.form
    trailer_url = (payload.get("trailer_url") or "").strip()
    trailer_provider = (payload.get("trailer_provider") or "YouTube").strip()
    trailer_title = (payload.get("trailer_title") or "Official Trailer").strip()
    embed_url = youtube_embed_url(trailer_url)

    if not trailer_url:
        return jsonify({"success": False, "message": "No trailer URL was provided."}), 400

    # Non-YouTube links can still be saved/opened externally, but only YouTube links are embedded.
    conn = get_connection()
    game = conn.execute("SELECT * FROM games WHERE id=?", (game_id,)).fetchone()
    if game is None:
        conn.close()
        abort(404)
    conn.execute(
        """
        UPDATE games
        SET trailer_url=?, trailer_provider=?, trailer_title=?, trailer_embed_url=?, trailer_updated_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP
        WHERE id=?
        """,
        (trailer_url, trailer_provider, trailer_title, embed_url, game_id),
    )
    conn.commit()
    updated = conn.execute("SELECT * FROM games WHERE id=?", (game_id,)).fetchone()
    conn.close()
    return jsonify({"success": True, "message": "Trailer saved.", "game": enrich_game(row_to_dict(updated))})


@api_bp.route("/api/games/<int:game_id>/trailer/remove", methods=["POST"])
def api_game_trailer_remove(game_id):
    conn = get_connection()
    game = conn.execute("SELECT * FROM games WHERE id=?", (game_id,)).fetchone()
    if game is None:
        conn.close()
        abort(404)
    conn.execute(
        """
        UPDATE games
        SET trailer_url='', trailer_provider='', trailer_title='', trailer_embed_url='', trailer_updated_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP
        WHERE id=?
        """,
        (game_id,),
    )
    conn.commit()
    updated = conn.execute("SELECT * FROM games WHERE id=?", (game_id,)).fetchone()
    conn.close()
    return jsonify({"success": True, "message": "Trailer removed.", "game": enrich_game(row_to_dict(updated))})



@api_bp.route("/api/games/<int:game_id>/patches/search")
def api_patch_search(game_id):
    provider = (request.args.get("provider") or "all").strip()
    category = (request.args.get("category") or "all").strip()
    conn = get_connection()
    game = conn.execute("SELECT * FROM games WHERE id=?", (game_id,)).fetchone()
    conn.close()
    if game is None:
        abort(404)
    data = patch_search_results(row_to_dict(game), provider, category)
    return jsonify({"success": True, "game_id": game_id, **data})


@api_bp.route("/api/games/<int:game_id>/patch-link", methods=["POST"])
def api_patch_link(game_id):
    payload = request.get_json(silent=True) or request.form
    patch_url = (payload.get("patch_url") or "").strip()
    patch_provider = (payload.get("patch_provider") or "Patch Engine").strip()
    patch_title = (payload.get("patch_title") or "Patch/Fix Reference").strip()
    patch_category = (payload.get("patch_category") or "Compatibility").strip()
    patch_notes = (payload.get("patch_notes") or "").strip()
    if not patch_url:
        return jsonify({"success": False, "message": "No patch/fix URL was provided."}), 400
    conn = get_connection()
    game = conn.execute("SELECT * FROM games WHERE id=?", (game_id,)).fetchone()
    if game is None:
        conn.close()
        abort(404)
    conn.execute(
        """
        UPDATE games
        SET patch_url=?, patch_provider=?, patch_title=?, patch_category=?, patch_notes=?, patch_checked_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP
        WHERE id=?
        """,
        (patch_url, patch_provider, patch_title, patch_category, patch_notes, game_id),
    )
    conn.commit()
    updated = conn.execute("SELECT * FROM games WHERE id=?", (game_id,)).fetchone()
    conn.close()
    return jsonify({"success": True, "message": "Patch/fix reference saved.", "game": enrich_game(row_to_dict(updated))})


@api_bp.route("/api/games/<int:game_id>/patch-remove", methods=["POST"])
def api_patch_remove(game_id):
    conn = get_connection()
    game = conn.execute("SELECT * FROM games WHERE id=?", (game_id,)).fetchone()
    if game is None:
        conn.close()
        abort(404)
    conn.execute(
        """
        UPDATE games
        SET patch_url='', patch_provider='', patch_title='', patch_category='', patch_notes='', patch_checked_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP
        WHERE id=?
        """,
        (game_id,),
    )
    conn.commit()
    updated = conn.execute("SELECT * FROM games WHERE id=?", (game_id,)).fetchone()
    conn.close()
    return jsonify({"success": True, "message": "Patch/fix reference removed.", "game": enrich_game(row_to_dict(updated))})


@api_bp.route('/api/games/<int:game_id>/provider-intelligence')
def api_provider_intelligence(game_id):
    from app.services.provider_intelligence import build_provider_intelligence
    query = request.args.get('query', '').strip()
    return jsonify(build_provider_intelligence(game_id, query))


@api_bp.route('/api/games/<int:game_id>/provider-intelligence/merge-best', methods=['POST'])
def api_provider_intelligence_merge_best(game_id):
    from app.services.provider_intelligence import apply_merge_best
    payload = request.get_json(silent=True) or request.form
    query = (payload.get('query') or '').strip()
    enrich = payload.get('enrich', True)
    result = apply_merge_best(game_id, query, enrich=bool(enrich))
    status = 200 if result.get('success') else 400
    return jsonify(result), status
