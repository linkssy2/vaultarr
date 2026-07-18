from app.database.database import get_connection
from app.services.health_service import system_health


def _count(conn, query, params=()):
    return conn.execute(query, params).fetchone()[0]


def _first_issue(game):
    if not game:
        return "Review"
    try:
        if not game["cover_path"]:
            return "Missing Cover"
        if not game["description"] or not game["metadata_source"]:
            return "Needs Metadata"
        if not game["category"] or game["category"] == "Unsorted":
            return "Needs Sorting"
        if game["executable_count"] == 0:
            return "No Executable"
    except Exception:
        pass
    return "Review"


def get_dashboard_stats():
    conn = get_connection()

    game_columns = {row[1] for row in conn.execute("PRAGMA table_info(games)").fetchall()}
    manual_missing_sql = "0"
    if "manual_count" in game_columns:
        manual_missing_sql = "(manual_count = 0 OR manual_count IS NULL)"
        if "manual_url" in game_columns:
            manual_missing_sql += " AND (manual_url = '' OR manual_url IS NULL)"

    game_summary = conn.execute(f"""
        SELECT
            COUNT(*) AS game_count,
            COALESCE(SUM(size_bytes), 0) AS storage,
            COALESCE(SUM(CASE WHEN executable_count = 0 THEN 1 ELSE 0 END), 0) AS missing_executables,
            COALESCE(SUM(CASE WHEN cover_path = '' OR cover_path IS NULL THEN 1 ELSE 0 END), 0) AS missing_covers,
            COALESCE(SUM(CASE
                WHEN description = '' OR description IS NULL
                  OR metadata_source = '' OR metadata_source IS NULL
                THEN 1 ELSE 0 END), 0) AS missing_metadata,
            COALESCE(SUM(CASE
                WHEN category = '' OR category IS NULL OR category = 'Unsorted'
                THEN 1 ELSE 0 END), 0) AS unsorted_games,
            COALESCE(SUM(CASE WHEN {manual_missing_sql} THEN 1 ELSE 0 END), 0) AS missing_manuals
        FROM games
    """).fetchone()

    game_count = game_summary["game_count"]
    library_count = _count(conn, "SELECT COUNT(*) FROM libraries")
    storage = game_summary["storage"]
    missing_executables = game_summary["missing_executables"]
    missing_covers = game_summary["missing_covers"]
    missing_metadata = game_summary["missing_metadata"]
    unsorted_games = game_summary["unsorted_games"]
    missing_manuals = game_summary["missing_manuals"]
    missing_readmes = 0

    missing_documentation = missing_manuals

    category_count = _count(conn, """
        SELECT COUNT(*) FROM (
            SELECT COALESCE(NULLIF(category, ''), 'Unsorted') AS category
            FROM games
            GROUP BY COALESCE(NULLIF(category, ''), 'Unsorted')
        )
    """)

    recently_scanned = conn.execute("""
        SELECT * FROM games
        WHERE last_scanned IS NOT NULL
        ORDER BY last_scanned DESC
        LIMIT 5
    """).fetchall()

    recently_added = conn.execute("""
        SELECT * FROM games
        ORDER BY COALESCE(added_at, updated_at, last_scanned) DESC
        LIMIT 10
    """).fetchall()

    next_task_game = conn.execute("""
        SELECT * FROM games
        WHERE cover_path = '' OR cover_path IS NULL
           OR description = '' OR description IS NULL
           OR metadata_source = '' OR metadata_source IS NULL
           OR category = '' OR category IS NULL OR category = 'Unsorted'
           OR executable_count = 0
        ORDER BY
            CASE WHEN cover_path = '' OR cover_path IS NULL THEN 0 ELSE 1 END,
            CASE WHEN description = '' OR description IS NULL THEN 0 ELSE 1 END,
            CASE WHEN metadata_source = '' OR metadata_source IS NULL THEN 0 ELSE 1 END,
            title
        LIMIT 1
    """).fetchone()

    rediscover_game = conn.execute("""
        SELECT * FROM games
        ORDER BY
            CASE WHEN COALESCE(cover_path, '') != '' THEN 0 ELSE 1 END,
            COALESCE(updated_at, added_at, last_scanned, '') ASC,
            title ASC
        LIMIT 1
    """).fetchone()

    continue_game = conn.execute("""
        SELECT * FROM games
        ORDER BY COALESCE(updated_at, last_scanned, added_at, '') DESC, title ASC
        LIMIT 1
    """).fetchone()

    category_breakdown = conn.execute("""
        SELECT COALESCE(NULLIF(category, ''), 'Unsorted') AS category, COUNT(*) AS count
        FROM games
        GROUP BY COALESCE(NULLIF(category, ''), 'Unsorted')
        ORDER BY count DESC, category ASC
        LIMIT 6
    """).fetchall()

    top_developer = conn.execute("""
        SELECT developer, COUNT(*) AS count
        FROM games
        WHERE developer IS NOT NULL AND developer != '' AND developer != 'Unknown'
        GROUP BY developer
        ORDER BY count DESC, developer ASC
        LIMIT 1
    """).fetchone()

    top_publisher = conn.execute("""
        SELECT publisher, COUNT(*) AS count
        FROM games
        WHERE publisher IS NOT NULL AND publisher != '' AND publisher != 'Unknown'
        GROUP BY publisher
        ORDER BY count DESC, publisher ASC
        LIMIT 1
    """).fetchone()

    top_genre = conn.execute("""
        SELECT genre, COUNT(*) AS count
        FROM games
        WHERE genre IS NOT NULL AND genre != '' AND genre != 'Unknown'
        GROUP BY genre
        ORDER BY count DESC, genre ASC
        LIMIT 1
    """).fetchone()

    conn.close()

    def score_from_missing(missing):
        if game_count <= 0:
            return 100
        return max(0, min(100, round(100 - ((missing / game_count) * 100))))

    metadata_score = score_from_missing(missing_metadata)
    artwork_score = score_from_missing(missing_covers)
    preservation_score = score_from_missing(missing_executables)
    organization_score = score_from_missing(unsorted_games)
    documentation_score = score_from_missing(missing_documentation)

    health_score = round((metadata_score + artwork_score + preservation_score + organization_score + documentation_score) / 5)
    open_tasks = missing_executables + missing_covers + missing_metadata + unsorted_games + missing_documentation

    next_task = None
    if next_task_game:
        issues = []
        if not next_task_game["cover_path"]:
            issues.append("Missing Cover")
        if not next_task_game["description"] or not next_task_game["metadata_source"]:
            issues.append("Needs Metadata")
        if not next_task_game["category"] or next_task_game["category"] == "Unsorted":
            issues.append("Unsorted")
        if next_task_game["executable_count"] == 0:
            issues.append("No Executable")

        next_task = {
            "id": next_task_game["id"],
            "title": next_task_game["title"],
            "url": f"/games/{next_task_game['id']}",
            "description": "This game can be improved with metadata, artwork, category review, or preservation details.",
            "cover_path": next_task_game["cover_path"],
            "issues": issues[:4] or ["Review"],
            "primary_issue": issues[0] if issues else "Review",
        }

    def card_from_game(game, fallback_label="Game"):
        if not game:
            return None
        return {
            "id": game["id"],
            "title": game["title"],
            "url": f"/games/{game['id']}",
            "cover_path": game["cover_path"],
            "label": game["category"] or game["genre"] or fallback_label,
            "year": game["release_year"] or "",
            "issue": _first_issue(game),
        }

    continue_browsing = card_from_game(continue_game, "Latest")
    rediscover = card_from_game(rediscover_game, "Rediscover")

    recent_activity = []
    for game in recently_scanned[:3]:
        recent_activity.append({
            "label": "Museum scanned",
            "title": game["title"],
            "url": f"/games/{game['id']}",
            "tone": "scan",
        })

    if missing_metadata:
        recent_activity.append({"label": "Metadata needed", "title": f"{missing_metadata} games need identities", "url": "/museum?attention=1", "tone": "metadata"})
    if missing_covers:
        recent_activity.append({"label": "Artwork needed", "title": f"{missing_covers} covers missing", "url": "/museum?attention=1", "tone": "artwork"})
    if missing_documentation:
        recent_activity.append({"label": "Documentation missing", "title": f"{missing_documentation} manuals can be linked", "url": "/museum?attention=1", "tone": "docs"})

    hero = {
        "kicker": "Vaultarr Alpha 23.7",
        "title": "Welcome back to the vault.",
        "message": "Your collection is ready for preservation, discovery, and rediscovery.",
        "accent": "Discovery online",
    }

    if game_count <= 0:
        hero.update({
            "title": "Your vault is waiting.",
            "message": "Choose a game folder and start building your personal game museum.",
            "accent": "No games scanned yet",
        })
    elif open_tasks == 0:
        hero.update({
            "title": "Your vault is calm.",
            "message": "No urgent preservation tasks are waiting. Explore your museum or rediscover something old.",
            "accent": "Everything looks good",
        })
    elif missing_metadata > 0:
        hero.update({
            "title": f"{missing_metadata} games are waiting for identity.",
            "message": "Resolve metadata matches to turn scanned folders into complete records.",
            "accent": "Metadata queue active",
        })
    elif missing_covers > 0:
        hero.update({
            "title": f"{missing_covers} games need artwork.",
            "message": "Bring the shelf to life by filling in missing covers.",
            "accent": "Artwork needed",
        })

    insights = []
    if top_publisher:
        insights.append({
            "label": "Publisher cluster",
            "title": top_publisher["publisher"],
            "value": f"{top_publisher['count']} games",
            "url": f"/library?q={top_publisher['publisher']}",
        })
    if top_developer:
        insights.append({
            "label": "Developer shelf",
            "title": top_developer["developer"],
            "value": f"{top_developer['count']} games",
            "url": f"/library?q={top_developer['developer']}",
        })
    if top_genre:
        insights.append({
            "label": "Dominant genre",
            "title": top_genre["genre"],
            "value": f"{top_genre['count']} games",
            "url": f"/library?q={top_genre['genre']}",
        })
    if category_breakdown:
        first = category_breakdown[0]
        insights.append({
            "label": "Largest collection",
            "title": first["category"],
            "value": f"{first['count']} games",
            "url": f"/collections/{first['category']}",
        })

    storage_gb = round(storage / 1024 / 1024 / 1024, 2)
    storage_bar_percent = min(100, max(3, round((storage_gb / max(storage_gb * 1.4, 1)) * 100))) if storage_gb else 3

    try:
        system = system_health()
    except Exception:
        system = {"score": health_score, "checks": [], "issues": ["System health is temporarily unavailable."], "media_cache": {}}

    return {
        "game_count": game_count,
        "library_count": library_count,
        "category_count": category_count,
        "storage_gb": storage_gb,
        "storage_bar_percent": storage_bar_percent,
        "missing_executables": missing_executables,
        "missing_covers": missing_covers,
        "missing_metadata": missing_metadata,
        "missing_manuals": missing_manuals,
        "missing_readmes": missing_readmes,
        "missing_documentation": missing_documentation,
        "unsorted_games": unsorted_games,
        "open_tasks": open_tasks,
        "health_score": health_score,
        "metadata_score": metadata_score,
        "artwork_score": artwork_score,
        "preservation_score": preservation_score,
        "organization_score": organization_score,
        "documentation_score": documentation_score,
        "recently_scanned": recently_scanned,
        "recently_added": recently_added,
        "category_breakdown": category_breakdown,
        "next_task": next_task,
        "recent_activity": recent_activity[:6],
        "continue_browsing": continue_browsing,
        "rediscover": rediscover,
        "hero": hero,
        "insights": insights[:4],
        "system_health": system,
    }
