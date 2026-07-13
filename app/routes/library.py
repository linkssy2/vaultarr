from urllib.parse import urlencode
from uuid import uuid4

from flask import Blueprint, render_template, abort, request, redirect, jsonify
from app.database.database import get_connection
from app.services.metadata_service import search_metadata_diagnostics, get_steam_details, get_wikipedia_details, get_rawg_details, get_igdb_details, get_steamgriddb_details, download_cover
from app.services.game_removal_service import remove_game
from app.services.provider_intelligence import get_provider_details
from app.services.curator_service import queue_game
from app.services.acquisition_assistant_service import get_game_acquisition
from app.services.preservation_engine import enrich_preservation

library_bp = Blueprint('library', __name__)

SEARCH_FIELDS = ['title','path','developer','publisher','genre','description','tags','category','notes','executables','platform','release_year','source_type']


def _category_counts(conn):
    cats = conn.execute("SELECT category, COUNT(*) count FROM games GROUP BY category").fetchall()
    return cats, {row['category'] or 'Unsorted': row['count'] for row in cats}


@library_bp.route('/library')
@library_bp.route('/museum')
def library():
    q = request.args.get('q','').strip()
    sort = request.args.get('sort','title')
    category = request.args.get('category','All Games')
    attention = request.args.get('attention','').strip().lower() in ('1','true','yes','on')
    where=[]; params=[]
    if q:
        like=f'%{q}%'
        where.append('(' + ' OR '.join([f'{field} LIKE ?' for field in SEARCH_FIELDS]) + ')')
        params += [like] * len(SEARCH_FIELDS)
    if category and category != 'All Games':
        where.append('category = ?'); params.append(category)
    if attention:
        where.append("(COALESCE(preservation_score, 0) < 80 OR COALESCE(preservation_badge, '') NOT IN ('Archive Ready', 'Complete'))")
    order = 'title COLLATE NOCASE ASC'
    if sort == 'size': order = 'size_bytes DESC'
    if sort == 'scanned': order = 'last_scanned DESC'
    if sort == 'added': order = 'added_at DESC'
    sql='SELECT * FROM games'
    if where: sql += ' WHERE ' + ' AND '.join(where)
    sql += f' ORDER BY {order}'
    conn=get_connection(); games=conn.execute(sql, params).fetchall()
    cats, category_counts = _category_counts(conn)
    total_count=conn.execute("SELECT COUNT(*) count FROM games").fetchone()['count']
    attention_count=conn.execute("SELECT COUNT(*) count FROM games WHERE COALESCE(preservation_score, 0) < 80 OR COALESCE(preservation_badge, '') NOT IN ('Archive Ready', 'Complete')").fetchone()['count']
    conn.close()
    return render_template('library.html', games=games, q=q, sort=sort, active_category=category, category=category, categories=cats, category_counts=category_counts, total_count=total_count, attention=attention, attention_count=attention_count)


@library_bp.route('/games/add', methods=['GET','POST'])
def add_game():
    if request.method == 'POST':
        title = request.form.get('title','').strip()
        path = request.form.get('path','').strip()
        category = request.form.get('category','Manual').strip() or 'Manual'
        source_type = request.form.get('source_type','Manual').strip() or 'Manual'
        description = request.form.get('description','').strip()
        developer = request.form.get('developer','').strip()
        publisher = request.form.get('publisher','').strip()
        release_year = request.form.get('release_year','').strip()
        genre = request.form.get('genre','').strip()
        platform = request.form.get('platform','').strip()
        tags = request.form.get('tags','').strip()
        notes = request.form.get('notes','').strip()
        metadata_locked = 1 if request.form.get('metadata_locked') == 'on' else 0

        if not title and path:
            title = path.rstrip('\\/').split('\\')[-1].split('/')[-1]
        if not title:
            title = 'Untitled Manual Game'
        if not path:
            path = f'manual://{title.lower().replace(" ", "-")}-{uuid4().hex[:10]}'

        conn = get_connection()
        try:
            conn.execute('''
                INSERT INTO games (
                    library_id,title,path,category,source_type,manual_entry,metadata_locked,
                    description,developer,publisher,release_year,genre,platform,tags,notes,
                    added_at,updated_at
                ) VALUES (NULL,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
            ''', (
                title, path, category, source_type, 1, metadata_locked,
                description, developer, publisher, release_year, genre, platform, tags, notes
            ))
            conn.commit()
            game_id = conn.execute('SELECT last_insert_rowid() id').fetchone()['id']
        except Exception:
            existing = conn.execute('SELECT id FROM games WHERE path=?', (path,)).fetchone()
            conn.close()
            if existing:
                return redirect(f'/games/{existing["id"]}')
            raise
        conn.close()
        return redirect(f'/games/{game_id}')

    return render_template('manual_add.html')


@library_bp.route('/games/<int:game_id>')
def game_detail(game_id):
    conn=get_connection(); game=conn.execute('SELECT * FROM games WHERE id=?',(game_id,)).fetchone(); conn.close()
    if game is None: abort(404)
    game = enrich_preservation(dict(game))
    results=[]; logs=[]; query=request.args.get('metadata_query','').strip(); provider=request.args.get('provider','all')
    if query:
        search_data=search_metadata_diagnostics(query, provider)
        results=search_data.get('results', [])
        logs=search_data.get('logs', [])
    return render_template('game_detail.html', game=game, metadata_results=results, metadata_logs=logs, metadata_query=query, provider=provider, game_acquisition=get_game_acquisition(game_id))


@library_bp.route('/games/<int:game_id>/metadata/search', methods=['POST'])
def metadata_search(game_id):
    query=request.form.get('query','').strip(); provider=request.form.get('provider','all')
    if not query:
        conn=get_connection(); game=conn.execute('SELECT title FROM games WHERE id=?',(game_id,)).fetchone(); conn.close()
        if game: query=game['title']
    return redirect('/games/{}?{}'.format(game_id, urlencode({'metadata_query': query, 'provider': provider})))


@library_bp.route('/games/<int:game_id>/metadata/apply', methods=['POST'])
def metadata_apply(game_id):
    source=request.form.get('source',''); external_id=request.form.get('external_id','')
    details=None
    if source == 'Steam' and external_id: details=get_steam_details(external_id)
    elif source == 'Wikipedia' and external_id: details=get_wikipedia_details(external_id)
    elif source == 'RAWG' and external_id: details=get_rawg_details(external_id)
    elif source == 'IGDB' and external_id: details=get_igdb_details(external_id)
    elif source == 'SteamGridDB' and external_id: details=get_steamgriddb_details(external_id)
    if not details: return redirect(f'/games/{game_id}')
    try: cover_path=download_cover(game_id, details.get('cover_url',''))
    except Exception: cover_path=''
    conn=get_connection(); conn.execute('''UPDATE games SET title=CASE WHEN ? != '' THEN ? ELSE title END,description=CASE WHEN ? != '' THEN ? ELSE description END,developer=CASE WHEN ? != '' THEN ? ELSE developer END,publisher=CASE WHEN ? != '' THEN ? ELSE publisher END,release_year=CASE WHEN ? != '' THEN ? ELSE release_year END,genre=CASE WHEN ? != '' THEN ? ELSE genre END,platform=CASE WHEN ? != '' THEN ? ELSE platform END,cover_url=CASE WHEN ? != '' THEN ? ELSE cover_url END,cover_path=CASE WHEN ? != '' THEN ? ELSE cover_path END,metadata_source=CASE WHEN ? != '' THEN ? ELSE metadata_source END,metadata_external_id=CASE WHEN ? != '' THEN ? ELSE metadata_external_id END,category=CASE WHEN category='' OR category='Unsorted' THEN ? ELSE category END,updated_at=CURRENT_TIMESTAMP WHERE id=?''', (details.get('title',''),details.get('title',''),details.get('description',''),details.get('description',''),details.get('developer',''),details.get('developer',''),details.get('publisher',''),details.get('publisher',''),details.get('release_year',''),details.get('release_year',''),details.get('genre',''),details.get('genre',''),details.get('platform',''),details.get('platform',''),details.get('cover_url',''),details.get('cover_url',''),cover_path,cover_path,details.get('metadata_source',''),details.get('metadata_source',''),details.get('metadata_external_id',''),details.get('metadata_external_id',''), source if source in ('Steam','RAWG','IGDB') else 'Unsorted', game_id)); conn.commit(); conn.close()
    return redirect(f'/games/{game_id}')


@library_bp.route('/games/<int:game_id>/manual', methods=['POST'])
def manual_update(game_id):
    fields=['title','description','developer','publisher','release_year','genre','platform','category','tags','notes']
    values=[request.form.get(f,'').strip() for f in fields]
    metadata_locked = 1 if request.form.get('metadata_locked') == 'on' else 0
    conn=get_connection(); conn.execute('''UPDATE games SET title=?,description=?,developer=?,publisher=?,release_year=?,genre=?,platform=?,category=?,tags=?,notes=?,metadata_locked=?,updated_at=CURRENT_TIMESTAMP WHERE id=?''', (*values, metadata_locked, game_id)); conn.commit(); conn.close()
    return redirect(f'/games/{game_id}')


@library_bp.route('/games/<int:game_id>/delete', methods=['POST'])
def delete_game(game_id):
    ignore_path = request.form.get('ignore_path') == 'on'
    delete_cached_assets = request.form.get('delete_cached_assets') == 'on'
    result = remove_game(game_id, ignore_path=ignore_path, delete_cached_assets=delete_cached_assets)
    if not result.get('removed'):
        abort(404)
    return redirect('/library?removed=1')

@library_bp.route('/api/games/<int:game_id>/card')
def game_card_api(game_id):
    conn = get_connection()
    game = conn.execute('SELECT * FROM games WHERE id=?', (game_id,)).fetchone()
    if game is None:
        conn.close()
        return jsonify({'success': False, 'message': 'Game not found.'}), 404
    _, category_counts = _category_counts(conn)
    total_count = conn.execute('SELECT COUNT(*) count FROM games').fetchone()['count']
    conn.close()
    return jsonify({
        'success': True,
        'game_id': game_id,
        'title': game['title'],
        'category': game['category'] or 'Unsorted',
        'html': render_template('_game_card.html', game=game, newly_added=True),
        'category_counts': category_counts,
        'total_count': total_count,
        'redirect': f'/games/{game_id}',
    })


@library_bp.route('/api/games/add/search')
def add_game_search_api():
    query = request.args.get('query', '').strip()
    provider = request.args.get('provider', 'all').strip() or 'all'
    platform = request.args.get('platform', '').strip().lower()
    if not query:
        return jsonify({'success': True, 'results': [], 'logs': []})

    data = search_metadata_diagnostics(query, provider)
    results = data.get('results', [])
    if platform:
        for item in results:
            haystack = f"{item.get('platform','')} {item.get('description','')}".lower()
            item['platform_match'] = platform in haystack
        results.sort(key=lambda item: (bool(item.get('platform_match')), int(item.get('confidence') or 0)), reverse=True)

    return jsonify({'success': True, 'results': results, 'logs': data.get('logs', [])})


@library_bp.route('/api/games/add/preview')
def add_game_preview_api():
    source = request.args.get('source', '').strip()
    external_id = request.args.get('external_id', '').strip()
    if not source or not external_id:
        return jsonify({'success': False, 'message': 'A source and game ID are required.'}), 400
    try:
        details = get_provider_details(source, external_id)
    except Exception as exc:
        return jsonify({'success': False, 'message': str(exc)}), 502
    if not details:
        return jsonify({'success': False, 'message': 'The selected information source did not return game details.'}), 404
    return jsonify({'success': True, 'details': details})


@library_bp.route('/api/games/add/from-provider', methods=['POST'])
def add_game_from_provider_api():
    payload = request.get_json(silent=True) or {}
    source = str(payload.get('source') or '').strip()
    external_id = str(payload.get('external_id') or '').strip()
    path = str(payload.get('path') or '').strip()
    source_type = str(payload.get('source_type') or 'Imported').strip() or 'Imported'
    category = str(payload.get('category') or 'Unsorted').strip() or 'Unsorted'

    if not source or not external_id:
        return jsonify({'success': False, 'message': 'Select a game before adding it.'}), 400
    try:
        details = get_provider_details(source, external_id)
    except Exception as exc:
        return jsonify({'success': False, 'message': str(exc)}), 502
    if not details:
        return jsonify({'success': False, 'message': 'The selected game could not be loaded from its information source.'}), 404

    title = str(details.get('title') or 'Untitled Game').strip()
    if not path:
        path = f"manual://{title.lower().replace(' ', '-')}-{uuid4().hex[:10]}"

    conn = get_connection()
    try:
        conn.execute(
            '''
            INSERT INTO games (
                library_id,title,path,category,source_type,manual_entry,metadata_locked,
                description,developer,publisher,release_year,genre,platform,tags,notes,
                cover_url,metadata_source,metadata_external_id,added_at,updated_at
            ) VALUES (NULL,?,?,?,?,1,0,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
            ''',
            (
                title, path, category, source_type,
                details.get('description',''), details.get('developer',''), details.get('publisher',''),
                details.get('release_year',''), details.get('genre',''), details.get('platform',''),
                '', 'Added from the search-to-add workflow.', details.get('cover_url',''),
                details.get('metadata_source') or source, details.get('metadata_external_id') or external_id,
            ),
        )
        conn.commit()
        game_id = conn.execute('SELECT last_insert_rowid() id').fetchone()['id']
    except Exception as exc:
        existing = conn.execute('SELECT id FROM games WHERE path=?', (path,)).fetchone()
        conn.close()
        if existing:
            existing_game = conn.execute('SELECT title, category FROM games WHERE id=?', (existing['id'],)).fetchone()
            return jsonify({
                'success': True,
                'game_id': existing['id'],
                'title': existing_game['title'] if existing_game else title,
                'category': (existing_game['category'] if existing_game else category) or 'Unsorted',
                'redirect': f'/games/{existing["id"]}',
                'existing': True,
                'message': f'{title} is already in the museum.',
            })
        return jsonify({'success': False, 'message': str(exc)}), 500
    conn.close()

    cover_path = ''
    try:
        cover_path = download_cover(game_id, details.get('cover_url',''))
    except Exception:
        cover_path = ''
    if cover_path:
        conn = get_connection()
        conn.execute('UPDATE games SET cover_path=?, updated_at=CURRENT_TIMESTAMP WHERE id=?', (cover_path, game_id))
        conn.commit()
        conn.close()

    try:
        queue_game(game_id, 'search-to-add')
    except Exception:
        pass

    return jsonify({
        'success': True,
        'game_id': game_id,
        'title': title,
        'category': category,
        'redirect': f'/games/{game_id}',
        'message': f'{title} was added and queued for preparation.',
    })
