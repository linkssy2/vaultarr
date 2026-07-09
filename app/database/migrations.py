from app.database.database import get_connection


def ensure_column(c, table, column, definition):
    cols = [row[1] for row in c.execute(f"PRAGMA table_info({table})").fetchall()]
    if column not in cols:
        c.execute(f"ALTER TABLE {table} ADD COLUMN {column} {definition}")


def migrate():
    conn = get_connection()
    c = conn.cursor()
    c.execute("CREATE TABLE IF NOT EXISTS schema_version (version INTEGER NOT NULL)")
    row = c.execute("SELECT version FROM schema_version LIMIT 1").fetchone()
    if row is None:
        c.execute("INSERT INTO schema_version (version) VALUES (1)")
    migrate_to_1(c)
    for col, definition in {
        "executables": "TEXT DEFAULT ''",
        "preservation_score": "INTEGER DEFAULT 0",
        "added_at": "TEXT DEFAULT CURRENT_TIMESTAMP",
        "updated_at": "TEXT DEFAULT CURRENT_TIMESTAMP",
        "last_scanned": "TEXT",
        "notes": "TEXT DEFAULT ''",
        "tags": "TEXT DEFAULT ''",
        "description": "TEXT DEFAULT ''",
        "developer": "TEXT DEFAULT ''",
        "publisher": "TEXT DEFAULT ''",
        "release_year": "TEXT DEFAULT ''",
        "genre": "TEXT DEFAULT ''",
        "platform": "TEXT DEFAULT ''",
        "category": "TEXT DEFAULT 'Unsorted'",
        "cover_path": "TEXT DEFAULT ''",
        "cover_url": "TEXT DEFAULT ''",
        "metadata_source": "TEXT DEFAULT ''",
        "metadata_external_id": "TEXT DEFAULT ''",
        "manual_count": "INTEGER DEFAULT 0",
        "manual_url": "TEXT DEFAULT ''",
        "manual_provider": "TEXT DEFAULT ''",
        "manual_checked_at": "TEXT DEFAULT ''",
        "manual_file_path": "TEXT DEFAULT ''",
        "manual_file_name": "TEXT DEFAULT ''",
        "manual_file_size": "INTEGER DEFAULT 0",
        "manual_downloaded_at": "TEXT DEFAULT ''",
        "readme_count": "INTEGER DEFAULT 0",
        "archive_count": "INTEGER DEFAULT 0",
        "installer_count": "INTEGER DEFAULT 0",
        "disc_image_count": "INTEGER DEFAULT 0",
        "patch_count": "INTEGER DEFAULT 0",
        "soundtrack_count": "INTEGER DEFAULT 0",
        "bonus_count": "INTEGER DEFAULT 0",
        "preservation_badge": "TEXT DEFAULT ''",
        "source_type": "TEXT DEFAULT 'Scanned'",
        "manual_entry": "INTEGER DEFAULT 0",
        "metadata_locked": "INTEGER DEFAULT 0",
        "preferred_cover_path": "TEXT DEFAULT ''",
        "preferred_cover_url": "TEXT DEFAULT ''",
        "preferred_cover_provider": "TEXT DEFAULT ''",
        "preferred_cover_type": "TEXT DEFAULT 'box_cover'",
        "preferred_cover_locked": "INTEGER DEFAULT 0",
        "trailer_url": "TEXT DEFAULT ''",
        "trailer_provider": "TEXT DEFAULT ''",
        "trailer_title": "TEXT DEFAULT ''",
        "trailer_embed_url": "TEXT DEFAULT ''",

        "patch_url": "TEXT DEFAULT ''",
        "patch_provider": "TEXT DEFAULT ''",
        "patch_title": "TEXT DEFAULT ''",
        "patch_category": "TEXT DEFAULT ''",
        "patch_notes": "TEXT DEFAULT ''",
        "patch_checked_at": "TEXT DEFAULT ''",
        "trailer_updated_at": "TEXT DEFAULT ''"
    }.items():
        ensure_column(c, "games", col, definition)
    c.execute("""
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

    c.execute("""
    CREATE TABLE IF NOT EXISTS collection_definitions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        kind TEXT DEFAULT 'user',
        description TEXT DEFAULT '',
        rule_json TEXT DEFAULT '',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
    """)
    c.execute("""
    CREATE TABLE IF NOT EXISTS game_collection_attributes (
        game_id INTEGER NOT NULL,
        attribute TEXT NOT NULL,
        confidence INTEGER DEFAULT 0,
        source TEXT DEFAULT 'rules',
        reason TEXT DEFAULT '',
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(game_id, attribute)
    )
    """)
    c.execute("""
    CREATE TABLE IF NOT EXISTS game_collections (
        game_id INTEGER NOT NULL,
        collection_id INTEGER NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(game_id, collection_id)
    )
    """)
    conn.commit()
    conn.close()


def migrate_to_1(c):
    c.execute("""
    CREATE TABLE IF NOT EXISTS libraries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        path TEXT NOT NULL UNIQUE,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
    """)
    c.execute("""
    CREATE TABLE IF NOT EXISTS games (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        library_id INTEGER,
        title TEXT NOT NULL,
        path TEXT NOT NULL UNIQUE,
        size_bytes INTEGER DEFAULT 0,
        file_count INTEGER DEFAULT 0,
        executable_count INTEGER DEFAULT 0,
        executables TEXT DEFAULT '',
        preservation_score INTEGER DEFAULT 0,
        added_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        last_scanned TEXT,
        notes TEXT DEFAULT '',
        tags TEXT DEFAULT '',
        description TEXT DEFAULT '',
        developer TEXT DEFAULT '',
        publisher TEXT DEFAULT '',
        release_year TEXT DEFAULT '',
        genre TEXT DEFAULT '',
        platform TEXT DEFAULT '',
        category TEXT DEFAULT 'Unsorted',
        cover_path TEXT DEFAULT '',
        cover_url TEXT DEFAULT '',
        metadata_source TEXT DEFAULT '',
        metadata_external_id TEXT DEFAULT '',
        manual_count INTEGER DEFAULT 0,
        manual_url TEXT DEFAULT '',
        manual_provider TEXT DEFAULT '',
        manual_checked_at TEXT DEFAULT '',
        manual_file_path TEXT DEFAULT '',
        manual_file_name TEXT DEFAULT '',
        manual_file_size INTEGER DEFAULT 0,
        manual_downloaded_at TEXT DEFAULT '',
        readme_count INTEGER DEFAULT 0,
        archive_count INTEGER DEFAULT 0,
        installer_count INTEGER DEFAULT 0,
        disc_image_count INTEGER DEFAULT 0,
        patch_count INTEGER DEFAULT 0,
        patch_url TEXT DEFAULT '',
        patch_provider TEXT DEFAULT '',
        patch_title TEXT DEFAULT '',
        patch_category TEXT DEFAULT '',
        patch_notes TEXT DEFAULT '',
        patch_checked_at TEXT DEFAULT '',
        soundtrack_count INTEGER DEFAULT 0,
        bonus_count INTEGER DEFAULT 0,
        preservation_badge TEXT DEFAULT '',
        source_type TEXT DEFAULT 'Scanned',
        manual_entry INTEGER DEFAULT 0,
        metadata_locked INTEGER DEFAULT 0,
        trailer_url TEXT DEFAULT '',
        trailer_provider TEXT DEFAULT '',
        trailer_title TEXT DEFAULT '',
        trailer_embed_url TEXT DEFAULT '',
        trailer_updated_at TEXT DEFAULT '',
        FOREIGN KEY(library_id) REFERENCES libraries(id)
    )
    """)
