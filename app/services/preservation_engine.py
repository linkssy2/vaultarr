from pathlib import Path
from app.database.database import get_connection

DOC_FIELDS = ("manual_count", "manual_url", "manual_file_path")
ASSET_FIELDS = ("archive_count", "installer_count", "disc_image_count", "patch_count", "soundtrack_count", "bonus_count")


def safe_int(value):
    try:
        return int(value or 0)
    except (TypeError, ValueError):
        return 0


def game_score(game):
    executable = 20 if safe_int(game.get("executable_count")) > 0 else 0
    metadata = 20 if (game.get("metadata_source") and game.get("description")) else 0
    artwork = 15 if game.get("cover_path") else 0
    docs = 0
    if safe_int(game.get("manual_count")) > 0 or game.get("manual_url") or game.get("manual_file_path"):
        docs += 15
    archive = 0
    if safe_int(game.get("installer_count")) > 0:
        archive += 8
    if safe_int(game.get("disc_image_count")) > 0:
        archive += 8
    if safe_int(game.get("archive_count")) > 0:
        archive += 7
    if safe_int(game.get("patch_count")) > 0:
        archive += 4
    if safe_int(game.get("soundtrack_count")) > 0 or safe_int(game.get("bonus_count")) > 0:
        archive += 3
    return min(100, executable + metadata + artwork + docs + archive)


def game_issues(game):
    issues = []
    if safe_int(game.get("executable_count")) == 0:
        issues.append("Missing EXE")
    if not game.get("cover_path"):
        issues.append("Missing Cover")
    if not game.get("metadata_source") or not game.get("description"):
        issues.append("Needs Metadata")
    if not game.get("category") or game.get("category") == "Unsorted":
        issues.append("Unsorted")
    if safe_int(game.get("manual_count")) == 0 and not game.get("manual_url") and not game.get("manual_file_path"):
        issues.append("Missing Manual")
    if safe_int(game.get("installer_count")) == 0 and safe_int(game.get("disc_image_count")) == 0 and safe_int(game.get("archive_count")) == 0:
        issues.append("No Archive Asset")
    return issues


def game_badge(game):
    title_path = f"{game.get('title','')} {game.get('path','')} {game.get('source_type','')}".lower()
    score = game_score(game)
    issues = game_issues(game)
    if "prototype" in title_path or "alpha" in title_path or "beta" in title_path:
        return "Prototype"
    if score >= 90 and not any(issue in issues for issue in ("Missing EXE", "Needs Metadata", "Missing Cover")):
        return "Archive Ready"
    if score >= 78:
        return "Complete"
    if "Missing Manual" in issues:
        return "Needs Manual"
    if "No Archive Asset" in issues:
        return "Needs Archive"
    if "Needs Metadata" in issues:
        return "Needs Metadata"
    return "Incomplete"


def asset_summary(game):
    assets = []
    mapping = [
        ("manual_count", "Manuals"),
        ("manual_file_path", "Downloaded Manual"),
        ("readme_count", "ReadMes Optional"),
        ("archive_count", "Archives"),
        ("installer_count", "Installers"),
        ("disc_image_count", "Disc Images"),
        ("patch_count", "Patches"),
        ("soundtrack_count", "Soundtracks"),
        ("bonus_count", "Bonus"),
    ]
    for key, label in mapping:
        if key == "manual_file_path":
            if game.get(key):
                assets.append({"label": label, "count": 1})
            continue
        count = safe_int(game.get(key))
        if count:
            assets.append({"label": label, "count": count})
    return assets


def enrich_preservation(game_dict):
    game_dict = dict(game_dict)
    game_dict["preservation_score"] = game_score(game_dict)
    game_dict["preservation_badge"] = game_badge(game_dict)
    game_dict["preservation_issues"] = game_issues(game_dict)
    game_dict["preservation_assets"] = asset_summary(game_dict)
    return game_dict


def update_all_preservation_scores():
    conn = get_connection()
    games = conn.execute("SELECT * FROM games").fetchall()
    updated = 0
    for row in games:
        game = dict(row)
        conn.execute(
            "UPDATE games SET preservation_score=?, preservation_badge=? WHERE id=?",
            (game_score(game), game_badge(game), game["id"]),
        )
        updated += 1
    conn.commit()
    conn.close()
    return updated


def preservation_report():
    conn = get_connection()
    games = [enrich_preservation(dict(row)) for row in conn.execute("SELECT * FROM games ORDER BY title COLLATE NOCASE").fetchall()]

    duplicate_titles = conn.execute('''
        SELECT title, COUNT(*) AS count
        FROM games
        GROUP BY LOWER(title)
        HAVING COUNT(*) > 1
        ORDER BY count DESC, title ASC
        LIMIT 20
    ''').fetchall()

    duplicate_executables = conn.execute('''
        SELECT executables, COUNT(*) AS count
        FROM games
        WHERE executables IS NOT NULL AND executables != ''
        GROUP BY LOWER(executables)
        HAVING COUNT(*) > 1
        ORDER BY count DESC
        LIMIT 20
    ''').fetchall()

    assets = conn.execute('''
        SELECT
          COALESCE(SUM(manual_count), 0) AS manuals,
          COALESCE(SUM(CASE WHEN manual_url IS NOT NULL AND manual_url != '' THEN 1 ELSE 0 END), 0) AS manual_links,
          COALESCE(SUM(CASE WHEN manual_file_path IS NOT NULL AND manual_file_path != '' THEN 1 ELSE 0 END), 0) AS manual_downloads,
          COALESCE(SUM(readme_count), 0) AS readmes,
          COALESCE(SUM(archive_count), 0) AS archives,
          COALESCE(SUM(installer_count), 0) AS installers,
          COALESCE(SUM(disc_image_count), 0) AS disc_images,
          COALESCE(SUM(patch_count), 0) AS patches,
          COALESCE(SUM(soundtrack_count), 0) AS soundtracks,
          COALESCE(SUM(bonus_count), 0) AS bonus
        FROM games
    ''').fetchone()
    conn.close()

    total = len(games)
    average_score = round(sum(game["preservation_score"] for game in games) / total) if total else 100
    needs_attention = [game for game in games if game["preservation_score"] < 80][:32]
    archive_ready = [game for game in games if game["preservation_badge"] == "Archive Ready"]
    badge_counts = {}
    for game in games:
        badge_counts[game["preservation_badge"]] = badge_counts.get(game["preservation_badge"], 0) + 1

    def missing_count(issue):
        return len([game for game in games if issue in game["preservation_issues"]])

    return {
        "total_games": total,
        "health_score": average_score,
        "archive_ready_count": len(archive_ready),
        "needs_attention": needs_attention,
        "duplicate_titles": duplicate_titles,
        "duplicate_executables": duplicate_executables,
        "preservation_assets": assets,
        "badge_counts": badge_counts,
        "missing_exe": missing_count("Missing EXE"),
        "missing_cover": missing_count("Missing Cover"),
        "missing_metadata": missing_count("Needs Metadata"),
        "missing_manual": missing_count("Missing Manual"),
        "missing_readme": 0,
        "missing_archive": missing_count("No Archive Asset"),
        "unsorted": missing_count("Unsorted"),
        "readme_optional_note": "ReadMes are indexed as optional local files and are not required for archive completeness.",
    }
