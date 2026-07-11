from urllib.parse import quote_plus, quote, urlparse, unquote, urljoin
from datetime import datetime, timedelta
from difflib import SequenceMatcher
import json
import html as html_lib
import time
import os
import re
import sqlite3
import threading
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
import requests


MANUAL_PROVIDERS = [
    {
        "id": "videogamemanual",
        "name": "VideoGameManual.com",
        "kind": "indexed_pdf_provider",
        "description": "Searches cached platform indexes from VideoGameManual.com and returns real PDF links only.",
        "search_template": "https://www.videogamemanual.com/{platform}/index.html",
        "homepage": "https://www.videogamemanual.com/",
        "priority": 1,
    },
    {
        "id": "vimm",
        "name": "Vimm's Lair Manual Project",
        "kind": "live_search_provider",
        "description": "Searches Vimm's Manual Project live and returns downloadable PDF records without caching the full site.",
        "search_template": "https://vimm.net/manual/?p=list&system={platform}&q={query}",
        "homepage": "https://vimm.net/?p=manual",
        "priority": 2,
    },
    {
        "id": "local",
        "name": "Local Manual Library",
        "kind": "local",
        "description": "Vaultarr local scan results and user-linked manuals.",
        "search_template": "",
        "homepage": "",
        "priority": 3,
    },
]

APP_DIR = Path(os.getenv('LOCALAPPDATA', '.')) / 'Vaultarr'
MANUALS_DIR = APP_DIR / 'manuals'
MANUAL_CACHE_DIR = APP_DIR / 'manual_provider_cache'
VGM_CACHE_FILE = MANUAL_CACHE_DIR / 'videogamemanual_index.json'
VIMM_CACHE_FILE = MANUAL_CACHE_DIR / 'vimm_manual_index.json'
PDF_MAGIC = b'%PDF-'
MANUAL_CATALOG_DB = MANUAL_CACHE_DIR / 'manual_catalog.sqlite3'
CATALOG_MAX_AGE_HOURS = 168
_CATALOG_REFRESH_LOCK = threading.Lock()
_CATALOG_REFRESH_THREAD = None

_PLATFORM_FOLDER_ALIASES = {
    "ps2": "PS2",
    "playstation 2": "PS2",
    "sony playstation 2": "PS2",
    "xbox": "Xbox",
    "microsoft xbox": "Xbox",
    "pc": "PC",
    "windows": "PC",
    "microsoft windows": "PC",
    "pc microsoft windows": "PC",
    "gamecube": "GameCube",
    "nintendo gamecube": "GameCube",
    "dreamcast": "Dreamcast",
    "ps1": "PS1",
    "playstation": "PS1",
    "sony playstation": "PS1",
    "gba": "GBA",
    "game boy advance": "GBA",
    "gameboy advance": "GBA",
    "gbc": "GBC",
    "game boy color": "GBC",
    "gameboy color": "GBC",
    "gb": "GB",
    "game boy": "GB",
    "gameboy": "GB",
    "nes": "NES",
    "snes": "SNES",
    "super nintendo": "SNES",
    "n64": "N64",
    "nintendo 64": "N64",
    "genesis": "Genesis",
    "sega genesis": "Genesis",
    "mega drive": "Genesis",
    "saturn": "Saturn",
    "sega saturn": "Saturn",
}

_COMMON_PLATFORM_FOLDERS = ['PC', 'PS2', 'Xbox', 'PS1', 'GameCube', 'Dreamcast']
_LETTER_PAGES = ['index.html', '0.htm', '1.htm'] + [f'{chr(code)}.htm' for code in range(ord('A'), ord('Z') + 1)]
_MANUAL_URL_CACHE = {}

_VIMM_SYSTEMS = [
    'Atari 2600', 'Atari 5200', 'Atari 7800', 'ColecoVision',
    'NES', 'Super Nintendo', 'Nintendo 64', 'GameCube', 'Wii',
    'Game Boy', 'Game Boy Color', 'Game Boy Advance', 'Nintendo DS',
    'Genesis', 'Sega CD', 'Saturn', 'Dreamcast',
    'PlayStation', 'PlayStation 2', 'PlayStation 3', 'PSP',
    'Xbox', 'Xbox 360'
]

_VIMM_SYSTEM_ALIASES = {
    'PC': [], 'PS1': ['PlayStation'], 'PS2': ['PlayStation 2'],
    'PS3': ['PlayStation 3'], 'PSP': ['PSP'], 'Xbox': ['Xbox'],
    'Xbox360': ['Xbox 360'], 'GameCube': ['GameCube'],
    'Dreamcast': ['Dreamcast'], 'GBA': ['Game Boy Advance'],
    'GBC': ['Game Boy Color'], 'GB': ['Game Boy'], 'NES': ['NES'],
    'SNES': ['Super Nintendo'], 'N64': ['Nintendo 64'],
    'Genesis': ['Genesis'], 'Saturn': ['Saturn'], 'Wii': ['Wii']
}


# Known platform folders are fallbacks only. The catalog builder also discovers
# platform indexes from the provider homepage so it can expand without a code update.
_VGM_KNOWN_PLATFORM_FOLDERS = [
    '3DO', 'Atari2600', 'Atari5200', 'Atari7800', 'AtariJaguar', 'ColecoVision',
    'Dreamcast', 'GB', 'GBA', 'GBC', 'GameCube', 'Genesis', 'Intellivision',
    'N64', 'NES', 'NeoGeo', 'PC', 'PS1', 'PS2', 'PS3', 'PSP', 'Saturn', 'SegaCD',
    'SNES', 'TurboGrafx16', 'Wii', 'WiiU', 'Xbox', 'Xbox360'
]


def _catalog_connection():
    MANUAL_CACHE_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(MANUAL_CATALOG_DB, timeout=30)
    conn.row_factory = sqlite3.Row
    conn.execute('PRAGMA journal_mode=WAL')
    conn.execute('PRAGMA synchronous=NORMAL')
    conn.executescript('''
        CREATE TABLE IF NOT EXISTS manual_entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            provider_id TEXT NOT NULL,
            provider_name TEXT NOT NULL,
            title TEXT NOT NULL,
            normalized_title TEXT NOT NULL,
            platform TEXT DEFAULT '',
            region TEXT DEFAULT '',
            variant TEXT DEFAULT '',
            manual_url TEXT NOT NULL,
            source_page_url TEXT DEFAULT '',
            verified_pdf INTEGER DEFAULT 0,
            first_seen_at TEXT DEFAULT CURRENT_TIMESTAMP,
            last_seen_at TEXT DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(provider_id, manual_url)
        );
        CREATE INDEX IF NOT EXISTS idx_manual_title ON manual_entries(normalized_title);
        CREATE INDEX IF NOT EXISTS idx_manual_platform ON manual_entries(platform);
        CREATE INDEX IF NOT EXISTS idx_manual_provider ON manual_entries(provider_id);
        CREATE TABLE IF NOT EXISTS manual_provider_state (
            provider_id TEXT PRIMARY KEY,
            provider_name TEXT NOT NULL,
            status TEXT DEFAULT 'never',
            entry_count INTEGER DEFAULT 0,
            pages_checked INTEGER DEFAULT 0,
            last_refresh TEXT DEFAULT '',
            last_error TEXT DEFAULT ''
        );
        CREATE TABLE IF NOT EXISTS manual_refresh_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            provider_id TEXT NOT NULL,
            started_at TEXT NOT NULL,
            finished_at TEXT DEFAULT '',
            status TEXT DEFAULT 'running',
            entries_found INTEGER DEFAULT 0,
            pages_checked INTEGER DEFAULT 0,
            message TEXT DEFAULT ''
        );
    ''')
    return conn


def _catalog_upsert_entries(provider_id, provider_name, entries):
    now = datetime.utcnow().isoformat(timespec='seconds') + 'Z'
    conn = _catalog_connection()
    with conn:
        for entry in entries:
            url = (entry.get('url') or entry.get('manual_url') or '').strip()
            title = _clean_title(entry.get('title') or '')
            if not url or not title:
                continue
            conn.execute('''
                INSERT INTO manual_entries (
                    provider_id, provider_name, title, normalized_title, platform,
                    region, variant, manual_url, source_page_url, verified_pdf,
                    first_seen_at, last_seen_at
                ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
                ON CONFLICT(provider_id, manual_url) DO UPDATE SET
                    provider_name=excluded.provider_name,
                    title=excluded.title,
                    normalized_title=excluded.normalized_title,
                    platform=excluded.platform,
                    region=excluded.region,
                    variant=excluded.variant,
                    source_page_url=excluded.source_page_url,
                    verified_pdf=excluded.verified_pdf,
                    last_seen_at=excluded.last_seen_at
            ''', (
                provider_id, provider_name, title,
                entry.get('match_title') or _normalize_match_text(title),
                entry.get('platform_folder') or entry.get('platform') or '',
                entry.get('region') or '', entry.get('variant') or '', url,
                entry.get('source_page_url') or '', 1 if urlparse(url).path.lower().endswith('.pdf') else 0,
                now, now,
            ))
    conn.close()


def _catalog_provider_state(provider_id, provider_name, status, entry_count=0, pages_checked=0, error=''):
    now = datetime.utcnow().isoformat(timespec='seconds') + 'Z'
    conn = _catalog_connection()
    with conn:
        conn.execute('''
            INSERT INTO manual_provider_state(provider_id, provider_name, status, entry_count, pages_checked, last_refresh, last_error)
            VALUES (?,?,?,?,?,?,?)
            ON CONFLICT(provider_id) DO UPDATE SET
                provider_name=excluded.provider_name,
                status=excluded.status,
                entry_count=excluded.entry_count,
                pages_checked=excluded.pages_checked,
                last_refresh=excluded.last_refresh,
                last_error=excluded.last_error
        ''', (provider_id, provider_name, status, entry_count, pages_checked, now, error[:500]))
    conn.close()


def manual_catalog_status():
    conn = _catalog_connection()
    total = conn.execute('SELECT COUNT(*) FROM manual_entries').fetchone()[0]
    providers = [dict(row) for row in conn.execute('SELECT * FROM manual_provider_state ORDER BY provider_id').fetchall()]
    platform_count = conn.execute("SELECT COUNT(DISTINCT platform) FROM manual_entries WHERE platform <> ''").fetchone()[0]
    latest = conn.execute("SELECT MAX(last_refresh) FROM manual_provider_state").fetchone()[0] or ''
    conn.close()
    stale = True
    if latest:
        try:
            stale = datetime.utcnow() - datetime.fromisoformat(latest.replace('Z','')) >= timedelta(hours=CATALOG_MAX_AGE_HOURS)
        except Exception:
            stale = True
    return {
        'database_path': str(MANUAL_CATALOG_DB),
        'exists': MANUAL_CATALOG_DB.exists(),
        'entries': int(total),
        'platforms': int(platform_count),
        'last_refresh': latest,
        'stale': stale,
        'refreshing': bool(_CATALOG_REFRESH_THREAD and _CATALOG_REFRESH_THREAD.is_alive()),
        'providers': providers,
    }


def clear_manual_catalog():
    conn = _catalog_connection()
    with conn:
        conn.execute('DELETE FROM manual_entries')
        conn.execute('DELETE FROM manual_provider_state')
        conn.execute('DELETE FROM manual_refresh_history')
    conn.close()
    return manual_catalog_status()


def _discover_vgm_platform_folders():
    folders = []
    try:
        html = _fetch_text('https://www.videogamemanual.com/')
        for href in re.findall(r'href=["\']([^"\']+)["\']', html or '', flags=re.I):
            parsed = urlparse(urljoin('https://www.videogamemanual.com/', href))
            if parsed.netloc.lower() != 'www.videogamemanual.com':
                continue
            parts = [unquote(part) for part in parsed.path.split('/') if part]
            if not parts:
                continue
            folder = parts[0]
            if folder.lower() in ('images','css','js','manuals') or '.' in folder:
                continue
            if folder not in folders:
                folders.append(folder)
    except Exception:
        pass
    for folder in _VGM_KNOWN_PLATFORM_FOLDERS:
        if folder not in folders:
            folders.append(folder)
    return folders


def sync_manual_catalog(force=False, provider_id='all'):
    if not _CATALOG_REFRESH_LOCK.acquire(blocking=False):
        return {'success': False, 'message': 'A manual catalog refresh is already running.', **manual_catalog_status()}
    started = datetime.utcnow().isoformat(timespec='seconds') + 'Z'
    summary = {'success': True, 'started_at': started, 'providers': {}, 'errors': []}
    try:
        if provider_id in ('all', 'videogamemanual'):
            found, pages, errors = [], 0, []
            for folder in _discover_vgm_platform_folders():
                try:
                    entries = _sync_videogamemanual_platform(folder, force=force)
                    found.extend(entries)
                    cache = _load_vgm_cache().get('platforms', {}).get(folder, {})
                    pages += int(cache.get('pages_checked') or 0)
                except Exception as exc:
                    errors.append(f'{folder}: {exc}')
            _catalog_upsert_entries('videogamemanual', 'VideoGameManual.com', found)
            conn = _catalog_connection()
            count = conn.execute("SELECT COUNT(*) FROM manual_entries WHERE provider_id='videogamemanual'").fetchone()[0]
            conn.close()
            _catalog_provider_state('videogamemanual', 'VideoGameManual.com', 'ready' if count else 'empty', count, pages, '; '.join(errors[-5:]))
            summary['providers']['videogamemanual'] = {'entries': count, 'pages_checked': pages, 'errors': errors[-5:]}
        if provider_id in ('all', 'vimm'):
            # Vimm is intentionally searched live. It does not need or expose a
            # complete local index, so refresh only records provider readiness.
            _catalog_provider_state('vimm', "Vimm's Lair Manual Project", 'live_search', 0, 0, '')
            summary['providers']['vimm'] = {'entries': 0, 'pages_checked': 0, 'errors': [], 'mode': 'live_search'}
        summary.update(manual_catalog_status())
        return summary
    finally:
        _CATALOG_REFRESH_LOCK.release()


def _background_refresh(force=False):
    global _CATALOG_REFRESH_THREAD
    def runner():
        try:
            sync_manual_catalog(force=force)
        except Exception:
            pass
    if _CATALOG_REFRESH_THREAD and _CATALOG_REFRESH_THREAD.is_alive():
        return False
    _CATALOG_REFRESH_THREAD = threading.Thread(target=runner, name='vaultarr-manual-catalog', daemon=True)
    _CATALOG_REFRESH_THREAD.start()
    return True


def ensure_manual_catalog():
    status = manual_catalog_status()
    if status['entries'] == 0:
        # The first manual search performs a real initial catalog build so the
        # requested title can be searched immediately.
        sync_manual_catalog(force=False)
        return manual_catalog_status()
    if status['stale']:
        _background_refresh(force=False)
    return status


def _token_score(query_norm, candidate_norm):
    q = set(query_norm.split())
    c = set(candidate_norm.split())
    if not q or not c:
        return 0.0
    overlap = len(q & c) / max(1, len(q | c))
    containment = len(q & c) / max(1, len(q))
    sequence = SequenceMatcher(None, query_norm, candidate_norm).ratio()
    return (sequence * 0.50) + (containment * 0.35) + (overlap * 0.15)


def search_manual_catalog(title, platform='', provider_id='all', limit=30):
    ensure_manual_catalog()
    query_norm = _normalize_match_text(title)
    if not query_norm:
        return []
    conn = _catalog_connection()
    sql = 'SELECT * FROM manual_entries'
    params = []
    if provider_id and provider_id != 'all':
        sql += ' WHERE provider_id=?'
        params.append(provider_id)
    rows = [dict(row) for row in conn.execute(sql, params).fetchall()]
    conn.close()
    preferred = set(_platform_folders(platform)) if platform else set()
    results = []
    for row in rows:
        candidate_norm = row.get('normalized_title') or _normalize_match_text(row.get('title') or '')
        base = _token_score(query_norm, candidate_norm)
        exact = query_norm == candidate_norm
        contains = query_norm in candidate_norm or candidate_norm in query_norm
        platform_match = bool(preferred and row.get('platform') in preferred)
        score = base
        if exact:
            score += 0.22
        elif contains:
            score += 0.10
        # Platform is intentionally a modest ranking bonus, never a filter.
        if platform_match:
            score += 0.07
        if row.get('region') == 'USA':
            score += 0.02
        confidence = max(1, min(100, int(round(score * 100))))
        if confidence < 48:
            continue
        results.append({
            'provider': row.get('provider_name'),
            'provider_id': row.get('provider_id'),
            'kind': 'direct_pdf' if row.get('verified_pdf') else 'source_search',
            'title': row.get('title'),
            'description': ('Same-platform catalog match.' if platform_match else 'Catalog match from an alternate platform or edition.'),
            'url': row.get('manual_url'),
            'source_page_url': row.get('source_page_url'),
            'action': 'Open PDF' if row.get('verified_pdf') else 'Open Source',
            'confidence': confidence,
            'is_pdf_candidate': bool(row.get('verified_pdf')),
            'can_download': bool(row.get('verified_pdf')),
            'region': row.get('region') or 'Unknown',
            'platform_folder': row.get('platform') or 'Unknown',
            'platform_match': platform_match,
            'cross_platform': bool(platform and not platform_match),
            'verified_pdf': bool(row.get('verified_pdf')),
            'indexed_provider': True,
        })
    results.sort(key=lambda item: (
        int(item.get('confidence') or 0),
        1 if item.get('platform_match') else 0,
        1 if item.get('verified_pdf') else 0,
    ), reverse=True)
    return _dedupe_manual_results(results)[:max(1, min(int(limit or 30), 100))]


def _clean_title(title):
    title = re.sub(r'\s+', ' ', title or '').strip()
    title = re.sub(r'\bmanual\b|\bpdf\b', '', title, flags=re.I).strip()
    return re.sub(r'\s+', ' ', title).strip(' ,-')


def _strip_region(value):
    return re.sub(r'\s*\((usa|us|u|europe|eur|eu|japan|jp|world|en|fr|de|es|it|nl|pt|manual)\)\s*', ' ', value or '', flags=re.I)


def _normalize_match_text(value):
    value = unquote(value or '')
    value = value.rsplit('.', 1)[0]
    value = _strip_region(value)
    value = re.sub(r'[_+\-]+', ' ', value)
    value = re.sub(r'[^a-z0-9]+', ' ', value.lower())
    value = re.sub(r'\b(the|a|an|game|manual|instruction|booklet)\b', ' ', value)
    return re.sub(r'\s+', ' ', value).strip()


def _display_title_from_pdf(url, anchor_text=''):
    text = unquote(anchor_text or '').strip()
    if not text or text.lower() in ('download', 'pdf', 'manual'):
        text = unquote(urlparse(url).path.split('/')[-1])
    text = re.sub(r'\.pdf$', '', text, flags=re.I)
    text = re.sub(r'[_]+', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text or 'Manual'


def normalize_query(title, platform=""):
    title = _clean_title(title)
    parts = [title]
    if platform:
        parts.append(platform)
    return " ".join(part for part in parts if part).strip()


def _split_platform_tokens(platform=''):
    text = (platform or '').strip()
    if not text:
        return []
    parts = re.split(r'[,;/|]+|\band\b', text, flags=re.I)
    tokens = []
    for part in parts:
        value = re.sub(r'\([^)]*\)', ' ', part).strip().lower()
        value = re.sub(r'[^a-z0-9]+', ' ', value).strip()
        if value:
            tokens.append(value)
    return tokens


def _platform_folders(platform=''):
    tokens = _split_platform_tokens(platform)
    folders = []
    for token in tokens:
        folder = _PLATFORM_FOLDER_ALIASES.get(token)
        if folder and folder not in folders:
            folders.append(folder)

    lowered = ' '.join(tokens)
    if not folders:
        checks = [
            (r'\bps2\b|\bplaystation\s*2\b', 'PS2'),
            (r'\bxbox\b', 'Xbox'),
            (r'\bpc\b|\bwindows\b', 'PC'),
            (r'\bgamecube\b', 'GameCube'),
            (r'\bdreamcast\b', 'Dreamcast'),
            (r'\bps1\b|\bplaystation\b', 'PS1'),
        ]
        for pattern, folder in checks:
            if folder == 'PS1' and re.search(r'\bplaystation\s*2\b', lowered):
                continue
            if re.search(pattern, lowered) and folder not in folders:
                folders.append(folder)

    if not folders:
        folders = list(_COMMON_PLATFORM_FOLDERS)
    return folders[:6]


def _load_vgm_cache():
    try:
        if VGM_CACHE_FILE.exists():
            return json.loads(VGM_CACHE_FILE.read_text(encoding='utf-8'))
    except Exception:
        pass
    return {"version": 1, "platforms": {}}


def _save_vgm_cache(cache):
    MANUAL_CACHE_DIR.mkdir(parents=True, exist_ok=True)
    cache["saved_at"] = datetime.utcnow().isoformat(timespec='seconds') + 'Z'
    VGM_CACHE_FILE.write_text(json.dumps(cache, indent=2, sort_keys=True), encoding='utf-8')


def _cache_is_fresh(platform_data, max_age_hours=168):
    synced = platform_data.get('synced_at') if platform_data else ''
    if not synced:
        return False
    try:
        synced_dt = datetime.fromisoformat(synced.replace('Z', ''))
        return datetime.utcnow() - synced_dt < timedelta(hours=max_age_hours)
    except Exception:
        return False


def _fetch_text(url):
    headers = {
        'User-Agent': 'Vaultarr/1.2.1 Manual Catalog (+self-hosted archive manager)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    }
    response = requests.get(url, headers=headers, timeout=15, allow_redirects=True)
    if response.status_code >= 400:
        return ''
    response.encoding = response.encoding or 'utf-8'
    return response.text or ''


def _extract_pdf_links(html, base_url, platform_folder):
    if not html:
        return []
    links = []
    # Match normal anchors and tolerate very old generated HTML.
    anchor_re = re.compile(r'<a\s+[^>]*href=["\']([^"\']+\.pdf(?:\?[^"\']*)?)["\'][^>]*>(.*?)</a>', re.I | re.S)
    for href, label in anchor_re.findall(html):
        url = urljoin(base_url, href)
        if urlparse(url).scheme not in ('http', 'https'):
            continue
        label = re.sub(r'<[^>]+>', ' ', label)
        label = re.sub(r'\s+', ' ', label).strip()
        display = _display_title_from_pdf(url, label)
        links.append({
            'title': display,
            'match_title': _normalize_match_text(display),
            'url': url,
            'source_page_url': base_url,
            'platform_folder': platform_folder,
            'region': _region_from_text(display),
        })
    return links


def _region_from_text(value):
    text = (value or '').lower()
    if re.search(r'\((usa|us)\)', text):
        return 'USA'
    if re.search(r'\(u\)', text):
        return 'U'
    if re.search(r'\((europe|eur|eu)\)', text):
        return 'Europe'
    if re.search(r'\((japan|jp)\)', text):
        return 'Japan'
    return ''


def _sync_videogamemanual_platform(platform_folder, force=False):
    platform_folder = platform_folder.strip('/ ')
    cache = _load_vgm_cache()
    platforms = cache.setdefault('platforms', {})
    existing = platforms.get(platform_folder, {})
    if not force and _cache_is_fresh(existing):
        return existing.get('entries', [])

    base = f'https://www.videogamemanual.com/{quote(platform_folder)}/'
    entries_by_url = {}
    errors = []
    pages_checked = 0

    for page in _LETTER_PAGES:
        page_url = urljoin(base, page)
        try:
            html = _fetch_text(page_url)
        except Exception as exc:
            errors.append(f'{page}: {exc}')
            continue
        if not html:
            continue
        pages_checked += 1
        for entry in _extract_pdf_links(html, page_url, platform_folder):
            entries_by_url[entry['url'].lower()] = entry

    # Some platform root pages list PDFs directly.
    try:
        root_html = _fetch_text(base)
        for entry in _extract_pdf_links(root_html, base, platform_folder):
            entries_by_url[entry['url'].lower()] = entry
    except Exception as exc:
        errors.append(f'root: {exc}')

    entries = sorted(entries_by_url.values(), key=lambda item: (item.get('match_title') or '', item.get('url') or ''))
    platforms[platform_folder] = {
        'synced_at': datetime.utcnow().isoformat(timespec='seconds') + 'Z',
        'homepage': base,
        'pages_checked': pages_checked,
        'entry_count': len(entries),
        'errors': errors[-5:],
        'entries': entries,
    }
    _save_vgm_cache(cache)
    return entries



def _load_json_cache(path, default):
    try:
        if path.exists():
            return json.loads(path.read_text(encoding='utf-8'))
    except Exception:
        pass
    return default


def _save_json_cache(path, payload):
    MANUAL_CACHE_DIR.mkdir(parents=True, exist_ok=True)
    payload['saved_at'] = datetime.utcnow().isoformat(timespec='seconds') + 'Z'
    path.write_text(json.dumps(payload, indent=2, sort_keys=True), encoding='utf-8')


def _same_host(url, host):
    try:
        return urlparse(url).netloc.lower().split(':')[0] == host.lower()
    except Exception:
        return False


def _extract_vimm_links(html, base_url):
    """Extract only links that appear to belong to Vimm's Manual Project.

    Vimm does not publish a documented API. This parser deliberately stays
    conservative: it only follows same-host links whose URL or nearby label
    contains 'manual', and it never follows Vault/download-ROM routes.
    """
    if not html:
        return [], []
    pages, entries = [], []
    anchor_re = re.compile(r'<a\s+[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', re.I | re.S)
    blocked = ('?p=vault', '/vault/', '?p=download', 'rom', 'iso')
    for href, label_html in anchor_re.findall(html):
        url = urljoin(base_url, href)
        if not _same_host(url, 'vimm.net'):
            continue
        lowered_url = url.lower()
        if any(token in lowered_url for token in blocked):
            continue
        label = re.sub(r'<[^>]+>', ' ', label_html)
        label = re.sub(r'\s+', ' ', label).strip()
        context = f'{lowered_url} {label.lower()}'
        parsed = urlparse(url)
        is_pdf = parsed.path.lower().endswith('.pdf')
        if not is_pdf and 'manual' not in context:
            continue
        if is_pdf:
            title = _display_title_from_pdf(url, label)
            entries.append({
                'title': title,
                'match_title': _normalize_match_text(title),
                'url': url,
                'source_page_url': base_url,
                'platform_folder': '',
                'region': _region_from_text(title),
            })
        else:
            pages.append(url)
    return list(dict.fromkeys(pages)), entries


def _sync_vimm_catalog(force=False):
    cache = _load_json_cache(VIMM_CACHE_FILE, {'version': 1, 'entries': []})
    if not force and _cache_is_fresh(cache):
        return cache.get('entries', [])

    start_url = 'https://vimm.net/?p=manual'
    queue = [start_url]
    visited = set()
    entries_by_url = {}
    errors = []

    # Keep the crawl intentionally small and respectful. The provider remains
    # useful as a source-page fallback even when no direct PDF links are exposed.
    while queue and len(visited) < 24:
        page_url = queue.pop(0)
        if page_url in visited:
            continue
        visited.add(page_url)
        try:
            html = _fetch_text(page_url)
        except Exception as exc:
            errors.append(f'{page_url}: {exc}')
            continue
        pages, entries = _extract_vimm_links(html, page_url)
        for entry in entries:
            entries_by_url[entry['url'].lower()] = entry
        for candidate in pages:
            if candidate not in visited and candidate not in queue:
                queue.append(candidate)

    entries = sorted(entries_by_url.values(), key=lambda item: (item.get('match_title') or '', item.get('url') or ''))
    payload = {
        'version': 1,
        'synced_at': datetime.utcnow().isoformat(timespec='seconds') + 'Z',
        'homepage': start_url,
        'pages_checked': len(visited),
        'entry_count': len(entries),
        'errors': errors[-5:],
        'entries': entries,
    }
    _save_json_cache(VIMM_CACHE_FILE, payload)
    return entries


def _vimm_candidates(title, platform=''):
    try:
        entries = _sync_vimm_catalog()
    except Exception:
        entries = []
    folders = _platform_folders(platform)
    candidates = []
    for entry in entries:
        confidence = _score_manual_entry(entry, title, folders)
        if confidence < 62:
            continue
        candidates.append({
            'provider': "Vimm's Lair Manual Project",
            'provider_id': 'vimm',
            'kind': 'direct_pdf',
            'title': entry.get('title') or 'Manual',
            'description': "Manual discovered inside Vimm's dedicated Manual Project. Vaultarr will validate the PDF before saving it.",
            'url': entry.get('url'),
            'source_page_url': entry.get('source_page_url') or 'https://vimm.net/?p=manual',
            'action': 'Open PDF',
            'confidence': confidence,
            'is_pdf_candidate': True,
            'can_download': True,
            'region': entry.get('region') or 'Unknown',
            'platform_folder': entry.get('platform_folder') or '',
            'verified_pdf': True,
            'indexed_provider': True,
        })
    return _dedupe_manual_results(candidates)[:8]

def _vimm_system_order(platform=''):
    preferred = []
    for folder in _platform_folders(platform):
        preferred.extend(_VIMM_SYSTEM_ALIASES.get(folder, []))
    ordered = []
    for system in preferred + _VIMM_SYSTEMS:
        if system and system not in ordered:
            ordered.append(system)
    return ordered


def _extract_vimm_search_results(page_html, system):
    """Parse both known Vimm manual-result URL formats.

    Vimm has used clean links such as /manual/355 and query-string links such
    as /manual/?p=details&id=355. Supporting both prevents an empty result set
    when the site returns a different template.
    """
    if not page_html:
        return []
    results = []
    patterns = (
        re.compile(r'<a\s+[^>]*href=["\'](?:https?://vimm\.net)?/manual/(\d+)/?["\'][^>]*>(.*?)</a>', re.I | re.S),
        re.compile(r'<a\s+[^>]*href=["\'](?:https?://vimm\.net)?/manual/\?[^"\']*?(?:p=details&amp;|p=details&)[^"\']*?id=(\d+)[^"\']*["\'][^>]*>(.*?)</a>', re.I | re.S),
    )
    seen = set()
    for pattern in patterns:
        for manual_id, label_html in pattern.findall(page_html):
            if manual_id in seen:
                continue
            label = html_lib.unescape(re.sub(r'<[^>]+>', ' ', label_html))
            title = _clean_title(re.sub(r'\s+', ' ', label).strip())
            if not title:
                continue
            seen.add(manual_id)
            detail_url = f'https://vimm.net/manual/{manual_id}'
            pdf_url = f'https://dl.vimm.net/download/?manualId={manual_id}&category=pdf&destDPI=200'
            results.append({
                'manual_id': manual_id,
                'title': title,
                'match_title': _normalize_match_text(title),
                'platform_folder': system,
                'region': _region_from_text(title),
                'url': pdf_url,
                'source_page_url': detail_url,
            })
    return results


def _search_vimm_system(title, system):
    # Vimm serves different/empty responses to obvious application user agents.
    # Match a normal browser navigation and retain the harmless visit cookie
    # observed in the confirmed browser request.
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://vimm.net/',
        'Cache-Control': 'no-cache',
    }
    session = requests.Session()
    session.cookies.set('counted', '1', domain='vimm.net', path='/')
    response = session.get(
        'https://vimm.net/manual/',
        params={'p': 'list', 'system': system, 'q': title},
        headers=headers,
        timeout=20,
        allow_redirects=True,
    )
    response.raise_for_status()
    content_type = (response.headers.get('Content-Type') or '').lower()
    if 'html' not in content_type and response.text.lstrip().lower().startswith(('<!doctype', '<html')) is False:
        return []
    return _extract_vimm_search_results(response.text or '', system)


def _vimm_live_candidates(title, platform='', limit=16):
    search_title = _clean_title(title)
    if not search_title:
        return []
    systems = _vimm_system_order(platform)
    preferred = set()
    for folder in _platform_folders(platform):
        preferred.update(_VIMM_SYSTEM_ALIASES.get(folder, []))
    entries = []
    # Keep concurrency low: this is a user-triggered search, not a crawler.
    with ThreadPoolExecutor(max_workers=2, thread_name_prefix='vaultarr-vimm') as pool:
        futures = {pool.submit(_search_vimm_system, search_title, system): system for system in systems}
        for future in as_completed(futures):
            try:
                entries.extend(future.result())
            except Exception:
                continue
    candidates = []
    for entry in entries:
        query_norm = _normalize_match_text(search_title)
        entry_norm = entry.get('match_title') or _normalize_match_text(entry.get('title') or '')
        score = _token_score(query_norm, entry_norm)
        if query_norm == entry_norm:
            score += 0.22
        elif query_norm in entry_norm or entry_norm in query_norm:
            score += 0.10
        platform_match = entry.get('platform_folder') in preferred
        if platform_match:
            score += 0.07
        confidence = max(1, min(100, int(round(score * 100))))
        if confidence < 48:
            continue
        candidates.append({
            'provider': "Vimm's Lair Manual Project",
            'provider_id': 'vimm',
            'kind': 'vimm_pdf',
            'title': entry.get('title') or 'Manual',
            'description': ('Same-platform live result.' if platform_match else 'Live result from an alternate platform or edition.'),
            'url': entry.get('url'),
            'source_page_url': entry.get('source_page_url'),
            'action': 'Open Details',
            'confidence': confidence,
            'is_pdf_candidate': True,
            'can_download': True,
            'region': entry.get('region') or 'Unknown',
            'platform_folder': entry.get('platform_folder') or 'Unknown',
            'platform_match': platform_match,
            'cross_platform': bool(platform and not platform_match),
            'verified_pdf': True,
            'indexed_provider': False,
            'live_provider': True,
            'manual_id': entry.get('manual_id'),
        })
    candidates.sort(key=lambda item: (item['confidence'], 1 if item['platform_match'] else 0), reverse=True)
    return _dedupe_manual_results(candidates)[:max(1, min(int(limit or 16), 36))]


def _manual_key(result):
    url = (result.get('url') or '').lower()
    url = re.sub(r'(%20|\+)+', ' ', url)
    url = url.replace('%28usa%29', '(usa)').replace('%28us%29', '(us)').replace('%28u%29', '(u)')
    return url or (result.get('title') or '').lower().strip()


def _dedupe_manual_results(results):
    seen = {}
    for result in results:
        key = _manual_key(result)
        current = seen.get(key)
        if current is None or int(result.get('confidence') or 0) > int(current.get('confidence') or 0):
            seen[key] = result
    return sorted(seen.values(), key=lambda item: (int(item.get('confidence') or 0), item.get('verified_pdf', False)), reverse=True)


def _score_manual_entry(entry, title, preferred_platforms):
    query_norm = _normalize_match_text(title)
    entry_norm = entry.get('match_title') or _normalize_match_text(entry.get('title') or '')
    if not query_norm or not entry_norm:
        return 0
    ratio = SequenceMatcher(None, query_norm, entry_norm).ratio()
    contains_bonus = 0.10 if query_norm in entry_norm or entry_norm in query_norm else 0
    platform_bonus = 0.10 if entry.get('platform_folder') in preferred_platforms else 0
    region_bonus = 0.05 if entry.get('region') == 'USA' else 0
    score = int(round(min(1.0, ratio + contains_bonus + platform_bonus + region_bonus) * 100))
    return score


def _videogamemanual_candidates(title, platform=''):
    candidates = []
    folders = _platform_folders(platform)
    for folder in folders:
        try:
            entries = _sync_videogamemanual_platform(folder)
        except Exception:
            entries = []
        for entry in entries:
            confidence = _score_manual_entry(entry, title, folders)
            if confidence < 62:
                continue
            candidates.append({
                'provider': 'VideoGameManual.com',
                'provider_id': 'videogamemanual',
                'kind': 'direct_pdf',
                'title': f"{entry.get('title') or 'Manual'} — {entry.get('platform_folder') or folder}",
                'description': 'Real PDF discovered from the VideoGameManual.com platform index. Downloading will verify and save it into Vaultarr.',
                'url': entry.get('url'),
                'source_page_url': entry.get('source_page_url') or f'https://www.videogamemanual.com/{quote(folder)}/',
                'action': 'Open PDF',
                'confidence': confidence,
                'is_pdf_candidate': True,
                'can_download': True,
                'region': entry.get('region') or 'Unknown',
                'platform_folder': entry.get('platform_folder') or folder,
                'verified_pdf': True,
                'indexed_provider': True,
            })

    return _dedupe_manual_results(candidates)[:8]


def manual_search_results(title, platform="", provider_id="all"):
    search_title = _clean_title(title)
    query = normalize_query(search_title, platform)
    results = []

    if provider_id in ('', 'all', 'videogamemanual'):
        results.extend(search_manual_catalog(search_title, platform, 'videogamemanual', limit=36))

    if provider_id in ('', 'all', 'vimm'):
        results.extend(_vimm_live_candidates(search_title, platform, limit=18))

    results = _dedupe_manual_results(results)
    if not results:
        selected = MANUAL_PROVIDERS if provider_id in ('', 'all') else [p for p in MANUAL_PROVIDERS if p['id'] == provider_id]
        for provider in selected:
            if provider['id'] == 'local':
                continue
            results.append({
                'provider': provider['name'], 'provider_id': provider['id'], 'kind': 'source_search',
                'title': f"Browse {provider['name']}",
                'description': 'No strong match was found. Open the provider archive and try a broader title.',
                'url': provider['homepage'], 'source_page_url': provider['homepage'],
                'action': 'Open Manual Archive', 'confidence': 40,
                'is_pdf_candidate': False, 'can_download': False,
                'platform_folder': '', 'platform_match': False, 'cross_platform': False,
            })

    return {
        'query': query,
        'checked_at': datetime.utcnow().isoformat(timespec='seconds') + 'Z',
        'providers': MANUAL_PROVIDERS,
        'catalog': manual_catalog_status(),
        'results': results[:36],
    }

def _safe_filename(value):
    value = unquote(value or '').strip().replace('\\', '/').split('/')[-1]
    value = re.sub(r'[^A-Za-z0-9._ -]+', '_', value).strip(' ._')
    return value or 'manual.pdf'


def is_probably_pdf_url(url):
    parsed = urlparse((url or '').strip())
    is_vimm_download = parsed.netloc.lower() == 'dl.vimm.net' and parsed.path.rstrip('/') == '/download'
    return parsed.scheme in ('http', 'https') and (parsed.path.lower().endswith('.pdf') or is_vimm_download)


def validate_pdf_file(path):
    try:
        with open(path, 'rb') as fh:
            return fh.read(5) == PDF_MAGIC
    except OSError:
        return False


def manual_file_info(filename):
    filename = _safe_filename(filename)
    path = MANUALS_DIR / filename
    if not path.exists():
        return {"exists": False, "valid_pdf": False, "size": 0, "filename": filename}
    return {
        "exists": True,
        "valid_pdf": validate_pdf_file(path),
        "size": path.stat().st_size,
        "filename": filename,
    }


def download_manual_pdf(game_id, manual_url, title='Manual'):
    manual_url = (manual_url or '').strip()
    parsed = urlparse(manual_url)
    if parsed.scheme not in ('http', 'https'):
        raise ValueError('Manual download requires a direct http/https PDF URL.')

    is_vimm_download = parsed.netloc.lower() == 'dl.vimm.net' and parsed.path.rstrip('/') == '/download'
    if not parsed.path.lower().endswith('.pdf') and not is_vimm_download:
        raise ValueError('This looks like a source page, not a direct PDF download.')

    MANUALS_DIR.mkdir(parents=True, exist_ok=True)
    headers = {'User-Agent': 'Vaultarr/1.2.1 Manual Downloader', 'Accept': 'application/pdf,*/*;q=0.8'}
    if is_vimm_download:
        headers.update({'Referer': 'https://vimm.net/', 'Cookie': 'counted=1'})
    with requests.get(manual_url, headers=headers, timeout=35, stream=True, allow_redirects=True) as response:
        response.raise_for_status()
        content_type = response.headers.get('content-type', '').lower()
        disposition = response.headers.get('content-disposition', '')
        filename_match = re.search(r'filename\*?=(?:UTF-8\'\')?["\']?([^"\';]+)', disposition, flags=re.I)
        path_name = _safe_filename(filename_match.group(1) if filename_match else parsed.path)
        if not path_name.lower().endswith('.pdf'):
            path_name += '.pdf'

        if 'pdf' not in content_type:
            raise ValueError('The linked manual did not return a PDF response.')

        safe_title = re.sub(r'[^A-Za-z0-9._ -]+', '_', title or f'game-{game_id}').strip(' ._') or f'game-{game_id}'
        filename = f'{game_id}_{safe_title}_{path_name}'[:180]
        if not filename.lower().endswith('.pdf'):
            filename += '.pdf'
        destination = MANUALS_DIR / filename

        size = 0
        with open(destination, 'wb') as fh:
            for chunk in response.iter_content(chunk_size=1024 * 128):
                if not chunk:
                    continue
                size += len(chunk)
                if size > 250 * 1024 * 1024:
                    fh.close()
                    destination.unlink(missing_ok=True)
                    raise ValueError('Manual PDF is larger than the 250 MB safety limit.')
                fh.write(chunk)

    if not validate_pdf_file(destination):
        destination.unlink(missing_ok=True)
        raise ValueError('The downloaded file was not a valid PDF. It may be a webpage, redirect, or protected download page.')

    return {
        'filename': filename,
        'path': filename,
        'size': size,
        'url': f'/manuals/{filename}',
        'viewer_url': f'/manuals/{filename}#toolbar=0&navpanes=0&scrollbar=0',
    }
