import json
import re
from collections import defaultdict
from app.database.database import get_connection

SMART_COLLECTION_DEFS = [
    {"name": "Abandonware", "kind": "smart", "description": "Older PC/DOS titles, delisted/archive hints, freeware/shareware clues.", "attrs": ["abandonware"]},
    {"name": "PC Ports", "kind": "smart", "description": "Games that appear to be ports or PC releases of console-era titles.", "attrs": ["pc_port", "console_port"]},
    {"name": "Fanmade", "kind": "smart", "description": "Fan games, fan remakes, community releases, source ports.", "attrs": ["fanmade", "fan_remake", "source_port"]},
    {"name": "Sci-Fi FPS", "kind": "smart", "description": "First-person shooters with sci-fi, alien, space, cyberpunk, or future-war signals.", "attrs": ["sci_fi_fps"]},
    {"name": "Survival Horror", "kind": "smart", "description": "Horror, zombies, survival, haunted, and dark adventure signals.", "attrs": ["survival_horror"]},
    {"name": "Immersive Sims", "kind": "smart", "description": "RPG/shooter/sim hybrids with systemic or stealth-heavy tags.", "attrs": ["immersive_sim"]},
    {"name": "Source Ports", "kind": "smart", "description": "OpenMW, ScummVM, GZDoom, DOSBox, reverse-engineered or open-source engines.", "attrs": ["source_port"]},
    {"name": "2000s PC", "kind": "smart", "description": "Windows/PC titles released from 2000 through 2009.", "attrs": ["era_2000s", "windows_pc"]},
    {"name": "90s DOS", "kind": "smart", "description": "DOS or DOSBox-era titles released from 1990 through 1999.", "attrs": ["era_1990s", "dos"]},
    {"name": "Archive Complete", "kind": "smart", "description": "Games with strong preservation scores and major archive assets present.", "attrs": ["archive_complete"]},
]

CUSTOM_COLLECTION_TABLE = "collection_definitions"
GAME_ATTRIBUTE_TABLE = "game_collection_attributes"
GAME_COLLECTION_TABLE = "game_collections"


def ensure_collection_tables(conn):
    conn.execute(f"""
    CREATE TABLE IF NOT EXISTS {CUSTOM_COLLECTION_TABLE} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        kind TEXT DEFAULT 'user',
        description TEXT DEFAULT '',
        rule_json TEXT DEFAULT '',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
    """)
    conn.execute(f"""
    CREATE TABLE IF NOT EXISTS {GAME_ATTRIBUTE_TABLE} (
        game_id INTEGER NOT NULL,
        attribute TEXT NOT NULL,
        confidence INTEGER DEFAULT 0,
        source TEXT DEFAULT 'rules',
        reason TEXT DEFAULT '',
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(game_id, attribute)
    )
    """)
    conn.execute(f"""
    CREATE TABLE IF NOT EXISTS {GAME_COLLECTION_TABLE} (
        game_id INTEGER NOT NULL,
        collection_id INTEGER NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(game_id, collection_id)
    )
    """)
    conn.commit()


def _text(game):
    parts = []
    for key in ["title", "path", "description", "developer", "publisher", "genre", "platform", "tags", "category", "metadata_source"]:
        try:
            parts.append(str(game[key] or ""))
        except Exception:
            pass
    return " ".join(parts).lower()


def _year(game):
    try:
        match = re.search(r"(19\d{2}|20\d{2})", str(game["release_year"] or ""))
        return int(match.group(1)) if match else None
    except Exception:
        return None


def classify_game(game):
    text = _text(game)
    year = _year(game)
    attrs = {}

    def add(attr, confidence, reason):
        attrs[attr] = max(attrs.get(attr, (0, ""))[0], confidence), reason

    if year:
        if 1980 <= year <= 1989: add("era_1980s", 88, f"release year {year}")
        if 1990 <= year <= 1999: add("era_1990s", 92, f"release year {year}")
        if 2000 <= year <= 2009: add("era_2000s", 92, f"release year {year}")
        if 2010 <= year <= 2019: add("era_2010s", 90, f"release year {year}")
        if 2020 <= year <= 2029: add("era_2020s", 90, f"release year {year}")

    if any(k in text for k in ["dos", "dosbox", "ms-dos"]): add("dos", 94, "DOS/DOSBox signal")
    if any(k in text for k in ["windows", "pc", "microsoft windows"]): add("windows_pc", 90, "Windows/PC platform signal")

    if any(k in text for k in ["abandonware", "archive.org", "my abandonware", "old-games", "delisted"]): add("abandonware", 96, "abandonware/archive hint")
    elif year and year <= 2005 and any(k in text for k in ["windows", "pc", "dos", "shareware", "freeware"]): add("abandonware", 70, "older PC/freeware-era signal")

    if any(k in text for k in ["fan game", "fangame", "fan-made", "fanmade", "fan remake", "remake"]): add("fanmade", 96, "fanmade/remake signal")
    if any(k in text for k in ["source port", "openmw", "gzdoom", "zdoom", "scummvm", "open source", "reverse engineered", "openra"]): add("source_port", 96, "source port/open engine signal")

    if any(k in text for k in ["xbox", "playstation", "ps2", "ps1", "gamecube", "dreamcast", "console"]):
        if any(k in text for k in ["windows", "pc", "microsoft windows"]):
            add("pc_port", 84, "PC and console platform signals")
            add("console_port", 74, "console release signal")

    is_fps = any(k in text for k in ["fps", "first-person", "first person", "shooter"])
    is_scifi = any(k in text for k in ["sci-fi", "science fiction", "alien", "space", "cyber", "future", "area 51", "doom", "quake"])
    if is_fps and is_scifi: add("sci_fi_fps", 94, "FPS + sci-fi signals")

    if any(k in text for k in ["survival horror", "horror", "zombie", "haunted", "resident evil", "silent hill", "dead space"]): add("survival_horror", 92, "horror/survival signal")
    if any(k in text for k in ["immersive sim", "deus ex", "system shock", "thief", "dishonored", "prey", "stealth", "sim"]): add("immersive_sim", 82, "immersive sim/systemic signal")

    try:
        score = int(game["preservation_score"] or 0)
        manual = int(game["manual_count"] or 0) or bool(game["manual_file_path"] or game["manual_url"])
        media = bool(game["cover_path"] or game["preferred_cover_path"])
        metadata = bool(game["description"] and game["metadata_source"])
        if score >= 85 and manual and media and metadata:
            add("archive_complete", min(100, score), "high preservation score and core assets")
    except Exception:
        pass

    return [{"attribute": a, "confidence": c, "reason": r} for a, (c, r) in sorted(attrs.items())]


def refresh_game_attributes(conn, game_id):
    ensure_collection_tables(conn)
    game = conn.execute("SELECT * FROM games WHERE id=?", (game_id,)).fetchone()
    if not game:
        return []
    attrs = classify_game(game)
    for attr in attrs:
        conn.execute(f"""
            INSERT INTO {GAME_ATTRIBUTE_TABLE} (game_id, attribute, confidence, source, reason, updated_at)
            VALUES (?, ?, ?, 'rules', ?, CURRENT_TIMESTAMP)
            ON CONFLICT(game_id, attribute) DO UPDATE SET
                confidence=excluded.confidence,
                reason=excluded.reason,
                updated_at=CURRENT_TIMESTAMP
        """, (game_id, attr["attribute"], attr["confidence"], attr["reason"]))
    conn.commit()
    return attrs


def refresh_all_attributes():
    conn = get_connection()
    ensure_collection_tables(conn)
    ids = [row[0] for row in conn.execute("SELECT id FROM games").fetchall()]
    for game_id in ids:
        refresh_game_attributes(conn, game_id)
    conn.close()
    return len(ids)


def get_attribute_map(conn):
    ensure_collection_tables(conn)
    rows = conn.execute(f"SELECT game_id, attribute, confidence, reason FROM {GAME_ATTRIBUTE_TABLE}").fetchall()
    data = defaultdict(list)
    for row in rows:
        data[row["game_id"]].append(dict(row))
    return data


def collection_matches(attrs, required):
    present = {a["attribute"] for a in attrs if a.get("confidence", 0) >= 55}
    return all(attr in present for attr in required)


def build_collections(limit=12):
    conn = get_connection()
    ensure_collection_tables(conn)
    games = [dict(row) for row in conn.execute("SELECT * FROM games ORDER BY title COLLATE NOCASE").fetchall()]
    attr_map = get_attribute_map(conn)

    # generate attributes lazily if empty
    if games and not attr_map:
        for game in games:
            refresh_game_attributes(conn, game["id"])
        attr_map = get_attribute_map(conn)

    smart = []
    for definition in SMART_COLLECTION_DEFS:
        matching = [g for g in games if collection_matches(attr_map.get(g["id"], []), definition["attrs"])]
        if matching:
            smart.append({**definition, "count": len(matching), "games": matching[:limit], "label": "Smart Collection"})

    # Category shelves from existing categories stay as user-friendly shelves.
    user = []
    for row in conn.execute("""
        SELECT COALESCE(NULLIF(category, ''), 'Unsorted') AS name, COUNT(*) AS count
        FROM games
        GROUP BY COALESCE(NULLIF(category, ''), 'Unsorted')
        HAVING name != 'Unsorted'
        ORDER BY count DESC, name ASC
    """).fetchall():
        name = row["name"]
        rows = [dict(r) for r in conn.execute("SELECT * FROM games WHERE category=? ORDER BY title COLLATE NOCASE LIMIT ?", (name, limit)).fetchall()]
        user.append({"name": name, "kind": "user", "description": "Manual category from your library.", "count": row["count"], "games": rows, "label": "User Collection"})

    custom_defs = conn.execute(f"SELECT * FROM {CUSTOM_COLLECTION_TABLE} WHERE kind='user' ORDER BY name COLLATE NOCASE").fetchall()
    for cdef in custom_defs:
        rows = [dict(r) for r in conn.execute(f"""
            SELECT g.* FROM games g
            JOIN {GAME_COLLECTION_TABLE} gc ON gc.game_id=g.id
            WHERE gc.collection_id=?
            ORDER BY g.title COLLATE NOCASE
            LIMIT ?
        """, (cdef["id"], limit)).fetchall()]
        user.append({"name": cdef["name"], "kind": "user", "description": cdef["description"] or "Custom collection.", "count": len(rows), "games": rows, "label": "User Collection"})

    milestone = []
    # simple franchise/developer/publisher milestone cards
    for source_field, label in [("developer", "Developer"), ("publisher", "Publisher")]:
        for row in conn.execute(f"""
            SELECT {source_field} AS name, COUNT(*) AS count
            FROM games
            WHERE {source_field} IS NOT NULL AND {source_field} != '' AND {source_field} != 'Unknown'
            GROUP BY {source_field}
            HAVING count >= 3
            ORDER BY count DESC, name ASC
            LIMIT 4
        """).fetchall():
            rows = [dict(r) for r in conn.execute(f"SELECT * FROM games WHERE {source_field}=? ORDER BY title COLLATE NOCASE LIMIT ?", (row["name"], limit)).fetchall()]
            milestone.append({"name": row["name"], "kind": "milestone", "description": f"{label} signal with {row['count']} games.", "count": row["count"], "games": rows, "label": f"{label} Collection"})

    conn.close()
    return {"smart": smart, "user": user, "milestone": milestone}


def collection_game_ids(name, group=""):
    requested = (name or "").strip().casefold()
    requested_group = (group or "").strip().casefold()
    if not requested:
        return []
    groups = build_collections(limit=100000)
    selected_groups = [requested_group] if requested_group in groups else list(groups)
    for group_key in selected_groups:
        shelves = groups[group_key]
        for shelf in shelves:
            if str(shelf.get("name") or "").strip().casefold() == requested:
                return [int(game["id"]) for game in shelf.get("games", []) if game.get("id")]
    return []


def create_custom_collection(name, description=""):
    name = (name or "").strip()
    if not name:
        raise ValueError("Collection name is required.")
    conn = get_connection()
    ensure_collection_tables(conn)
    conn.execute(f"""
        INSERT INTO {CUSTOM_COLLECTION_TABLE} (name, kind, description, updated_at)
        VALUES (?, 'user', ?, CURRENT_TIMESTAMP)
        ON CONFLICT(name) DO UPDATE SET description=excluded.description, updated_at=CURRENT_TIMESTAMP
    """, (name, description or ""))
    conn.commit()
    conn.close()
    return name
