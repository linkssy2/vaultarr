from concurrent.futures import ThreadPoolExecutor
from copy import deepcopy
from app.database.database import get_connection
from app.services.preservation_engine import enrich_preservation, game_score, game_badge
from app.services.metadata_service import (
    search_metadata_diagnostics, get_steam_details, get_wikipedia_details,
    get_rawg_details, get_igdb_details, get_steamgriddb_details, download_cover
)
from app.services.launchbox_service import get_launchbox_details
from app.services.media_service import provider_media_results, download_media_asset, select_best_cover, media_for_gallery_cache, annotate_media_item
from app.services.manual_service import manual_search_results, download_manual_pdf

MERGE_FIELDS = [
    ("title", "Title"),
    ("description", "Description"),
    ("developer", "Developer"),
    ("publisher", "Publisher"),
    ("release_year", "Year"),
    ("genre", "Genre"),
    ("platform", "Platform"),
    ("cover_url", "Cover"),
]

PROVIDER_FIELD_WEIGHTS = {
    "LaunchBox": {
        "title": 94, "description": 88, "developer": 90, "publisher": 90,
        "release_year": 88, "genre": 90, "platform": 92, "cover_url": 55,
    },
    "IGDB": {
        "title": 92, "description": 90, "developer": 86, "publisher": 86,
        "release_year": 88, "genre": 86, "platform": 85, "cover_url": 88,
    },
    "RAWG": {
        "title": 86, "description": 82, "developer": 80, "publisher": 78,
        "release_year": 82, "genre": 82, "platform": 80, "cover_url": 82,
    },
    "Steam": {
        "title": 84, "description": 76, "developer": 74, "publisher": 74,
        "release_year": 72, "genre": 72, "platform": 68, "cover_url": 70,
    },
    "SteamGridDB": {
        "title": 70, "description": 20, "developer": 20, "publisher": 20,
        "release_year": 20, "genre": 20, "platform": 20, "cover_url": 92,
    },
    "Wikipedia": {
        "title": 74, "description": 84, "developer": 70, "publisher": 70,
        "release_year": 72, "genre": 66, "platform": 56, "cover_url": 40,
    },
}


def row_to_dict(row):
    return dict(row) if row else None


def enrich_basic(data):
    data = data or {}
    size_bytes = data.get("size_bytes") or 0
    data["size_gb"] = round(size_bytes / 1024 / 1024 / 1024, 2)
    data["cover_src"] = f"/covers/{data.get('cover_path')}" if data.get("cover_path") else ""
    try:
        data = enrich_preservation(data)
    except Exception:
        pass
    return data


def get_provider_details(source, external_id):
    key = (source or "").strip().lower()
    if key == "steam":
        return get_steam_details(external_id)
    if key == "wikipedia":
        return get_wikipedia_details(external_id)
    if key == "rawg":
        return get_rawg_details(external_id)
    if key == "igdb":
        return get_igdb_details(external_id)
    if key == "steamgriddb":
        return get_steamgriddb_details(external_id)
    if key == "launchbox":
        return get_launchbox_details(external_id)
    return None


def _norm(value):
    return str(value or "").strip()


def _has_value(value):
    return bool(_norm(value))


def _provider_quality(details, base_confidence=0):
    source = details.get("metadata_source") or details.get("source") or "Unknown"
    weights = PROVIDER_FIELD_WEIGHTS.get(source, {})
    fields = []
    total = 0
    possible = 0

    for key, label in MERGE_FIELDS:
        weight = weights.get(key, 60)
        possible += weight
        present = _has_value(details.get(key))
        if present:
            total += weight
        fields.append({
            "field": key,
            "label": label,
            "present": present,
            "score": weight if present else 0,
            "value": details.get(key) or "",
        })

    completeness = round((total / possible) * 100) if possible else 0
    confidence = int(base_confidence or details.get("confidence") or 0)
    quality = round((completeness * 0.72) + (confidence * 0.28))

    return {
        "source": source,
        "external_id": details.get("metadata_external_id") or details.get("external_id") or "",
        "title": details.get("title") or "Untitled",
        "quality": quality,
        "completeness": completeness,
        "confidence": confidence,
        "fields": fields,
        "cover_url": details.get("cover_url") or "",
        "description": details.get("description") or "",
    }


def build_provider_intelligence(game_id, query=""):
    conn = get_connection()
    row = conn.execute("SELECT * FROM games WHERE id = ?", (game_id,)).fetchone()
    conn.close()
    if not row:
        return {"success": False, "message": "Game not found."}

    current = enrich_basic(row_to_dict(row))
    search_query = query or current.get("title") or ""
    diagnostics = search_metadata_diagnostics(search_query, "all")
    raw_results = diagnostics.get("results", [])

    candidates = []
    seen_sources = set()
    for result in raw_results:
        source = result.get("source") or ""
        if not source or source in seen_sources:
            continue
        seen_sources.add(source)
        candidates.append((source, result))

    def load_details(candidate):
        source, result = candidate
        try:
            details = get_provider_details(source, str(result.get("external_id") or ""))
        except Exception:
            details = None
        if not details:
            details = deepcopy(result)
            details["metadata_source"] = source
            details["metadata_external_id"] = result.get("external_id", "")
        details["confidence"] = result.get("confidence", details.get("confidence", 0))
        return source, result, details

    if candidates:
        with ThreadPoolExecutor(max_workers=min(4, len(candidates)), thread_name_prefix="vaultarr-details") as pool:
            loaded_details = list(pool.map(load_details, candidates))
    else:
        loaded_details = []

    provider_cards = []
    details_by_provider = {}
    for source, result, details in loaded_details:
        details_by_provider[source] = details
        provider_cards.append(_provider_quality(details, result.get("confidence", 0)))

    provider_cards.sort(key=lambda item: item["quality"], reverse=True)

    merge_plan = build_merge_plan(current, list(details_by_provider.values()))
    recommended = provider_cards[0] if provider_cards else None

    return {
        "success": True,
        "query": search_query,
        "current": current,
        "providers": provider_cards,
        "merge_plan": merge_plan,
        "recommended": recommended,
        "logs": diagnostics.get("logs", []),
    }


def build_merge_plan(current, details_list):
    rows = []
    merged = {}

    for key, label in MERGE_FIELDS:
        candidates = []
        for details in details_list:
            value = details.get(key)
            if not _has_value(value):
                continue
            source = details.get("metadata_source") or details.get("source") or "Unknown"
            confidence = int(details.get("confidence") or 0)
            score = PROVIDER_FIELD_WEIGHTS.get(source, {}).get(key, 60) + round(confidence * 0.25)
            candidates.append({
                "source": source,
                "value": value,
                "score": score,
            })
        candidates.sort(key=lambda item: item["score"], reverse=True)
        winner = candidates[0] if candidates else None
        if winner:
            merged[key] = winner["value"]
        rows.append({
            "field": key,
            "label": label,
            "current": (current.get("cover_url") if key == "cover_url" else current.get(key, "")),
            "recommended": winner.get("value") if winner else "",
            "source": winner.get("source") if winner else "",
            "candidates": candidates[:4],
        })

    # Alpha 22.2: cover fields are selected with Media Intelligence, not simple provider weight.
    metadata_cover_candidates = []
    for details in details_list:
        cover_url = details.get("cover_url") or ""
        if not cover_url:
            continue
        metadata_cover_candidates.append({
            "provider": details.get("metadata_source") or details.get("source") or "Provider",
            "title": details.get("title") or "Provider Cover",
            "cover_url": cover_url,
            "confidence": details.get("confidence") or 86,
        })
    best_cover = select_best_cover(metadata_candidates=metadata_cover_candidates)
    if best_cover:
        merged["cover_url"] = best_cover.get("url") or best_cover.get("remote_url") or ""
        for row in rows:
            if row.get("field") == "cover_url":
                row["recommended"] = merged["cover_url"]
                row["source"] = best_cover.get("provider") or "Media Intelligence"
                row["media_role"] = best_cover.get("media_role")
                row["cover_score"] = best_cover.get("cover_score")
                row["candidates"] = [{
                    "source": best_cover.get("provider") or "Media Intelligence",
                    "value": merged["cover_url"],
                    "score": best_cover.get("cover_score") or 0,
                    "role": best_cover.get("media_role") or "box_cover",
                }] + row.get("candidates", [])[:3]
                break

    return {"rows": rows, "merged": merged}




def enrich_after_merge(game_id, game):
    """Cache provider assets related to the merged record without blocking the merge if a provider fails."""
    summary = {
        "cover_cached": False,
        "cached_media": 0,
        "manual_checked": False,
        "manual_downloaded": False,
        "errors": [],
    }

    # Alpha 22.2: classify provider media first so screenshots/heroes are never promoted to box cover art.
    media_results = []
    try:
        media_data = provider_media_results(game, "all")
        media_results = [annotate_media_item(item) for item in (media_data.get("results") or [])]
    except Exception as exc:
        summary["errors"].append(f"Media intelligence skipped: {exc}")

    metadata_cover_candidates = []
    if (game or {}).get("cover_url"):
        metadata_cover_candidates.append({
            "provider": game.get("metadata_source") or "Provider Intelligence",
            "title": game.get("title") or "Provider Cover",
            "cover_url": game.get("cover_url"),
            "confidence": 90,
        })

    best_cover = select_best_cover(media_results, metadata_cover_candidates)
    cover_locked = int((game or {}).get("preferred_cover_locked") or 0) == 1
    if cover_locked:
        summary["cover_cached"] = False
        summary["cover_source"] = (game or {}).get("preferred_cover_provider") or "User Preferred"
        summary["cover_role"] = "preferred_locked"
        summary["errors"].append("Cover selection skipped: user preferred cover is locked.")
    else:
        cover_url = (best_cover or {}).get("url") or (best_cover or {}).get("remote_url") or (game or {}).get("cover_url") or ""
        if cover_url:
            try:
                cover_path = download_cover(game_id, cover_url)
                if cover_path:
                    conn = get_connection()
                    conn.execute(
                        "UPDATE games SET cover_path=?, cover_url=?, updated_at=CURRENT_TIMESTAMP WHERE id=?",
                        (cover_path, cover_url, game_id),
                    )
                    conn.commit()
                    conn.close()
                    summary["cover_cached"] = True
                    summary["cover_source"] = (best_cover or {}).get("provider") or "Provider Intelligence"
                    summary["cover_role"] = (best_cover or {}).get("media_role") or "box_cover"
                    summary["cover_score"] = (best_cover or {}).get("cover_score") or 0
                    game["cover_path"] = cover_path
                    game["cover_url"] = cover_url
            except Exception as exc:
                summary["errors"].append(f"Cover cache skipped: {exc}")

    # Cache gallery images after excluding front covers/logos/disc art so Gallery gets screenshots/artwork.
    try:
        cached = 0
        for item in media_for_gallery_cache(media_results, limit=8):
            url = item.get("url") or item.get("remote_url") or ""
            if not url:
                continue
            try:
                download_media_asset(
                    game_id,
                    url,
                    item.get("title") or "Provider Media",
                    item.get("provider") or "Provider",
                    item.get("media_role") or item.get("media_type") or "screenshot",
                )
                cached += 1
            except Exception:
                continue
        summary["cached_media"] = cached
    except Exception as exc:
        summary["errors"].append(f"Gallery cache skipped: {exc}")

    # If the Manual Engine finds a very strong direct PDF match, download it automatically.
    try:
        summary["manual_checked"] = True
        manual_data = manual_search_results(game.get("title") or "", game.get("platform") or "", "all")
        candidates = [
            item for item in (manual_data.get("results") or [])
            if (item.get("is_pdf_candidate") or item.get("kind") == "direct_pdf")
            and int(item.get("confidence") or 0) >= 94
            and item.get("url")
        ]
        if candidates:
            best = sorted(candidates, key=lambda item: int(item.get("confidence") or 0), reverse=True)[0]
            saved = download_manual_pdf(game_id, best.get("url"), game.get("title") or "Manual")
            conn = get_connection()
            conn.execute(
                """
                UPDATE games
                SET manual_url=?, manual_provider=?, manual_file_path=?, manual_file_name=?, manual_file_size=?,
                    manual_downloaded_at=CURRENT_TIMESTAMP, manual_checked_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP
                WHERE id=?
                """,
                (
                    best.get("url"),
                    best.get("provider") or "Manual Engine",
                    saved.get("path"),
                    saved.get("filename"),
                    saved.get("size", 0),
                    game_id,
                ),
            )
            conn.commit()
            conn.close()
            summary["manual_downloaded"] = True
    except Exception as exc:
        summary["errors"].append(f"Manual auto-download skipped: {exc}")

    return summary

def apply_merge_best(game_id, query="", enrich=True):
    data = build_provider_intelligence(game_id, query)
    if not data.get("success"):
        return data
    merged = data.get("merge_plan", {}).get("merged", {})
    if not merged:
        return {"success": False, "message": "No provider fields were available to merge."}

    # Cover download is handled elsewhere by normal apply flow; for merge-best store remote cover URL.
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
            metadata_source = 'Vault Intelligence',
            metadata_external_id = 'merge-best',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        """,
        (
            merged.get("title", ""), merged.get("title", ""),
            merged.get("description", ""), merged.get("description", ""),
            merged.get("developer", ""), merged.get("developer", ""),
            merged.get("publisher", ""), merged.get("publisher", ""),
            merged.get("release_year", ""), merged.get("release_year", ""),
            merged.get("genre", ""), merged.get("genre", ""),
            merged.get("platform", ""), merged.get("platform", ""),
            merged.get("cover_url", ""), merged.get("cover_url", ""),
            game_id,
        ),
    )
    conn.commit()
    row = conn.execute("SELECT * FROM games WHERE id = ?", (game_id,)).fetchone()
    conn.close()

    game_data = enrich_basic(row_to_dict(row))
    enrichment = enrich_after_merge(game_id, game_data) if enrich else {}

    conn = get_connection()
    refreshed_for_score = conn.execute("SELECT * FROM games WHERE id = ?", (game_id,)).fetchone()
    if refreshed_for_score:
        score_game = row_to_dict(refreshed_for_score)
        score = game_score(score_game)
        badge = game_badge(score_game)
        conn.execute("UPDATE games SET preservation_score=?, preservation_badge=?, updated_at=CURRENT_TIMESTAMP WHERE id=?", (score, badge, game_id))
        conn.commit()
    refreshed = conn.execute("SELECT * FROM games WHERE id = ?", (game_id,)).fetchone()
    conn.close()
    game_data = enrich_basic(row_to_dict(refreshed))

    message_bits = ["Best provider fields merged"]
    if enrichment.get("cover_cached"):
        message_bits.append("cover cached")
    if enrichment.get("cached_media"):
        message_bits.append(f"{enrichment.get('cached_media')} gallery image(s) cached")
    if enrichment.get("manual_downloaded"):
        message_bits.append("manual downloaded")

    return {
        "success": True,
        "message": "; ".join(message_bits) + ".",
        "game": game_data,
        "intelligence": data,
        "enrichment": enrichment,
    }
