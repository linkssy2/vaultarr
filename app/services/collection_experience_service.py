from app.database.database import get_connection


def _count(conn, sql, params=()):
    row = conn.execute(sql, params).fetchone()
    return row[0] if row else 0


def _rows(conn, sql, params=()):
    return [dict(row) for row in conn.execute(sql, params).fetchall()]


def _percent(value, target):
    if target <= 0:
        return 100
    return max(0, min(100, round((value / target) * 100)))


def _badge(key, title, description, icon, value, target, tier='bronze', url='/library'):
    pct = _percent(value, target)
    return {
        'key': key,
        'title': title,
        'description': description,
        'icon': icon,
        'value': value,
        'target': target,
        'progress': pct,
        'earned': value >= target,
        'tier': tier,
        'url': url,
    }


def get_collection_experience():
    conn = get_connection()

    total_games = _count(conn, 'SELECT COUNT(*) FROM games')
    complete_games = _count(conn, """
        SELECT COUNT(*) FROM games
        WHERE preservation_score >= 90
           OR LOWER(COALESCE(preservation_badge, '')) IN ('complete', 'archive ready')
    """)
    metadata_games = _count(conn, """
        SELECT COUNT(*) FROM games
        WHERE COALESCE(metadata_source, '') != ''
          AND COALESCE(description, '') != ''
    """)
    cover_games = _count(conn, """
        SELECT COUNT(*) FROM games
        WHERE COALESCE(cover_path, '') != '' OR COALESCE(preferred_cover_path, '') != ''
    """)
    manual_games = _count(conn, """
        SELECT COUNT(*) FROM games
        WHERE manual_count > 0 OR COALESCE(manual_file_path, '') != '' OR COALESCE(manual_url, '') != ''
    """)
    gallery_games = _count(conn, """
        SELECT COUNT(DISTINCT game_id) FROM media_assets
        WHERE COALESCE(local_path, '') != '' OR COALESCE(remote_url, '') != ''
    """)
    cached_media = _count(conn, "SELECT COUNT(*) FROM media_assets WHERE COALESCE(local_path, '') != ''")
    libraries = _count(conn, 'SELECT COUNT(*) FROM libraries')
    launchbox_games = _count(conn, "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='launchbox_games'")
    if launchbox_games:
        launchbox_games = _count(conn, 'SELECT COUNT(*) FROM launchbox_games')

    badges = [
        _badge('first_scan', 'Vault Opened', 'Catalog your first game.', '◆', total_games, 1, 'bronze', '/library'),
        _badge('collector_25', 'Shelf Builder', 'Catalog 25 games.', '▦', total_games, 25, 'bronze', '/library'),
        _badge('collector_100', 'Museum Wing', 'Catalog 100 games.', '▦', total_games, 100, 'silver', '/library'),
        _badge('collector_500', 'Vault Curator', 'Catalog 500 games.', '▦', total_games, 500, 'gold', '/library'),
        _badge('first_preserved', 'First Preservation', 'Complete your first preservation-ready game.', '🛡', complete_games, 1, 'bronze', '/preservation'),
        _badge('archive_apprentice', 'Archive Apprentice', 'Preserve 10 games.', '🛡', complete_games, 10, 'bronze', '/preservation'),
        _badge('museum_curator', 'Museum Curator', 'Preserve 100 games.', '🛡', complete_games, 100, 'gold', '/preservation'),
        _badge('manual_hunter', 'Manual Hunter', 'Attach or download 25 manuals.', '📖', manual_games, 25, 'silver', '/preservation'),
        _badge('media_archivist', 'Media Archivist', 'Cache 100 gallery assets.', '✦', cached_media, 100, 'silver', '/discovery'),
        _badge('identity_engineer', 'Identity Engineer', 'Apply metadata to 50 games.', '◇', metadata_games, 50, 'silver', '/metadata-queue'),
        _badge('cover_collector', 'Cover Collector', 'Give 50 games cover art.', '▣', cover_games, 50, 'silver', '/library'),
        _badge('launchbox_sync', 'LaunchBox Linked', 'Sync at least 1,000 LaunchBox records.', 'L', launchbox_games, 1000, 'gold', '/settings'),
    ]

    earned = [b for b in badges if b['earned']]
    next_badges = sorted([b for b in badges if not b['earned']], key=lambda b: (-b['progress'], b['target']))[:4]

    top_collections = _rows(conn, """
        SELECT COALESCE(NULLIF(category, ''), 'Unsorted') AS name,
               COUNT(*) AS count,
               SUM(CASE WHEN preservation_score >= 90 OR LOWER(COALESCE(preservation_badge, '')) IN ('complete', 'archive ready') THEN 1 ELSE 0 END) AS complete_count
        FROM games
        GROUP BY COALESCE(NULLIF(category, ''), 'Unsorted')
        ORDER BY count DESC, name ASC
        LIMIT 8
    """)
    for row in top_collections:
        row['progress'] = _percent(row.get('complete_count') or 0, row.get('count') or 0)
        row['earned'] = row['count'] > 0 and row['progress'] >= 90
        row['badge_title'] = f"{row['name']} Curator"

    franchise_signals = _rows(conn, """
        SELECT publisher AS name, COUNT(*) AS count,
               SUM(CASE WHEN preservation_score >= 90 OR LOWER(COALESCE(preservation_badge, '')) IN ('complete', 'archive ready') THEN 1 ELSE 0 END) AS complete_count
        FROM games
        WHERE publisher IS NOT NULL AND publisher != '' AND publisher != 'Unknown'
        GROUP BY publisher
        HAVING count >= 3
        ORDER BY count DESC, complete_count DESC
        LIMIT 8
    """)
    for row in franchise_signals:
        row['progress'] = _percent(row.get('complete_count') or 0, row.get('count') or 0)

    timeline_badges = _rows(conn, """
        SELECT substr(release_year, 1, 3) || '0s' AS decade,
               COUNT(*) AS count,
               SUM(CASE WHEN preservation_score >= 90 OR LOWER(COALESCE(preservation_badge, '')) IN ('complete', 'archive ready') THEN 1 ELSE 0 END) AS complete_count
        FROM games
        WHERE release_year IS NOT NULL AND release_year != '' AND length(release_year) >= 4
        GROUP BY substr(release_year, 1, 3)
        ORDER BY decade DESC
        LIMIT 8
    """)
    for row in timeline_badges:
        row['progress'] = _percent(row.get('complete_count') or 0, row.get('count') or 0)

    recent_candidates = _rows(conn, """
        SELECT id, title, cover_path, preferred_cover_path, updated_at, preservation_badge, preservation_score
        FROM games
        ORDER BY COALESCE(updated_at, added_at, last_scanned, '') DESC
        LIMIT 8
    """)

    vault_score = round((
        _percent(metadata_games, total_games or 1) * 0.22 +
        _percent(cover_games, total_games or 1) * 0.18 +
        _percent(manual_games, total_games or 1) * 0.20 +
        _percent(gallery_games, total_games or 1) * 0.15 +
        _percent(complete_games, total_games or 1) * 0.25
    )) if total_games else 0

    conn.close()

    return {
        'total_games': total_games,
        'complete_games': complete_games,
        'metadata_games': metadata_games,
        'cover_games': cover_games,
        'manual_games': manual_games,
        'gallery_games': gallery_games,
        'cached_media': cached_media,
        'libraries': libraries,
        'launchbox_games': launchbox_games,
        'badges': badges,
        'earned_badges': earned,
        'next_badges': next_badges,
        'top_collections': top_collections,
        'franchise_signals': franchise_signals,
        'timeline_badges': timeline_badges,
        'recent_candidates': recent_candidates,
        'vault_score': vault_score,
    }
