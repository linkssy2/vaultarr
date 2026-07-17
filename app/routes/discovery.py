from flask import Blueprint, render_template, redirect
from app.database.database import get_connection


discovery_bp = Blueprint('discovery', __name__)


def _rows(conn, sql, params=()):
    return conn.execute(sql, params).fetchall()


def _first(conn, sql, params=()):
    return conn.execute(sql, params).fetchone()


def _has_text(value):
    return bool(str(value or '').strip()) and str(value or '').strip().lower() != 'unknown'


def _discovery_depth(games, media_game_ids):
    """Return museum-wide record completeness across discovery-relevant fields."""
    if not games:
        return 0

    completed = 0
    checks_per_game = 13
    for row in games:
        game = dict(row)
        checks = (
            _has_text(game.get('metadata_source')) or _has_text(game.get('metadata_external_id')),
            _has_text(game.get('description')),
            _has_text(game.get('developer')),
            _has_text(game.get('publisher')),
            _has_text(game.get('release_year')),
            _has_text(game.get('genre')),
            _has_text(game.get('platform')),
            any(_has_text(game.get(field)) for field in ('cover_path', 'cover_url', 'preferred_cover_path', 'preferred_cover_url')),
            _has_text(game.get('trailer_url')) or _has_text(game.get('trailer_embed_url')),
            _has_text(game.get('soundtrack_url')) or _has_text(game.get('soundtrack_embed_url')) or int(game.get('soundtrack_count') or 0) > 0,
            _has_text(game.get('manual_file_path')) or _has_text(game.get('manual_url')) or int(game.get('manual_count') or 0) > 0,
            int(game.get('id') or 0) in media_game_ids,
            int(game.get('file_count') or 0) > 0 or int(game.get('manual_entry') or 0) == 1,
        )
        completed += sum(bool(value) for value in checks)

    return round(completed / (len(games) * checks_per_game) * 100)


@discovery_bp.route('/discovery')
def discovery():
    conn = get_connection()

    total = _first(conn, 'SELECT COUNT(*) count FROM games')['count']
    completion_games = _rows(conn, 'SELECT * FROM games ORDER BY id')
    media_game_ids = {
        int(row['game_id'])
        for row in _rows(conn, """
            SELECT DISTINCT game_id
            FROM media_assets
            WHERE COALESCE(local_path, '') != '' OR COALESCE(remote_url, '') != ''
        """)
    }

    timeline = _rows(conn, """
        SELECT release_year AS year, COUNT(*) AS count
        FROM games
        WHERE release_year IS NOT NULL AND release_year != '' AND release_year != 'Unknown'
        GROUP BY release_year
        ORDER BY release_year ASC
        LIMIT 32
    """)

    developer_clusters = _rows(conn, """
        SELECT developer AS name, COUNT(*) AS count
        FROM games
        WHERE developer IS NOT NULL AND developer != '' AND developer != 'Unknown'
        GROUP BY developer
        ORDER BY count DESC, developer ASC
        LIMIT 8
    """)

    publisher_clusters = _rows(conn, """
        SELECT publisher AS name, COUNT(*) AS count
        FROM games
        WHERE publisher IS NOT NULL AND publisher != '' AND publisher != 'Unknown'
        GROUP BY publisher
        ORDER BY count DESC, publisher ASC
        LIMIT 8
    """)

    genre_clusters = _rows(conn, """
        SELECT genre AS name, COUNT(*) AS count
        FROM games
        WHERE genre IS NOT NULL AND genre != '' AND genre != 'Unknown'
        GROUP BY genre
        ORDER BY count DESC, genre ASC
        LIMIT 8
    """)

    rediscover = _rows(conn, """
        SELECT * FROM games
        ORDER BY
            CASE WHEN COALESCE(cover_path, '') != '' THEN 0 ELSE 1 END,
            COALESCE(updated_at, added_at, last_scanned, '') ASC,
            title ASC
        LIMIT 8
    """)

    needs_identity = _rows(conn, """
        SELECT * FROM games
        WHERE description = '' OR description IS NULL
           OR metadata_source = '' OR metadata_source IS NULL
           OR cover_path = '' OR cover_path IS NULL
        ORDER BY title COLLATE NOCASE ASC
        LIMIT 8
    """)

    biggest = _rows(conn, """
        SELECT * FROM games
        ORDER BY size_bytes DESC
        LIMIT 8
    """)

    top_genre = genre_clusters[0]['name'] if genre_clusters else None
    genre_games = []
    if top_genre:
        genre_games = _rows(conn, """
            SELECT * FROM games
            WHERE genre = ?
            ORDER BY COALESCE(cover_path, '') DESC, title COLLATE NOCASE ASC
            LIMIT 8
        """, (top_genre,))

    top_publisher = publisher_clusters[0]['name'] if publisher_clusters else None
    publisher_games = []
    if top_publisher:
        publisher_games = _rows(conn, """
            SELECT * FROM games
            WHERE publisher = ?
            ORDER BY COALESCE(cover_path, '') DESC, title COLLATE NOCASE ASC
            LIMIT 8
        """, (top_publisher,))

    conn.close()

    discovery_score = _discovery_depth(completion_games, media_game_ids)

    return render_template(
        'discovery.html',
        total=total,
        timeline=timeline,
        developer_clusters=developer_clusters,
        publisher_clusters=publisher_clusters,
        genre_clusters=genre_clusters,
        rediscover=rediscover,
        needs_identity=needs_identity,
        biggest=biggest,
        top_genre=top_genre,
        genre_games=genre_games,
        top_publisher=top_publisher,
        publisher_games=publisher_games,
        discovery_score=discovery_score,
    )


@discovery_bp.route('/timeline')
def timeline_page():
    # Compatibility redirect: Timeline now lives inside Discover.
    return redirect('/discovery#timeline')
