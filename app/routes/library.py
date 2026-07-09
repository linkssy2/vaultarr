from urllib.parse import urlencode
from uuid import uuid4

from flask import Blueprint, render_template, abort, request, redirect
from app.database.database import get_connection
from app.services.metadata_service import search_metadata_diagnostics, get_steam_details, get_wikipedia_details, get_rawg_details, get_igdb_details, get_steamgriddb_details, download_cover

library_bp = Blueprint('library', __name__)

SEARCH_FIELDS = ['title','path','developer','publisher','genre','description','tags','category','notes','executables','platform','release_year','source_type']


def _category_counts(conn):
    cats = conn.execute("SELECT category, COUNT(*) count FROM games GROUP BY category").fetchall()
    return cats, {row['category'] or 'Unsorted': row['count'] for row in cats}


@library_bp.route('/library')
def library():
    q = request.args.get('q','').strip()
    sort = request.args.get('sort','title')
    category = request.args.get('category','All Games')
    where=[]; params=[]
    if q:
        like=f'%{q}%'
        where.append('(' + ' OR '.join([f'{field} LIKE ?' for field in SEARCH_FIELDS]) + ')')
        params += [like] * len(SEARCH_FIELDS)
    if category and category != 'All Games':
        where.append('category = ?'); params.append(category)
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
    conn.close()
    return render_template('library.html', games=games, q=q, sort=sort, active_category=category, category=category, categories=cats, category_counts=category_counts, total_count=total_count)


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
    results=[]; logs=[]; query=request.args.get('metadata_query','').strip(); provider=request.args.get('provider','all')
    if query:
        search_data=search_metadata_diagnostics(query, provider)
        results=search_data.get('results', [])
        logs=search_data.get('logs', [])
    return render_template('game_detail.html', game=game, metadata_results=results, metadata_logs=logs, metadata_query=query, provider=provider)


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
