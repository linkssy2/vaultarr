from app.database.database import get_connection


def _count(conn, sql, params=()):
    row = conn.execute(sql, params).fetchone()
    return row[0] if row else 0


def _percent(value, target):
    if target <= 0:
        return 100
    return max(0, min(100, round((value / target) * 100)))


def _badge(key, title, description, icon, value, target, tier='bronze', url='/library', accent='blue'):
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
        'accent': accent,
    }


def get_collection_experience():
    conn = get_connection()

    game_summary = conn.execute("""
        SELECT
            COUNT(*) AS total_games,
            COALESCE(SUM(CASE
                WHEN preservation_score >= 90
                  OR LOWER(COALESCE(preservation_badge, '')) IN ('complete', 'archive ready')
                THEN 1 ELSE 0 END), 0) AS complete_games,
            COALESCE(SUM(CASE
                WHEN COALESCE(metadata_source, '') != '' AND COALESCE(description, '') != ''
                THEN 1 ELSE 0 END), 0) AS metadata_games,
            COALESCE(SUM(CASE
                WHEN COALESCE(cover_path, '') != '' OR COALESCE(preferred_cover_path, '') != ''
                THEN 1 ELSE 0 END), 0) AS cover_games,
            COALESCE(SUM(CASE
                WHEN manual_count > 0
                  OR COALESCE(manual_file_path, '') != ''
                  OR COALESCE(manual_url, '') != ''
                THEN 1 ELSE 0 END), 0) AS manual_games
        FROM games
    """).fetchone()
    media_summary = conn.execute("""
        SELECT
            COUNT(DISTINCT CASE
                WHEN COALESCE(local_path, '') != '' OR COALESCE(remote_url, '') != ''
                THEN game_id END) AS gallery_games,
            COALESCE(SUM(CASE WHEN COALESCE(local_path, '') != '' THEN 1 ELSE 0 END), 0) AS cached_media
        FROM media_assets
    """).fetchone()

    total_games = game_summary['total_games']
    complete_games = game_summary['complete_games']
    metadata_games = game_summary['metadata_games']
    cover_games = game_summary['cover_games']
    manual_games = game_summary['manual_games']
    gallery_games = media_summary['gallery_games']
    cached_media = media_summary['cached_media']
    soundtrack_tracks = _count(conn, 'SELECT COALESCE(SUM(soundtrack_count), 0) FROM games')
    soundtrack_games = _count(conn, "SELECT COUNT(*) FROM games WHERE soundtrack_count > 0 OR COALESCE(soundtrack_url, '') != ''")
    trailer_games = _count(conn, "SELECT COUNT(*) FROM games WHERE COALESCE(trailer_url, '') != '' OR COALESCE(trailer_embed_url, '') != ''")
    acquired_games = _count(conn, "SELECT COUNT(*) FROM game_acquisitions WHERE COALESCE(local_path, '') != '' OR LOWER(COALESCE(status, '')) = 'acquired'")
    emulator_games = _count(conn, 'SELECT COUNT(*) FROM game_play_activity WHERE play_count > 0')
    emulator_launches = _count(conn, 'SELECT COALESCE(SUM(play_count), 0) FROM game_play_activity')
    collection_count = _count(conn, "SELECT COUNT(DISTINCT category) FROM games WHERE COALESCE(category, '') NOT IN ('', 'Unsorted')")
    libraries = _count(conn, 'SELECT COUNT(*) FROM libraries')
    launchbox_games = _count(conn, "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='launchbox_games'")
    if launchbox_games:
        launchbox_games = _count(conn, 'SELECT COUNT(*) FROM launchbox_games')

    badges = [
        _badge('first_scan', 'Vault Opened', 'Catalog your first game.', '\u25c6', total_games, 1, 'bronze', '/museum', 'cyan'),
        _badge('collector_25', 'Shelf Builder', 'Catalog 25 games.', '\u25a6', total_games, 25, 'bronze', '/museum', 'blue'),
        _badge('collector_100', 'Museum Wing', 'Catalog 100 games.', '\u25a6', total_games, 100, 'silver', '/museum', 'blue'),
        _badge('collector_500', 'Vault Curator', 'Catalog 500 games.', '\u25a6', total_games, 500, 'gold', '/museum', 'blue'),
        _badge('collection_architect', 'Collection Architect', 'Build three distinct museum collections.', '\u25a9', collection_count, 3, 'bronze', '/collections', 'violet'),
        _badge('first_preserved', 'First Preservation', 'Complete your first preservation-ready game.', '\u25c7', complete_games, 1, 'bronze', '/museum?attention=1', 'emerald'),
        _badge('archive_apprentice', 'Archive Apprentice', 'Preserve 10 games.', '\u25c7', complete_games, 10, 'bronze', '/museum?attention=1', 'emerald'),
        _badge('museum_curator', 'Museum Curator', 'Preserve 100 games.', '\u25c7', complete_games, 100, 'gold', '/museum?attention=1', 'emerald'),
        _badge('manual_hunter', 'Manual Hunter', 'Attach or download 25 manuals.', '\u25a4', manual_games, 25, 'silver', '/museum?attention=1', 'amber'),
        _badge('visual_exhibit', 'Visual Exhibit', 'Add gallery media to 10 games.', '\u25a7', gallery_games, 10, 'bronze', '/discovery', 'rose'),
        _badge('media_archivist', 'Media Archivist', 'Cache 100 gallery assets.', '\u2726', cached_media, 100, 'silver', '/discovery', 'rose'),
        _badge('projectionist', 'Projectionist', 'Save trailers for 10 games.', '\u25b7', trailer_games, 10, 'silver', '/museum', 'orange'),
        _badge('first_pressing', 'First Pressing', 'Preserve your first owned soundtrack track.', '\u266b', soundtrack_tracks, 1, 'bronze', '/museum', 'magenta'),
        _badge('audio_conservator', 'Audio Conservator', 'Preserve 50 owned soundtrack tracks.', '\u266c', soundtrack_tracks, 50, 'gold', '/museum', 'magenta'),
        _badge('soundtrack_shelf', 'Soundtrack Shelf', 'Build local soundtrack libraries for 10 games.', '\u266b', soundtrack_games, 10, 'silver', '/museum', 'magenta'),
        _badge('exhibit_in_motion', 'Exhibit in Motion', 'Launch a game through the Vaultarr player.', '\u25b6', emulator_games, 1, 'bronze', '/museum', 'violet'),
        _badge('after_hours', 'After Hours', 'Launch 25 Vaultarr player sessions.', '\u2318', emulator_launches, 25, 'silver', '/museum', 'violet'),
        _badge('local_copy', 'Local Copy Secured', 'Attach or acquire an authorized local game copy.', '\u2b21', acquired_games, 1, 'bronze', '/museum', 'teal'),
        _badge('identity_engineer', 'Identity Engineer', 'Apply metadata to 50 games.', '\u25c8', metadata_games, 50, 'silver', '/museum?attention=1', 'cyan'),
        _badge('cover_collector', 'Cover Collector', 'Give 50 games cover art.', '\u25a3', cover_games, 50, 'silver', '/museum', 'cyan'),
        _badge('launchbox_sync', 'LaunchBox Linked', 'Sync at least 1,000 LaunchBox records.', 'L', launchbox_games, 1000, 'gold', '/settings', 'amber'),
    ]

    earned = [b for b in badges if b['earned']]
    next_badges = sorted([b for b in badges if not b['earned']], key=lambda b: (-b['progress'], b['target']))[:4]

    badge_lookup = {badge['key']: badge for badge in badges}
    path_definitions = [
        {
            'title': 'Catalog & organize',
            'description': 'Grow the museum and shape it into clear collections.',
            'icon': '\u25a6',
            'accent': 'blue',
            'url': '/museum',
            'keys': ('first_scan', 'collector_25', 'collector_100', 'collector_500', 'collection_architect'),
        },
        {
            'title': 'Preserve & document',
            'description': 'Secure playable copies, manuals, and preservation-ready records.',
            'icon': '\u25c7',
            'accent': 'emerald',
            'url': '/museum?attention=1',
            'keys': ('first_preserved', 'archive_apprentice', 'museum_curator', 'manual_hunter', 'local_copy'),
        },
        {
            'title': 'Build visual exhibits',
            'description': 'Complete each exhibit with artwork, galleries, and trailers.',
            'icon': '\u2726',
            'accent': 'rose',
            'url': '/discovery',
            'keys': ('cover_collector', 'visual_exhibit', 'media_archivist', 'projectionist'),
        },
        {
            'title': 'Archive soundtracks',
            'description': 'Preserve owned music and build playable soundtrack shelves.',
            'icon': '\u266b',
            'accent': 'magenta',
            'url': '/museum',
            'keys': ('first_pressing', 'audio_conservator', 'soundtrack_shelf'),
        },
        {
            'title': 'Play from the archive',
            'description': 'Use Vaultarr\u2019s player to revisit preserved titles.',
            'icon': '\u25b6',
            'accent': 'violet',
            'url': '/museum',
            'keys': ('exhibit_in_motion', 'after_hours'),
        },
        {
            'title': 'Enrich & connect',
            'description': 'Strengthen records with metadata and connected sources.',
            'icon': '\u25c8',
            'accent': 'cyan',
            'url': '/settings',
            'keys': ('identity_engineer', 'launchbox_sync'),
        },
    ]
    achievement_paths = []
    for path in path_definitions:
        path_badges = [badge_lookup[key] for key in path['keys']]
        achievement_paths.append({
            **{key: value for key, value in path.items() if key != 'keys'},
            'earned': sum(1 for badge in path_badges if badge['earned']),
            'total': len(path_badges),
            'progress': round(sum(badge['progress'] for badge in path_badges) / len(path_badges)),
        })

    # Overall Milestone Progress uses every badge target as part of the goal.
    # Completed badges contribute 100%, while in-progress badges contribute
    # proportionally up to their target.
    milestone_current = sum(min(max(int(b.get('value') or 0), 0), max(int(b.get('target') or 0), 0)) for b in badges)
    milestone_total = sum(max(int(b.get('target') or 0), 0) for b in badges)
    milestone_progress = round((milestone_current / milestone_total) * 100) if milestone_total else 0

    conn.close()

    return {
        'total_games': total_games,
        'complete_games': complete_games,
        'metadata_games': metadata_games,
        'cover_games': cover_games,
        'manual_games': manual_games,
        'gallery_games': gallery_games,
        'cached_media': cached_media,
        'soundtrack_tracks': soundtrack_tracks,
        'soundtrack_games': soundtrack_games,
        'trailer_games': trailer_games,
        'acquired_games': acquired_games,
        'emulator_games': emulator_games,
        'emulator_launches': emulator_launches,
        'collection_count': collection_count,
        'libraries': libraries,
        'launchbox_games': launchbox_games,
        'badges': badges,
        'earned_badges': earned,
        'next_badges': next_badges,
        'achievement_paths': achievement_paths,
        'milestone_progress': milestone_progress,
    }
