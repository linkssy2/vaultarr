import mimetypes
import os
import re
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.parse import urlparse

import requests

from app.database.database import get_connection
from app.services.metadata_service import clean_search_title, safe_json_response, RAWG_SEARCH_URL, IGDB_GAMES_URL, igdb_headers
from app.services.provider_settings import load_provider_settings
from app.services.launchbox_service import launchbox_media_for_game
from app.services.storage_stats import directory_stats, invalidate_directory_stats

APP_DIR = Path(os.getenv('LOCALAPPDATA', '.')) / 'Vaultarr'
MEDIA_DIR = APP_DIR / 'media'
USER_AGENT = 'Vaultarr/Alpha21'

IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp'}


def ensure_media_table():
    conn = get_connection()
    conn.execute('''
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
    ''')
    conn.commit()
    conn.close()


def media_count(game_id):
    ensure_media_table()
    conn = get_connection()
    row = conn.execute('SELECT COUNT(*) AS count FROM media_assets WHERE game_id=? AND (local_path != "" OR remote_url != "")', (game_id,)).fetchone()
    conn.close()
    return row['count'] if row else 0


def cached_media(game_id):
    ensure_media_table()
    conn = get_connection()
    rows = conn.execute('SELECT * FROM media_assets WHERE game_id=? ORDER BY CASE WHEN local_path != "" THEN 0 ELSE 1 END, id DESC', (game_id,)).fetchall()
    conn.close()
    out = []
    for row in rows:
        data = dict(row)
        if data.get('local_path'):
            data['src'] = f"/media-assets/{data['local_path']}"
            data['cached'] = True
        else:
            data['src'] = data.get('remote_url', '')
            data['cached'] = False
        data['confidence'] = 100 if data.get('cached') else 80
        try:
            data = annotate_media_item(data)
        except Exception:
            pass
        out.append(data)
    return out


def _image_result(provider, media_type, title, url, width=0, height=0, confidence=75):
    if not url:
        return None
    return {
        'provider': provider,
        'media_type': media_type,
        'title': title or media_type.title(),
        'url': url,
        'src': url,
        'remote_url': url,
        'width': width or 0,
        'height': height or 0,
        'confidence': confidence,
        'cached': False,
    }


def _dedupe(results):
    seen = set()
    out = []
    for item in results:
        url = (item.get('url') or item.get('remote_url') or '').split('?')[0].strip().lower()
        if not url or url in seen:
            continue
        seen.add(url)
        out.append(item)
    return out


def search_rawg_media(game, settings):
    key = settings.get('rawg_api_key')
    if not key:
        return []
    rawg_id = ''
    if (game.get('metadata_source') or '').lower() == 'rawg':
        rawg_id = game.get('metadata_external_id') or ''
    if not rawg_id:
        response = requests.get(
            RAWG_SEARCH_URL,
            params={'key': key, 'search': clean_search_title(game.get('title')), 'page_size': 1},
            timeout=15,
            headers={'User-Agent': USER_AGENT},
        )
        response.raise_for_status()
        data = safe_json_response(response, 'RAWG Media Search')
        results = data.get('results') or []
        if results:
            rawg_id = str(results[0].get('id') or '')
    if not rawg_id:
        return []
    response = requests.get(
        f'{RAWG_SEARCH_URL}/{rawg_id}/screenshots',
        params={'key': key, 'page_size': 24},
        timeout=15,
        headers={'User-Agent': USER_AGENT},
    )
    response.raise_for_status()
    data = safe_json_response(response, 'RAWG Screenshots')
    items = []
    for index, shot in enumerate(data.get('results') or [], start=1):
        item = _image_result('RAWG', 'screenshot', f'Screenshot {index}', shot.get('image', ''), shot.get('width') or 0, shot.get('height') or 0, 88)
        if item:
            items.append(item)
    return items


def search_igdb_media(game, settings):
    if not settings.get('igdb_client_id') or not settings.get('igdb_client_secret'):
        return []
    igdb_id = ''
    if (game.get('metadata_source') or '').lower() == 'igdb':
        igdb_id = game.get('metadata_external_id') or ''
    if not igdb_id:
        return []
    body = f'where game = {int(igdb_id)}; fields url,width,height; limit 30;'
    response = requests.post('https://api.igdb.com/v4/screenshots', data=body, timeout=15, headers=igdb_headers(settings))
    response.raise_for_status()
    data = safe_json_response(response, 'IGDB Screenshots')
    items = []
    for index, shot in enumerate(data or [], start=1):
        url = shot.get('url') or ''
        if url.startswith('//'):
            url = 'https:' + url
        url = url.replace('t_thumb', 't_1080p').replace('t_screenshot_med', 't_1080p')
        item = _image_result('IGDB', 'screenshot', f'Screenshot {index}', url, shot.get('width') or 0, shot.get('height') or 0, 92)
        if item:
            items.append(item)
    return items


def search_steam_media(game):
    if (game.get('metadata_source') or '').lower() != 'steam' or not game.get('metadata_external_id'):
        return []
    response = requests.get(
        'https://store.steampowered.com/api/appdetails',
        params={'appids': game.get('metadata_external_id'), 'cc': 'us', 'l': 'english'},
        timeout=15,
        headers={'User-Agent': USER_AGENT},
    )
    response.raise_for_status()
    data = safe_json_response(response, 'Steam Media')
    app = data.get(str(game.get('metadata_external_id')), {})
    if not app.get('success'):
        return []
    details = app.get('data') or {}
    items = []
    if details.get('header_image'):
        items.append(_image_result('Steam', 'hero', 'Steam Header', details.get('header_image'), 0, 0, 80))
    for index, shot in enumerate(details.get('screenshots') or [], start=1):
        url = shot.get('path_full') or shot.get('path_thumbnail') or ''
        item = _image_result('Steam', 'screenshot', f'Screenshot {index}', url, 0, 0, 84)
        if item:
            items.append(item)
    return [x for x in items if x]


def _provider_media_result(name, game, settings):
    try:
        if name == 'launchbox':
            items = launchbox_media_for_game(game)
        elif name == 'rawg':
            items = search_rawg_media(game, settings)
        elif name == 'igdb':
            items = search_igdb_media(game, settings)
        else:
            items = search_steam_media(game)
        return items, {'provider': name.upper(), 'status': 'ok', 'message': f'{len(items)} image(s).'}
    except Exception as exc:
        return [], {'provider': name.upper(), 'status': 'error', 'message': str(exc)}


def provider_media_results(game, provider='all'):
    settings = load_provider_settings()
    providers = ['launchbox', 'rawg', 'igdb', 'steam'] if provider == 'all' else [provider]
    with ThreadPoolExecutor(max_workers=min(4, len(providers)), thread_name_prefix='vaultarr-media') as pool:
        responses = list(pool.map(lambda name: _provider_media_result(name, game, settings), providers))
    results = []
    logs = []
    for provider_results, provider_log in responses:
        results.extend(provider_results)
        logs.append(provider_log)
    return {'results': [annotate_media_item(item) for item in _dedupe(results)[:40]], 'logs': logs}


def all_media_results(game, provider='all'):
    cached = cached_media(game['id'])
    provider_data = provider_media_results(game, provider)
    urls = {(item.get('remote_url') or item.get('url') or '').split('?')[0].lower() for item in cached}
    fresh = [item for item in provider_data['results'] if (item.get('url') or '').split('?')[0].lower() not in urls]
    return {'cached': cached, 'results': cached + fresh, 'logs': provider_data['logs'], 'cache_count': len(cached)}


def safe_filename(name):
    name = re.sub(r'[^a-zA-Z0-9._-]+', '_', name or 'media').strip('_')
    return name[:80] or 'media'


def download_media_asset(game_id, url, title='Media', provider='Provider', media_type='screenshot'):
    ensure_media_table()
    if not url:
        raise ValueError('No media URL provided.')
    response = requests.get(url, timeout=25, headers={'User-Agent': USER_AGENT})
    response.raise_for_status()
    content_type = response.headers.get('content-type', '').lower()
    parsed = urlparse(url)
    suffix = Path(parsed.path).suffix.lower()
    if suffix not in IMAGE_EXTENSIONS:
        if 'jpeg' in content_type or 'jpg' in content_type:
            suffix = '.jpg'
        elif 'png' in content_type:
            suffix = '.png'
        elif 'webp' in content_type:
            suffix = '.webp'
        else:
            raise ValueError('Downloaded media does not look like an image.')
    folder = MEDIA_DIR / str(game_id)
    folder.mkdir(parents=True, exist_ok=True)
    filename = f'{safe_filename(media_type)}_{safe_filename(provider)}_{int(time.time())}{suffix}'
    path = folder / filename
    path.write_bytes(response.content)
    rel = str(Path(str(game_id)) / filename).replace('\\', '/')
    conn = get_connection()
    conn.execute('''
      INSERT OR REPLACE INTO media_assets (game_id, provider, media_type, title, remote_url, local_path, cached_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ''', (game_id, provider, media_type, title, url, rel))
    conn.commit()
    row = conn.execute('SELECT * FROM media_assets WHERE game_id=? AND remote_url=?', (game_id, url)).fetchone()
    conn.close()
    data = dict(row) if row else {}
    data['src'] = f'/media-assets/{rel}'
    data['cached'] = True
    invalidate_directory_stats(MEDIA_DIR)
    return data

# -----------------------------------------------------------------------------
# Alpha 22.2 Media Intelligence
# -----------------------------------------------------------------------------

def media_role(item):
    """Classify provider media into the role it should play inside Vaultarr."""
    text = ' '.join([
        str(item.get('media_type') or ''),
        str(item.get('title') or ''),
        str(item.get('provider') or ''),
        str(item.get('url') or item.get('remote_url') or ''),
    ]).lower()

    if any(token in text for token in ['logo', 'clear logo', 'wheel']):
        return 'logo'
    if any(token in text for token in ['disc', 'cart', 'cartridge']):
        return 'disc_art'
    if any(token in text for token in ['screenshot', 'screen shot', 'gameplay']):
        return 'screenshot'
    if any(token in text for token in ['banner', 'fanart', 'fan art', 'background', 'hero', 'header']):
        return 'hero'
    if any(token in text for token in ['box - back', 'box back', 'back cover', 'back']):
        return 'box_back'
    if any(token in text for token in ['box - front', 'box front', 'front cover', 'front', 'cover', 'poster']):
        return 'box_cover'
    if str(item.get('media_type') or '').lower() == 'cover':
        return 'box_cover'
    return 'artwork'


def _ratio(item):
    try:
        w = int(item.get('width') or 0)
        h = int(item.get('height') or 0)
    except Exception:
        return 0
    return (w / h) if w and h else 0


def media_cover_score(item):
    """Score an image specifically for use as front box cover art."""
    role = media_role(item)
    provider = str(item.get('provider') or '').lower()
    text = ' '.join([
        str(item.get('title') or ''),
        str(item.get('media_type') or ''),
        str(item.get('url') or item.get('remote_url') or ''),
    ]).lower()
    score = int(item.get('confidence') or 70)

    role_bonus = {
        'box_cover': 95,
        'box_back': 18,
        'artwork': 18,
        'hero': -35,
        'screenshot': -70,
        'logo': -90,
        'disc_art': -55,
    }.get(role, 0)
    score += role_bonus

    if provider == 'launchbox':
        score += 24
    elif provider == 'igdb':
        score += 18
    elif provider == 'steamgriddb':
        score += 14
    elif provider == 'rawg':
        score -= 8
    elif provider == 'steam':
        score -= 10
    elif provider == 'wikipedia':
        score -= 16

    if 'box - front' in text or 'front cover' in text or 'box front' in text:
        score += 40
    if 'cover_big' in text or 'cover' in text:
        score += 16
    if 'screenshot' in text or 'background' in text or 'header' in text or 'hero' in text:
        score -= 45
    if 'back' in text:
        score -= 28

    ratio = _ratio(item)
    if ratio:
        # Most PC/console box art is portrait-ish. Square art is acceptable; wide images usually are not covers.
        if 0.55 <= ratio <= 0.82:
            score += 32
        elif 0.45 <= ratio <= 0.95:
            score += 18
        elif 0.95 < ratio <= 1.18:
            score -= 5
        elif ratio > 1.18:
            score -= 55

    return score


def annotate_media_item(item):
    data = dict(item or {})
    data['media_role'] = media_role(data)
    data['cover_score'] = media_cover_score(data)
    return data


def select_best_cover(media_items=None, metadata_candidates=None):
    """Return the best candidate for front box art from metadata and provider media."""
    candidates = []

    for item in metadata_candidates or []:
        if not item or not (item.get('url') or item.get('cover_url')):
            continue
        provider = item.get('provider') or item.get('source') or 'Provider'
        source_lower = provider.lower()
        media_type = item.get('media_type') or 'cover'
        title = item.get('title') or f'{provider} cover'
        if source_lower in ('rawg', 'steam'):
            media_type = 'hero'
        elif source_lower in ('igdb', 'launchbox', 'steamgriddb'):
            media_type = 'cover'
        normalized = {
            'provider': provider,
            'media_type': media_type,
            'title': title,
            'url': item.get('url') or item.get('cover_url'),
            'remote_url': item.get('url') or item.get('cover_url'),
            'width': item.get('width') or 0,
            'height': item.get('height') or 0,
            'confidence': item.get('confidence') or 86,
        }
        candidates.append(annotate_media_item(normalized))

    for item in media_items or []:
        if item and (item.get('url') or item.get('remote_url')):
            candidates.append(annotate_media_item(item))

    if not candidates:
        return None

    candidates.sort(key=lambda item: int(item.get('cover_score') or 0), reverse=True)
    best = candidates[0]
    if int(best.get('cover_score') or 0) < 95:
        return None
    return best


def media_for_gallery_cache(media_items, limit=8):
    """Gallery auto-cache should prefer screenshots/artwork, not front covers."""
    annotated = [annotate_media_item(item) for item in (media_items or [])]
    preferred = []
    fallback = []
    for item in annotated:
        role = item.get('media_role')
        if role in ('screenshot', 'hero', 'artwork'):
            preferred.append(item)
        elif role not in ('box_cover', 'box_back', 'logo', 'disc_art'):
            fallback.append(item)
    preferred.sort(key=lambda item: int(item.get('confidence') or 0), reverse=True)
    fallback.sort(key=lambda item: int(item.get('confidence') or 0), reverse=True)
    return (preferred + fallback)[:limit]

# -----------------------------------------------------------------------------
# Alpha 30.1 Media Cache Manager
# -----------------------------------------------------------------------------

def _safe_local_media_path(local_path):
    if not local_path:
        return None
    path = (MEDIA_DIR / str(local_path).replace('\\\\', '/')).resolve()
    try:
        path.relative_to(MEDIA_DIR.resolve())
    except Exception:
        return None
    return path


def delete_media_asset(asset_id, game_id=None, remove_file=True):
    ensure_media_table()
    conn = get_connection()
    if game_id is None:
        row = conn.execute('SELECT * FROM media_assets WHERE id=?', (asset_id,)).fetchone()
    else:
        row = conn.execute('SELECT * FROM media_assets WHERE id=? AND game_id=?', (asset_id, game_id)).fetchone()
    if not row:
        conn.close()
        return {'deleted': False, 'message': 'Asset not found.'}
    data = dict(row)
    conn.execute('DELETE FROM media_assets WHERE id=?', (asset_id,))
    conn.commit()
    conn.close()

    removed_file = False
    if remove_file and data.get('local_path'):
        path = _safe_local_media_path(data.get('local_path'))
        if path and path.exists():
            try:
                path.unlink()
                removed_file = True
            except Exception:
                removed_file = False
    if removed_file:
        invalidate_directory_stats(MEDIA_DIR)
    return {'deleted': True, 'removed_file': removed_file, 'asset': data}


def clear_game_media_cache(game_id, media_type='all', remove_files=True):
    ensure_media_table()
    conn = get_connection()
    if media_type and media_type != 'all':
        rows = conn.execute('SELECT * FROM media_assets WHERE game_id=? AND media_type=?', (game_id, media_type)).fetchall()
    else:
        rows = conn.execute('SELECT * FROM media_assets WHERE game_id=?', (game_id,)).fetchall()

    deleted = 0
    removed_files = 0
    for row in rows:
        data = dict(row)
        if remove_files and data.get('local_path'):
            path = _safe_local_media_path(data.get('local_path'))
            if path and path.exists():
                try:
                    path.unlink()
                    removed_files += 1
                except Exception:
                    pass
        conn.execute('DELETE FROM media_assets WHERE id=?', (data.get('id'),))
        deleted += 1
    conn.commit()
    conn.close()
    if removed_files:
        invalidate_directory_stats(MEDIA_DIR)
    return {'deleted': deleted, 'removed_files': removed_files, 'media_type': media_type or 'all'}


def media_cache_summary():
    ensure_media_table()
    conn = get_connection()
    total_rows = conn.execute('SELECT COUNT(*) AS count FROM media_assets').fetchone()['count']
    cached_rows = conn.execute('SELECT COUNT(*) AS count FROM media_assets WHERE COALESCE(local_path, "") != ""').fetchone()['count']
    by_type_rows = conn.execute('''
      SELECT COALESCE(NULLIF(media_type, ''), 'unknown') AS media_type, COUNT(*) AS count
      FROM media_assets
      GROUP BY COALESCE(NULLIF(media_type, ''), 'unknown')
      ORDER BY count DESC, media_type ASC
    ''').fetchall()
    conn.close()

    storage = directory_stats(MEDIA_DIR)
    size = storage['size']
    files = storage['files']
    return {
        'total_assets': total_rows,
        'cached_assets': cached_rows,
        'files': files,
        'size_bytes': size,
        'size_mb': round(size / 1024 / 1024, 2),
        'by_type': [dict(row) for row in by_type_rows],
    }


def cleanup_orphaned_media_files():
    ensure_media_table()
    conn = get_connection()
    rows = conn.execute('SELECT local_path FROM media_assets WHERE COALESCE(local_path, "") != ""').fetchall()
    conn.close()
    referenced = set()
    for row in rows:
        path = _safe_local_media_path(row['local_path'])
        if path:
            referenced.add(str(path.resolve()))

    removed = 0
    removed_bytes = 0
    if MEDIA_DIR.exists():
        for path in MEDIA_DIR.rglob('*'):
            if not path.is_file():
                continue
            resolved = str(path.resolve())
            if resolved in referenced:
                continue
            try:
                size = path.stat().st_size
                path.unlink()
                removed += 1
                removed_bytes += size
            except Exception:
                pass
    if removed:
        invalidate_directory_stats(MEDIA_DIR)
    return {'removed_files': removed, 'removed_bytes': removed_bytes, 'removed_mb': round(removed_bytes / 1024 / 1024, 2)}
