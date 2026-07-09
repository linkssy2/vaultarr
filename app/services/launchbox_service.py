import os
import re
import sqlite3
import time
import zipfile
import tempfile
from datetime import datetime
from difflib import SequenceMatcher
from pathlib import Path
from urllib.parse import quote
import xml.etree.ElementTree as ET

import requests

APP_DIR = Path(os.getenv('LOCALAPPDATA', '.')) / 'Vaultarr'
CACHE_DIR = APP_DIR / 'cache' / 'launchbox'
DB_PATH = CACHE_DIR / 'launchbox_index.db'
METADATA_ZIP_PATH = CACHE_DIR / 'Metadata.zip'
METADATA_URL = 'https://gamesdb.launchbox-app.com/Metadata.zip'
USER_AGENT = 'Vaultarr/Alpha21.2'

# LaunchBox image URL formats have changed over time and image metadata can vary.
# Use only full URLs from metadata directly when available; otherwise construct a best-effort URL.
IMAGE_BASE_URL = 'https://images.launchbox-app.com/'


def clean_title(value):
    value = re.sub(r'\([^)]*\)|\[[^\]]*\]', '', value or '')
    value = re.sub(r'[_\.-]+', ' ', value)
    value = re.sub(r'[^a-zA-Z0-9\s]+', ' ', value)
    return re.sub(r'\s+', ' ', value).strip().lower()


def text_of(parent, *names):
    if parent is None:
        return ''
    wanted = {n.lower() for n in names}
    for child in list(parent):
        tag = child.tag.split('}', 1)[-1].lower()
        if tag in wanted:
            return (child.text or '').strip()
    return ''


def first_text(parent, names):
    return text_of(parent, *names)


def list_text(parent, names):
    wanted = {n.lower() for n in names}
    values = []
    for child in list(parent):
        tag = child.tag.split('}', 1)[-1].lower()
        if tag in wanted:
            if child.text and child.text.strip():
                values.append(child.text.strip())
            for sub in list(child):
                if sub.text and sub.text.strip():
                    values.append(sub.text.strip())
    # preserve order, remove dupes
    seen = set()
    out = []
    for value in values:
        key = value.lower()
        if key not in seen:
            seen.add(key)
            out.append(value)
    return ', '.join(out)


def ensure_db():
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute('''
      CREATE TABLE IF NOT EXISTS launchbox_games (
        database_id TEXT PRIMARY KEY,
        title TEXT DEFAULT '',
        title_key TEXT DEFAULT '',
        platform TEXT DEFAULT '',
        release_year TEXT DEFAULT '',
        release_date TEXT DEFAULT '',
        developer TEXT DEFAULT '',
        publisher TEXT DEFAULT '',
        genre TEXT DEFAULT '',
        overview TEXT DEFAULT '',
        max_players TEXT DEFAULT '',
        esrb TEXT DEFAULT '',
        last_indexed TEXT DEFAULT CURRENT_TIMESTAMP
      )
    ''')
    conn.execute('''
      CREATE TABLE IF NOT EXISTS launchbox_images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        database_id TEXT DEFAULT '',
        title TEXT DEFAULT '',
        platform TEXT DEFAULT '',
        image_type TEXT DEFAULT '',
        region TEXT DEFAULT '',
        file_name TEXT DEFAULT '',
        url TEXT DEFAULT '',
        UNIQUE(database_id, image_type, region, file_name)
      )
    ''')
    conn.execute('''
      CREATE TABLE IF NOT EXISTS launchbox_sync (
        key TEXT PRIMARY KEY,
        value TEXT DEFAULT ''
      )
    ''')
    conn.commit()
    return conn


def sync_status():
    conn = ensure_db()
    games = conn.execute('SELECT COUNT(*) AS c FROM launchbox_games').fetchone()['c']
    images = conn.execute('SELECT COUNT(*) AS c FROM launchbox_images').fetchone()['c']
    last = conn.execute("SELECT value FROM launchbox_sync WHERE key='last_sync'").fetchone()
    source = conn.execute("SELECT value FROM launchbox_sync WHERE key='source'").fetchone()
    conn.close()
    return {
        'synced': games > 0,
        'games': games,
        'images': images,
        'last_sync': last['value'] if last else '',
        'source': source['value'] if source else METADATA_URL,
        'db_path': str(DB_PATH),
    }


def find_metadata_xml(zip_path):
    with zipfile.ZipFile(zip_path, 'r') as z:
        names = z.namelist()
        for name in names:
            if name.lower().endswith('metadata.xml'):
                return name
        for name in names:
            if name.lower().endswith('.xml') and 'metadata' in name.lower():
                return name
        for name in names:
            if name.lower().endswith('.xml'):
                return name
    return None


def download_metadata_zip(url=METADATA_URL):
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    response = requests.get(url, timeout=90, headers={'User-Agent': USER_AGENT})
    response.raise_for_status()
    if not response.content.startswith(b'PK'):
        raise ValueError('LaunchBox metadata download did not return a ZIP file.')
    METADATA_ZIP_PATH.write_bytes(response.content)
    return METADATA_ZIP_PATH


def image_url_from_file(file_name):
    file_name = (file_name or '').strip()
    if not file_name:
        return ''
    if file_name.startswith(('http://', 'https://')):
        return file_name
    # Best-effort public image URL. Some LaunchBox metadata versions include enough data for this to work.
    return IMAGE_BASE_URL + quote(file_name.replace('\\', '/'), safe='/')


def parse_game(element):
    database_id = first_text(element, ['DatabaseID', 'DatabaseId', 'Id', 'ID'])
    title = first_text(element, ['Name', 'Title', 'GameName'])
    platform = first_text(element, ['Platform', 'PlatformName'])
    overview = first_text(element, ['Overview', 'Description', 'Notes'])
    release_date = first_text(element, ['ReleaseDate', 'Release Date', 'Date'])
    year = ''
    match = re.search(r'\b(19|20)\d{2}\b', release_date or '')
    if match:
        year = match.group(0)
    developer = first_text(element, ['Developer', 'Developers']) or list_text(element, ['Developers'])
    publisher = first_text(element, ['Publisher', 'Publishers']) or list_text(element, ['Publishers'])
    genre = first_text(element, ['Genre', 'Genres']) or list_text(element, ['Genres'])
    esrb = first_text(element, ['ESRB', 'ESRBRating', 'Rating'])
    max_players = first_text(element, ['MaxPlayers', 'Max Players'])
    if not database_id and title and platform:
        database_id = f'{platform}:{title}'
    return {
        'database_id': database_id,
        'title': title,
        'title_key': clean_title(title),
        'platform': platform,
        'release_year': year,
        'release_date': release_date,
        'developer': developer,
        'publisher': publisher,
        'genre': genre,
        'overview': overview,
        'max_players': max_players,
        'esrb': esrb,
    }


def parse_image(element):
    database_id = first_text(element, ['DatabaseID', 'DatabaseId', 'GameDatabaseId', 'GameID', 'GameId'])
    title = first_text(element, ['Name', 'Title', 'GameName'])
    platform = first_text(element, ['Platform', 'PlatformName'])
    image_type = first_text(element, ['Type', 'ImageType', 'Category'])
    region = first_text(element, ['Region', 'Regions'])
    file_name = first_text(element, ['FileName', 'Filename', 'Path', 'ImagePath', 'Url', 'URL'])
    url = first_text(element, ['Url', 'URL']) or image_url_from_file(file_name)
    return {
        'database_id': database_id,
        'title': title,
        'platform': platform,
        'image_type': image_type,
        'region': region,
        'file_name': file_name,
        'url': url,
    }


def sync_launchbox_metadata(url=METADATA_URL):
    zip_path = download_metadata_zip(url)
    xml_name = find_metadata_xml(zip_path)
    if not xml_name:
        raise ValueError('Could not find Metadata.xml inside LaunchBox Metadata.zip.')

    conn = ensure_db()
    conn.execute('DELETE FROM launchbox_games')
    conn.execute('DELETE FROM launchbox_images')
    game_count = image_count = 0

    with zipfile.ZipFile(zip_path, 'r') as z:
        with z.open(xml_name) as xml_file:
            context = ET.iterparse(xml_file, events=('end',))
            for _, elem in context:
                tag = elem.tag.split('}', 1)[-1].lower()
                if tag == 'game':
                    data = parse_game(elem)
                    if data.get('database_id') and data.get('title'):
                        conn.execute('''
                          INSERT OR REPLACE INTO launchbox_games
                          (database_id,title,title_key,platform,release_year,release_date,developer,publisher,genre,overview,max_players,esrb,last_indexed)
                          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)
                        ''', (
                            data['database_id'], data['title'], data['title_key'], data['platform'], data['release_year'], data['release_date'],
                            data['developer'], data['publisher'], data['genre'], data['overview'], data['max_players'], data['esrb']
                        ))
                        game_count += 1
                    elem.clear()
                elif tag in ('gameimage', 'image', 'gameimages'):
                    data = parse_image(elem)
                    if data.get('database_id') and (data.get('file_name') or data.get('url')):
                        conn.execute('''
                          INSERT OR IGNORE INTO launchbox_images
                          (database_id,title,platform,image_type,region,file_name,url)
                          VALUES (?,?,?,?,?,?,?)
                        ''', (data['database_id'], data['title'], data['platform'], data['image_type'], data['region'], data['file_name'], data['url']))
                        image_count += 1
                    elem.clear()

    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    conn.execute("INSERT OR REPLACE INTO launchbox_sync (key,value) VALUES ('last_sync', ?)", (now,))
    conn.execute("INSERT OR REPLACE INTO launchbox_sync (key,value) VALUES ('source', ?)", (url,))
    conn.commit()
    conn.close()
    return {'success': True, 'games': game_count, 'images': image_count, 'last_sync': now, 'source': url}


def score_match(query, title, platform='', wanted_platform=''):
    q = clean_title(query)
    t = clean_title(title)
    if not q or not t:
        return 0
    if q == t:
        score = 98
    elif q in t or t in q:
        score = 88
    else:
        score = round(SequenceMatcher(None, q, t).ratio() * 82)
    if wanted_platform and platform:
        wp = clean_title(wanted_platform)
        pp = clean_title(platform)
        if wp and (wp == pp or wp in pp or pp in wp):
            score += 8
    return max(0, min(100, score))


def search_launchbox(query, platform='', limit=12):
    status = sync_status()
    if not status['synced']:
        return []
    qkey = clean_title(query)
    if not qkey:
        return []
    terms = [x for x in qkey.split() if len(x) > 1][:6]
    conn = ensure_db()
    params = []
    if terms:
        where = ' AND '.join(['title_key LIKE ?' for _ in terms])
        params = [f'%{term}%' for term in terms]
    else:
        where = 'title_key LIKE ?'
        params = [f'%{qkey}%']
    rows = conn.execute(f'''
      SELECT * FROM launchbox_games
      WHERE {where}
      LIMIT 80
    ''', params).fetchall()
    if not rows:
        rows = conn.execute('SELECT * FROM launchbox_games WHERE title_key LIKE ? LIMIT 80', (f'%{qkey[:12]}%',)).fetchall()
    out = []
    for row in rows:
        data = dict(row)
        data['confidence'] = score_match(query, data.get('title'), data.get('platform'), platform)
        if data['confidence'] >= 35:
            out.append(data)
    out.sort(key=lambda x: (x['confidence'], x.get('release_year') or ''), reverse=True)
    conn.close()
    return out[:limit]


def get_launchbox_details(database_id):
    if not database_id:
        return None
    conn = ensure_db()
    row = conn.execute('SELECT * FROM launchbox_games WHERE database_id=?', (database_id,)).fetchone()
    conn.close()
    if not row:
        return None
    data = dict(row)
    return {
        'title': data.get('title', ''),
        'description': data.get('overview', ''),
        'developer': data.get('developer', ''),
        'publisher': data.get('publisher', ''),
        'release_year': data.get('release_year', ''),
        'genre': data.get('genre', ''),
        'platform': data.get('platform', ''),
        'cover_url': first_launchbox_image(data.get('database_id'), preferred=('Box - Front', 'Front', 'Box Front')),
        'metadata_source': 'LaunchBox',
        'metadata_external_id': data.get('database_id', ''),
    }


def first_launchbox_image(database_id, preferred=()):
    if not database_id:
        return ''
    conn = ensure_db()
    rows = conn.execute('SELECT * FROM launchbox_images WHERE database_id=?', (database_id,)).fetchall()
    conn.close()
    if not rows:
        return ''
    preferred_lower = [p.lower() for p in preferred]
    all_rows = [dict(row) for row in rows]
    for pref in preferred_lower:
        for row in all_rows:
            if pref in (row.get('image_type') or '').lower() and row.get('url'):
                return row.get('url') or ''
    for row in all_rows:
        if row.get('url'):
            return row.get('url') or ''
    return ''


def launchbox_media_for_game(game, limit=80):
    title = game.get('title') or ''
    platform = game.get('platform') or ''
    database_id = ''
    if (game.get('metadata_source') or '').lower() == 'launchbox':
        database_id = game.get('metadata_external_id') or ''
    if not database_id:
        matches = search_launchbox(title, platform, limit=1)
        if matches:
            database_id = matches[0].get('database_id') or ''
    if not database_id:
        return []
    conn = ensure_db()
    rows = conn.execute("""
        SELECT * FROM launchbox_images
        WHERE database_id=?
        ORDER BY
          CASE
            WHEN lower(image_type) LIKE '%box%front%' THEN 0
            WHEN lower(image_type) LIKE '%front%' THEN 1
            WHEN lower(image_type) LIKE '%cover%' THEN 2
            WHEN lower(image_type) LIKE '%screenshot%' THEN 3
            ELSE 4
          END, image_type, region
        LIMIT ?
    """, (database_id, limit)).fetchall()
    conn.close()
    out = []
    for row in rows:
        data = dict(row)
        url = data.get('url') or image_url_from_file(data.get('file_name'))
        if not url:
            continue
        image_type = data.get('image_type') or 'Artwork'
        media_type = 'cover' if 'box' in image_type.lower() else 'screenshot' if 'screenshot' in image_type.lower() else 'artwork'
        out.append({
            'provider': 'LaunchBox',
            'media_type': media_type,
            'title': image_type,
            'url': url,
            'src': url,
            'remote_url': url,
            'width': 0,
            'height': 0,
            'confidence': 86,
            'cached': False,
        })
    return out
