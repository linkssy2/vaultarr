from flask import Blueprint, render_template
from app.database.database import get_connection


discovery_bp = Blueprint('discovery', __name__)


def _rows(conn, sql, params=()):
    return conn.execute(sql, params).fetchall()


def _first(conn, sql, params=()):
    return conn.execute(sql, params).fetchone()


@discovery_bp.route('/discovery')
def discovery():
    conn = get_connection()

    total = _first(conn, 'SELECT COUNT(*) count FROM games')['count']

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

    discovery_score = 0
    if total:
        rich_count = len([g for g in rediscover if g['cover_path'] and (g['description'] or g['metadata_source'])])
        discovery_score = min(100, round((rich_count / min(total, 8)) * 100))

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
    conn = get_connection()
    timeline = _rows(conn, """
        SELECT release_year AS year, COUNT(*) AS count
        FROM games
        WHERE release_year IS NOT NULL AND release_year != '' AND release_year != 'Unknown'
        GROUP BY release_year
        ORDER BY release_year ASC
    """)
    recent = _rows(conn, """
        SELECT * FROM games
        WHERE release_year IS NOT NULL AND release_year != '' AND release_year != 'Unknown'
        ORDER BY CAST(release_year AS INTEGER) DESC, title COLLATE NOCASE ASC
        LIMIT 12
    """)
    conn.close()
    return render_template('timeline.html', timeline=timeline, recent=recent)
