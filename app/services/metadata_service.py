import os
import re
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.parse import quote_plus

import requests

from app.services.provider_settings import load_provider_settings
from app.services.launchbox_service import search_launchbox, get_launchbox_details

APP_DIR = Path(os.getenv('LOCALAPPDATA', '.')) / 'Vaultarr'
COVERS_DIR = APP_DIR / 'covers'
TOKEN_CACHE_DIR = APP_DIR / 'cache'
TOKEN_CACHE_FILE = TOKEN_CACHE_DIR / 'igdb_token.txt'

STEAM_SEARCH_URL = 'https://store.steampowered.com/api/storesearch/'
STEAM_DETAILS_URL = 'https://store.steampowered.com/api/appdetails'
WIKI_SEARCH_URL = 'https://en.wikipedia.org/w/api.php'
WIKI_REST_SUMMARY_URL = 'https://en.wikipedia.org/api/rest_v1/page/summary/'
RAWG_SEARCH_URL = 'https://api.rawg.io/api/games'
IGDB_TOKEN_URL = 'https://id.twitch.tv/oauth2/token'
IGDB_GAMES_URL = 'https://api.igdb.com/v4/games'
STEAMGRIDDB_SEARCH_URL = 'https://www.steamgriddb.com/api/v2/search/autocomplete/'
STEAMGRIDDB_GRIDS_URL = 'https://www.steamgriddb.com/api/v2/grids/game/'

USER_AGENT = 'Vaultarr/Alpha16.1'


def safe_json_response(response, provider_name):
    content_type = response.headers.get('content-type', '').lower()
    text_preview = (response.text or '')[:180].replace('\n', ' ').strip()

    if 'json' not in content_type and not (response.text or '').strip().startswith(('{', '[')):
        raise ValueError(f'{provider_name} returned non-JSON response: {text_preview or response.status_code}')

    try:
        return response.json()
    except Exception as e:
        raise ValueError(f'{provider_name} returned invalid JSON: {text_preview or e}')


def clean_search_title(title):
    cleaned = re.sub(r'\([^)]*\)|\[[^\]]*\]', '', title or '')
    cleaned = re.sub(r'[_\.]', ' ', cleaned)
    cleaned = re.sub(r'\s+', ' ', cleaned)
    return cleaned.strip()


def confidence_score(query, result_title, description=''):
    q = clean_search_title(query).lower()
    t = (result_title or '').lower()
    d = (description or '').lower()
    if not q or not t:
        return 0
    if q == t:
        return 98
    if q in t:
        return 88
    q_words = [w for w in re.split(r'\W+', q) if len(w) > 1]
    if not q_words:
        return 20
    hits = sum(1 for w in q_words if w in t or w in d)
    return min(85, max(15, round((hits / len(q_words)) * 80)))


def search_metadata(title, provider='all'):
    return search_metadata_diagnostics(title, provider)['results']


def provider_enabled(settings, key):
    return bool(settings.get(f'enable_{key}', True))


def _search_metadata_diagnostics_serial(title, provider='all'):
    settings = load_provider_settings()
    results = []
    logs = []
    query = clean_search_title(title)

    if not query:
        return {
            'results': [],
            'logs': [{'provider': 'Metadata', 'status': 'warning', 'message': 'Search query was empty.'}],
        }

    providers = []
    if provider == 'all':
        providers = ['launchbox', 'igdb', 'rawg', 'steamgriddb', 'steam', 'wikipedia']
    else:
        providers = [provider]

    if 'launchbox' in providers:
        if not provider_enabled(settings, 'launchbox'):
            logs.append({'provider': 'LaunchBox', 'status': 'warning', 'message': 'Provider disabled.'})
        else:
            try:
                launchbox_results = search_launchbox(query, limit=8)
                mapped = []
                for item in launchbox_results:
                    mapped.append({
                        'source': 'LaunchBox',
                        'external_id': item.get('database_id', ''),
                        'title': item.get('title', ''),
                        'cover_url': '',
                        'description': f"{item.get('platform') or 'Unknown platform'} · {item.get('release_year') or 'Unknown year'} · {item.get('genre') or 'Unknown genre'}",
                        'platform': item.get('platform', ''),
                        'confidence': item.get('confidence', 0),
                    })
                results.extend(mapped)
                logs.append({'provider': 'LaunchBox', 'status': 'ok', 'message': f'{len(mapped)} cached result(s).' if mapped else 'No cached matches. Sync LaunchBox in Settings.'})
            except Exception as e:
                logs.append({'provider': 'LaunchBox', 'status': 'error', 'message': str(e)})

    if 'igdb' in providers:
        if not provider_enabled(settings, 'igdb'):
            logs.append({'provider': 'IGDB', 'status': 'warning', 'message': 'Provider disabled.'})
        elif not settings.get('igdb_client_id') or not settings.get('igdb_client_secret'):
            logs.append({'provider': 'IGDB', 'status': 'warning', 'message': 'Client ID/secret missing in Settings.'})
        else:
            try:
                igdb_results = search_igdb(query, settings)
                results.extend(igdb_results)
                logs.append({'provider': 'IGDB', 'status': 'ok', 'message': f'{len(igdb_results)} result(s).'})
            except Exception as e:
                logs.append({'provider': 'IGDB', 'status': 'error', 'message': str(e)})

    if 'rawg' in providers:
        if not provider_enabled(settings, 'rawg'):
            logs.append({'provider': 'RAWG', 'status': 'warning', 'message': 'Provider disabled.'})
        elif not settings.get('rawg_api_key'):
            logs.append({'provider': 'RAWG', 'status': 'warning', 'message': 'API key missing in Settings.'})
        else:
            try:
                rawg_results = search_rawg(query, settings)
                results.extend(rawg_results)
                logs.append({'provider': 'RAWG', 'status': 'ok', 'message': f'{len(rawg_results)} result(s).'})
            except Exception as e:
                logs.append({'provider': 'RAWG', 'status': 'error', 'message': str(e)})

    if 'steamgriddb' in providers:
        if not provider_enabled(settings, 'steamgriddb'):
            logs.append({'provider': 'SteamGridDB', 'status': 'warning', 'message': 'Provider disabled.'})
        elif not settings.get('steamgriddb_api_key'):
            logs.append({'provider': 'SteamGridDB', 'status': 'warning', 'message': 'API key missing in Settings.'})
        else:
            try:
                sgdb_results = search_steamgriddb(query, settings)
                results.extend(sgdb_results)
                logs.append({'provider': 'SteamGridDB', 'status': 'ok', 'message': f'{len(sgdb_results)} artwork result(s).'})
            except Exception as e:
                logs.append({'provider': 'SteamGridDB', 'status': 'error', 'message': str(e)})

    if 'steam' in providers:
        if not provider_enabled(settings, 'steam'):
            logs.append({'provider': 'Steam', 'status': 'warning', 'message': 'Provider disabled.'})
        else:
            try:
                steam_results = search_steam(query)
                results.extend(steam_results)
                logs.append({'provider': 'Steam', 'status': 'ok', 'message': f'{len(steam_results)} result(s).'})
            except Exception as e:
                logs.append({'provider': 'Steam', 'status': 'error', 'message': str(e)})

    if 'wikipedia' in providers:
        if not provider_enabled(settings, 'wikipedia'):
            logs.append({'provider': 'Wikipedia', 'status': 'warning', 'message': 'Provider disabled.'})
        else:
            try:
                wiki_results = search_wikipedia(query)
                results.extend(wiki_results)
                logs.append({'provider': 'Wikipedia', 'status': 'ok', 'message': f'{len(wiki_results)} result(s).'})
            except Exception as e:
                logs.append({'provider': 'Wikipedia', 'status': 'error', 'message': str(e)})

    for item in results:
        item['confidence'] = confidence_score(query, item.get('title', ''), item.get('description', ''))

    results.sort(key=lambda x: (provider_priority(x.get('source')), x.get('confidence', 0)), reverse=True)

    return {
        'results': results[:20],
        'logs': logs,
    }


def search_metadata_diagnostics(title, provider='all'):
    if provider != 'all':
        return _search_metadata_diagnostics_serial(title, provider)

    provider_order = ['launchbox', 'igdb', 'rawg', 'steamgriddb', 'steam', 'wikipedia']
    with ThreadPoolExecutor(max_workers=4, thread_name_prefix='vaultarr-metadata') as pool:
        responses = list(pool.map(
            lambda provider_name: _search_metadata_diagnostics_serial(title, provider_name),
            provider_order,
        ))

    results = []
    logs = []
    for response in responses:
        results.extend(response.get('results') or [])
        logs.extend(response.get('logs') or [])
    results.sort(key=lambda item: (provider_priority(item.get('source')), item.get('confidence', 0)), reverse=True)
    return {'results': results[:20], 'logs': logs}


def provider_priority(source):
    return {
        'LaunchBox': 65,
        'IGDB': 60,
        'RAWG': 55,
        'SteamGridDB': 50,
        'Steam': 45,
        'Wikipedia': 35,
    }.get(source or '', 0)


def search_steam(title):
    response = requests.get(
        STEAM_SEARCH_URL,
        params={'term': clean_search_title(title), 'cc': 'us', 'l': 'english'},
        timeout=15,
        headers={'User-Agent': USER_AGENT},
    )
    response.raise_for_status()
    data = safe_json_response(response, 'Steam')
    return [
        {
            'source': 'Steam',
            'external_id': str(i.get('id', '')),
            'title': i.get('name', ''),
            'cover_url': i.get('tiny_image', ''),
            'description': 'Steam store result',
        }
        for i in data.get('items', [])[:8]
    ]


def search_rawg(title, settings):
    response = requests.get(
        RAWG_SEARCH_URL,
        params={
            'key': settings.get('rawg_api_key'),
            'search': clean_search_title(title),
            'page_size': 8,
        },
        timeout=15,
        headers={'User-Agent': USER_AGENT},
    )
    response.raise_for_status()
    data = safe_json_response(response, 'RAWG')
    results = []
    for item in data.get('results', []):
        genres = ', '.join([g.get('name', '') for g in item.get('genres', []) if g.get('name')])
        platforms = ', '.join([p.get('platform', {}).get('name', '') for p in item.get('platforms', [])[:4] if p.get('platform', {}).get('name')])
        results.append({
            'source': 'RAWG',
            'external_id': str(item.get('id', '')),
            'title': item.get('name', ''),
            'cover_url': item.get('background_image', '') or '',
            'description': f"Released {item.get('released') or 'Unknown'} · {genres or 'Unknown genre'} · {platforms or 'Unknown platform'}",
        })
    return results


def get_rawg_details(game_id):
    settings = load_provider_settings()
    if not settings.get('rawg_api_key'):
        return None
    response = requests.get(
        f'{RAWG_SEARCH_URL}/{game_id}',
        params={'key': settings.get('rawg_api_key')},
        timeout=15,
        headers={'User-Agent': USER_AGENT},
    )
    response.raise_for_status()
    d = safe_json_response(response, 'RAWG')
    developers = ', '.join([x.get('name', '') for x in d.get('developers', []) if x.get('name')])
    publishers = ', '.join([x.get('name', '') for x in d.get('publishers', []) if x.get('name')])
    genres = ', '.join([x.get('name', '') for x in d.get('genres', []) if x.get('name')])
    platforms = ', '.join([x.get('platform', {}).get('name', '') for x in d.get('platforms', [])[:6] if x.get('platform', {}).get('name')])
    released = d.get('released') or ''
    year = re.search(r'\b(19|20)\d{2}\b', released)
    return {
        'title': d.get('name', ''),
        'description': strip_html(d.get('description_raw') or d.get('description') or ''),
        'developer': developers,
        'publisher': publishers,
        'release_year': year.group(0) if year else '',
        'genre': genres,
        'platform': platforms,
        'cover_url': d.get('background_image', '') or '',
        'metadata_source': 'RAWG',
        'metadata_external_id': str(game_id),
    }


def get_igdb_token(settings):
    TOKEN_CACHE_DIR.mkdir(parents=True, exist_ok=True)
    client_id = settings.get('igdb_client_id')
    client_secret = settings.get('igdb_client_secret')
    if not client_id or not client_secret:
        return ''

    if TOKEN_CACHE_FILE.exists():
        try:
            saved = TOKEN_CACHE_FILE.read_text(encoding='utf-8').split('|')
            if len(saved) == 2 and float(saved[1]) > time.time() + 120:
                return saved[0]
        except Exception:
            pass

    response = requests.post(
        IGDB_TOKEN_URL,
        params={
            'client_id': client_id,
            'client_secret': client_secret,
            'grant_type': 'client_credentials',
        },
        timeout=15,
        headers={'User-Agent': USER_AGENT},
    )
    response.raise_for_status()
    data = safe_json_response(response, 'IGDB Auth')
    token = data.get('access_token', '')
    expires = time.time() + int(data.get('expires_in', 3600))
    if token:
        TOKEN_CACHE_FILE.write_text(f'{token}|{expires}', encoding='utf-8')
    return token


def igdb_headers(settings):
    token = get_igdb_token(settings)
    return {
        'Client-ID': settings.get('igdb_client_id', ''),
        'Authorization': f'Bearer {token}',
        'Accept': 'application/json',
        'User-Agent': USER_AGENT,
    }


def igdb_cover_url(cover):
    if not cover:
        return ''
    url = cover.get('url', '') if isinstance(cover, dict) else ''
    if not url:
        return ''
    if url.startswith('//'):
        url = 'https:' + url
    return url.replace('t_thumb', 't_cover_big').replace('t_micro', 't_cover_big')


def parse_igdb_game(item):
    involved = item.get('involved_companies', []) or []
    developers = []
    publishers = []
    for inv in involved:
        name = inv.get('company', {}).get('name', '')
        if not name:
            continue
        if inv.get('developer'):
            developers.append(name)
        if inv.get('publisher'):
            publishers.append(name)
    genres = ', '.join([g.get('name', '') for g in item.get('genres', []) if g.get('name')])
    platforms = ', '.join([p.get('name', '') for p in item.get('platforms', [])[:6] if p.get('name')])
    year = ''
    if item.get('first_release_date'):
        try:
            year = time.strftime('%Y', time.gmtime(int(item.get('first_release_date'))))
        except Exception:
            year = ''
    return {
        'title': item.get('name', ''),
        'description': item.get('summary', '') or item.get('storyline', '') or '',
        'developer': ', '.join(developers),
        'publisher': ', '.join(publishers),
        'release_year': year,
        'genre': genres,
        'platform': platforms,
        'cover_url': igdb_cover_url(item.get('cover')),
        'metadata_source': 'IGDB',
        'metadata_external_id': str(item.get('id', '')),
    }


def search_igdb(title, settings):
    body = (
        'search "' + clean_search_title(title).replace('"', '') + '"; '
        'fields name,summary,storyline,cover.url,first_release_date,genres.name,'
        'involved_companies.company.name,involved_companies.developer,involved_companies.publisher,platforms.name; '
        'limit 8;'
    )
    response = requests.post(
        IGDB_GAMES_URL,
        data=body,
        timeout=15,
        headers=igdb_headers(settings),
    )
    response.raise_for_status()
    return [dict(parse_igdb_game(item), source='IGDB', external_id=str(item.get('id', ''))) for item in safe_json_response(response, 'IGDB')]


def get_igdb_details(game_id):
    settings = load_provider_settings()
    if not settings.get('igdb_client_id') or not settings.get('igdb_client_secret'):
        return None
    body = (
        f'where id = {int(game_id)}; '
        'fields name,summary,storyline,cover.url,first_release_date,genres.name,'
        'involved_companies.company.name,involved_companies.developer,involved_companies.publisher,platforms.name; '
        'limit 1;'
    )
    response = requests.post(IGDB_GAMES_URL, data=body, timeout=15, headers=igdb_headers(settings))
    response.raise_for_status()
    items = safe_json_response(response, 'IGDB')
    if not items:
        return None
    return parse_igdb_game(items[0])


def search_steamgriddb(title, settings):
    key = settings.get('steamgriddb_api_key')
    response = requests.get(
        STEAMGRIDDB_SEARCH_URL + quote_plus(clean_search_title(title)),
        timeout=15,
        headers={'Authorization': f'Bearer {key}', 'User-Agent': USER_AGENT},
    )
    response.raise_for_status()
    data = safe_json_response(response, 'SteamGridDB')
    games = data.get('data', [])[:6]
    results = []
    for game in games:
        cover_url = ''
        try:
            grids = requests.get(
                STEAMGRIDDB_GRIDS_URL + str(game.get('id')),
                params={'dimensions': '600x900', 'mimes': 'image/png,image/jpeg,image/webp'},
                timeout=15,
                headers={'Authorization': f'Bearer {key}', 'User-Agent': USER_AGENT},
            )
            grids.raise_for_status()
            grid_data = safe_json_response(grids, 'SteamGridDB Grids').get('data', [])
            if grid_data:
                cover_url = grid_data[0].get('url', '')
        except Exception:
            cover_url = ''
        results.append({
            'source': 'SteamGridDB',
            'external_id': str(game.get('id', '')),
            'title': game.get('name', ''),
            'cover_url': cover_url,
            'description': 'Artwork-focused result from SteamGridDB.',
        })
    return results


def get_steamgriddb_details(game_id):
    settings = load_provider_settings()
    if not settings.get('steamgriddb_api_key'):
        return None
    # SteamGridDB is artwork-first. We preserve existing metadata and only apply cover/title fallback.
    cover_url = ''
    try:
        grids = requests.get(
            STEAMGRIDDB_GRIDS_URL + str(game_id),
            params={'dimensions': '600x900', 'mimes': 'image/png,image/jpeg,image/webp'},
            timeout=15,
            headers={'Authorization': f"Bearer {settings.get('steamgriddb_api_key')}", 'User-Agent': USER_AGENT},
        )
        grids.raise_for_status()
        grid_data = safe_json_response(grids, 'SteamGridDB Grids').get('data', [])
        if grid_data:
            cover_url = grid_data[0].get('url', '')
    except Exception:
        pass
    return {
        'title': '',
        'description': '',
        'developer': '',
        'publisher': '',
        'release_year': '',
        'genre': '',
        'platform': '',
        'cover_url': cover_url,
        'metadata_source': 'SteamGridDB',
        'metadata_external_id': str(game_id),
    }


def search_wikipedia(title):
    query = clean_search_title(title)
    searches = [query]
    if 'video game' not in query.lower():
        searches.append(f'{query} video game')
    seen = set()
    results = []
    for search_text in searches:
        response = requests.get(
            WIKI_SEARCH_URL,
            params={
                'action': 'query',
                'generator': 'search',
                'gsrsearch': search_text,
                'gsrlimit': 8,
                'prop': 'pageimages|extracts',
                'piprop': 'thumbnail',
                'pithumbsize': 500,
                'exintro': 1,
                'explaintext': 1,
                'format': 'json',
            },
            timeout=15,
            headers={'User-Agent': USER_AGENT},
        )
        response.raise_for_status()
        pages = safe_json_response(response, 'Wikipedia').get('query', {}).get('pages', {})
        for page in pages.values():
            page_title = page.get('title', '')
            if not page_title or page_title in seen:
                continue
            seen.add(page_title)
            results.append({
                'source': 'Wikipedia',
                'external_id': page_title,
                'title': page_title,
                'cover_url': page.get('thumbnail', {}).get('source', ''),
                'description': (page.get('extract', '') or '')[:500],
            })
    return results[:10]


def get_steam_details(appid):
    response = requests.get(
        STEAM_DETAILS_URL,
        params={'appids': appid, 'cc': 'us', 'l': 'english'},
        timeout=15,
        headers={'User-Agent': USER_AGENT},
    )
    response.raise_for_status()
    app_data = safe_json_response(response, 'Steam Details').get(str(appid), {})
    if not app_data.get('success'):
        return None
    d = app_data.get('data', {})
    release = d.get('release_date', {}).get('date', '')
    year = re.search(r'\b(19|20)\d{2}\b', release or '')
    return {
        'title': d.get('name', ''),
        'description': strip_html(d.get('short_description', '')),
        'developer': ', '.join(d.get('developers', [])),
        'publisher': ', '.join(d.get('publishers', [])),
        'release_year': year.group(0) if year else '',
        'genre': ', '.join([g.get('description', '') for g in d.get('genres', [])]),
        'platform': 'PC',
        'cover_url': d.get('header_image', ''),
        'metadata_source': 'Steam',
        'metadata_external_id': str(appid),
    }


def get_wikipedia_details(title):
    safe_title = quote_plus(title or '')
    try:
        response = requests.get(
            WIKI_REST_SUMMARY_URL + safe_title,
            timeout=15,
            headers={'User-Agent': USER_AGENT},
        )
        response.raise_for_status()
        data = safe_json_response(response, 'Wikipedia Summary')
        description = data.get('extract', '') or ''
        cover_url = data.get('thumbnail', {}).get('source', '') or data.get('originalimage', {}).get('source', '')
        year = re.search(r'\b(19|20)\d{2}\b', description)
        return {
            'title': data.get('title', title),
            'description': description,
            'developer': '',
            'publisher': '',
            'release_year': year.group(0) if year else '',
            'genre': '',
            'platform': '',
            'cover_url': cover_url,
            'metadata_source': 'Wikipedia',
            'metadata_external_id': data.get('title', title),
        }
    except Exception:
        pass
    results = search_wikipedia(title)
    if not results:
        return None
    r = results[0]
    year = re.search(r'\b(19|20)\d{2}\b', r.get('description', ''))
    return {
        'title': r['title'],
        'description': r.get('description', ''),
        'developer': '',
        'publisher': '',
        'release_year': year.group(0) if year else '',
        'genre': '',
        'platform': '',
        'cover_url': r.get('cover_url', ''),
        'metadata_source': 'Wikipedia',
        'metadata_external_id': r['external_id'],
    }


def strip_html(text):
    return re.sub(r'<[^>]+>', '', text or '').strip()


def download_cover(game_id, cover_url):
    if not cover_url:
        return ''
    COVERS_DIR.mkdir(parents=True, exist_ok=True)
    ext = '.jpg'
    lower = cover_url.lower()
    if '.png' in lower:
        ext = '.png'
    elif '.webp' in lower:
        ext = '.webp'
    filename = f'game_{game_id}{ext}'
    destination = COVERS_DIR / filename
    response = requests.get(cover_url, timeout=20, headers={'User-Agent': USER_AGENT})
    response.raise_for_status()
    destination.write_bytes(response.content)
    return filename
