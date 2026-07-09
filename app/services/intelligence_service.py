import re
from collections import Counter, defaultdict
from app.database.database import get_connection

STOPWORDS = {
    'the','a','an','of','and','or','for','to','in','on','with','game','edition','collection','remastered','remaster',
    'hd','ultimate','deluxe','complete','special','goty','gold','classic','classics','pc','windows'
}


def _dict(row):
    return dict(row) if row else None


def _cover_src(game):
    path = (game.get('preferred_cover_path') or game.get('cover_path') or '').strip()
    if path:
        return f'/covers/{path}'
    return ''


def _game_card(row, note=''):
    g = _dict(row)
    if not g:
        return None
    g['cover_src'] = _cover_src(g)
    g['note'] = note
    return g


def _tokens(title):
    parts = re.findall(r"[A-Za-z0-9]+", title.lower())
    return [p for p in parts if p not in STOPWORDS and len(p) > 2]


def _root_title(title):
    title = re.sub(r"\([^)]*\)", " ", title)
    title = re.sub(r"[:\-–—].*$", "", title).strip()
    title = re.sub(r"\b(\d+|i{1,3}|iv|v|vi{0,3}|ix|x)\b$", "", title, flags=re.I).strip()
    words = [w for w in re.findall(r"[A-Za-z0-9]+", title) if w.lower() not in STOPWORDS]
    return ' '.join(words[:3]).strip() or title.strip()


def _quality_score(game, media_count=0):
    checks = [
        bool(game.get('metadata_source')),
        bool(game.get('description')),
        bool(game.get('developer')),
        bool(game.get('publisher')),
        bool(game.get('release_year')),
        bool(game.get('genre')),
        bool(game.get('platform')),
        bool(game.get('cover_path') or game.get('preferred_cover_path')),
        bool(game.get('manual_file_path') or game.get('manual_url') or game.get('manual_count')),
        bool(media_count),
        int(game.get('executable_count') or 0) > 0,
    ]
    return round((sum(checks) / len(checks)) * 100)


def get_vault_intelligence():
    conn = get_connection()
    games = [_dict(r) for r in conn.execute('SELECT * FROM games ORDER BY title COLLATE NOCASE ASC').fetchall()]
    total = len(games)

    media_counts = {r['game_id']: r['count'] for r in conn.execute('SELECT game_id, COUNT(*) AS count FROM media_assets GROUP BY game_id').fetchall()}

    quality_games = []
    for g in games:
        q = _quality_score(g, media_counts.get(g['id'], 0))
        g['intelligence_score'] = q
        g['cover_src'] = _cover_src(g)
        quality_games.append(g)

    average_quality = round(sum(g['intelligence_score'] for g in quality_games) / total) if total else 0

    metadata_ready = sum(1 for g in games if g.get('metadata_source') and g.get('description'))
    media_ready = sum(1 for g in games if media_counts.get(g['id'], 0) > 0)
    manual_ready = sum(1 for g in games if g.get('manual_file_path') or g.get('manual_url') or (g.get('manual_count') or 0) > 0)
    preservation_ready = sum(1 for g in games if (g.get('preservation_score') or 0) >= 80)

    needs_attention = sorted(quality_games, key=lambda g: (g['intelligence_score'], g['title']))[:8]
    archive_ready = sorted([g for g in quality_games if g['intelligence_score'] >= 80], key=lambda g: (-g['intelligence_score'], g['title']))[:8]

    # relationship clusters
    clusters = []
    for field, label in [('developer','Developer'), ('publisher','Publisher'), ('genre','Genre'), ('platform','Platform')]:
        rows = conn.execute(f"""
            SELECT {field} AS name, COUNT(*) AS count
            FROM games
            WHERE {field} IS NOT NULL AND {field} != '' AND {field} != 'Unknown'
            GROUP BY {field}
            HAVING COUNT(*) > 1
            ORDER BY count DESC, name ASC
            LIMIT 6
        """).fetchall()
        for r in rows:
            clusters.append({'type': label, 'name': r['name'], 'count': r['count'], 'url': f'/library?q={r["name"]}'})
    clusters = sorted(clusters, key=lambda x: (-x['count'], x['type'], x['name']))[:10]

    # franchise-like groups based on title root
    roots = defaultdict(list)
    for g in games:
        root = _root_title(g['title'])
        if len(root) >= 4:
            roots[root.lower()].append(g)
    franchise_groups = []
    for key, items in roots.items():
        if len(items) > 1:
            name = _root_title(items[0]['title'])
            years = sorted([str(i.get('release_year') or '') for i in items if i.get('release_year')])
            franchise_groups.append({
                'name': name,
                'count': len(items),
                'years': ', '.join(years[:4]) + ('…' if len(years) > 4 else ''),
                'url': f'/library?q={name}'
            })
    franchise_groups = sorted(franchise_groups, key=lambda x: (-x['count'], x['name']))[:8]

    # Because you own: choose a rich game and find similar records
    seed = None
    for g in sorted(quality_games, key=lambda x: (-x['intelligence_score'], x['title'])):
        if g.get('genre') or g.get('developer') or g.get('publisher'):
            seed = g
            break
    similar = []
    if seed:
        params = []
        clauses = []
        for field in ['genre','developer','publisher']:
            value = (seed.get(field) or '').strip()
            if value:
                clauses.append(f'{field} = ?')
                params.append(value)
        if clauses:
            rows = conn.execute(f"""
                SELECT * FROM games
                WHERE id != ? AND ({' OR '.join(clauses)})
                ORDER BY COALESCE(preferred_cover_path, cover_path, '') DESC, title COLLATE NOCASE ASC
                LIMIT 8
            """, (seed['id'], *params)).fetchall()
            similar = [_game_card(r, f"Shares {seed.get('genre') or seed.get('developer') or seed.get('publisher')}") for r in rows]

    # timeline rows for exploration
    timeline = conn.execute("""
        SELECT release_year AS year, COUNT(*) AS count
        FROM games
        WHERE release_year IS NOT NULL AND release_year != '' AND release_year != 'Unknown'
        GROUP BY release_year
        ORDER BY release_year ASC
        LIMIT 42
    """).fetchall()

    year_peaks = []
    if timeline:
        max_count = max(r['count'] for r in timeline) or 1
        for r in timeline:
            year_peaks.append({'year': r['year'], 'count': r['count'], 'height': max(8, round((r['count'] / max_count) * 100)), 'url': f'/library?q={r["year"]}'})

    # intelligent recommendations
    recommendations = []
    if needs_attention:
        g = needs_attention[0]
        missing = []
        if not g.get('metadata_source') or not g.get('description'): missing.append('metadata')
        if not g.get('cover_path') and not g.get('preferred_cover_path'): missing.append('cover')
        if not media_counts.get(g['id'], 0): missing.append('gallery')
        if not (g.get('manual_file_path') or g.get('manual_url') or (g.get('manual_count') or 0)): missing.append('manual')
        recommendations.append({
            'title': f'Build best record for {g["title"]}',
            'body': 'Missing ' + ', '.join(missing[:3]) if missing else 'Record can be improved.',
            'url': f'/library?open={g["id"]}',
            'tone': 'improve'
        })
    if franchise_groups:
        f = franchise_groups[0]
        recommendations.append({'title': f'Review the {f["name"]} shelf', 'body': f'{f["count"]} related games found.', 'url': f['url'], 'tone': 'franchise'})
    if clusters:
        c = clusters[0]
        recommendations.append({'title': f'Explore {c["name"]}', 'body': f'{c["count"]} games share this {c["type"].lower()}.', 'url': c['url'], 'tone': 'cluster'})

    conn.close()

    def pct(x):
        return round((x / total) * 100) if total else 0

    return {
        'total': total,
        'average_quality': average_quality,
        'metadata_ready': metadata_ready,
        'media_ready': media_ready,
        'manual_ready': manual_ready,
        'preservation_ready': preservation_ready,
        'metadata_pct': pct(metadata_ready),
        'media_pct': pct(media_ready),
        'manual_pct': pct(manual_ready),
        'preservation_pct': pct(preservation_ready),
        'needs_attention': needs_attention,
        'archive_ready': archive_ready,
        'clusters': clusters,
        'franchise_groups': franchise_groups,
        'seed': seed,
        'similar': similar,
        'timeline': year_peaks,
        'recommendations': recommendations,
    }
