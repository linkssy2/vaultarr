from urllib.parse import quote_plus, quote, urlparse, unquote, urljoin
from datetime import datetime, timedelta
from difflib import SequenceMatcher
import json
import os
import re
from pathlib import Path
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
        "id": "replacementdocs",
        "name": "replacementdocs",
        "kind": "external_search",
        "description": "Search replacementdocs for scanned manuals and reference documents.",
        "search_template": "https://www.google.com/search?q=site%3Areplacementdocs.com+{query}+manual+pdf",
        "homepage": "https://www.replacementdocs.com/",
        "priority": 2,
    },
    {
        "id": "gamesdatabase",
        "name": "Broad manual web search",
        "kind": "external_search",
        "description": "Broader search for manual archives, PDFs, and source pages.",
        "search_template": "https://www.google.com/search?q={query}+game+manual+pdf",
        "homepage": "https://www.google.com/",
        "priority": 3,
    },
    {
        "id": "local",
        "name": "Local Manual Library",
        "kind": "local",
        "description": "Vaultarr local scan results and user-linked manuals.",
        "search_template": "",
        "homepage": "",
        "priority": 4,
    },
]

APP_DIR = Path(os.getenv('LOCALAPPDATA', '.')) / 'Vaultarr'
MANUALS_DIR = APP_DIR / 'manuals'
MANUAL_CACHE_DIR = APP_DIR / 'manual_provider_cache'
VGM_CACHE_FILE = MANUAL_CACHE_DIR / 'videogamemanual_index.json'
PDF_MAGIC = b'%PDF-'

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
_LETTER_PAGES = ['index.html', '0.htm'] + [f'{chr(code)}.htm' for code in range(ord('A'), ord('Z') + 1)]
_MANUAL_URL_CACHE = {}


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
        'User-Agent': 'Vaultarr/Alpha20 Manual Indexer (+local archive manager)',
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
    encoded = quote_plus(query)
    providers = MANUAL_PROVIDERS
    if provider_id and provider_id != "all":
        providers = [provider for provider in providers if provider["id"] == provider_id]

    results = []
    for provider in providers:
        if provider["id"] == "videogamemanual":
            direct = _videogamemanual_candidates(search_title, platform)
            results.extend(direct)
            if not direct:
                platform_hint = _platform_folders(platform)[0] if _platform_folders(platform) else 'PS2'
                results.append({
                    "provider": provider["name"],
                    "provider_id": provider["id"],
                    "kind": "source_search",
                    "title": f"Open {provider['name']} {platform_hint} index",
                    "description": "No exact cached direct PDF match was found. Open the provider index and copy a direct PDF if needed.",
                    "url": f"https://www.videogamemanual.com/{quote(platform_hint)}/index.html",
                    "action": "Open Provider Index",
                    "confidence": 35,
                    "is_pdf_candidate": False,
                    "can_download": False,
                })
            continue

        if provider["kind"] == "local":
            results.append({
                "provider": provider["name"],
                "provider_id": provider["id"],
                "kind": provider["kind"],
                "title": "Local manual scan",
                "description": "Use Vaultarr's asset scan to detect local PDF/manual files, or paste a manual URL.",
                "url": "",
                "action": "Scan Local Assets",
                "confidence": 40,
                "is_pdf_candidate": False,
                "can_download": False,
            })
            continue

        results.append({
            "provider": provider["name"],
            "provider_id": provider["id"],
            "kind": provider["kind"],
            "title": f"Search {provider['name']}",
            "description": provider["description"],
            "url": provider["search_template"].format(query=encoded),
            "action": "Open Provider Search",
            "confidence": 55,
            "is_pdf_candidate": False,
            "can_download": False,
        })

    return {
        "query": query,
        "checked_at": datetime.utcnow().isoformat(timespec="seconds") + "Z",
        "providers": MANUAL_PROVIDERS,
        "results": _dedupe_manual_results(results)[:10],
    }


def _safe_filename(value):
    value = unquote(value or '').strip().replace('\\', '/').split('/')[-1]
    value = re.sub(r'[^A-Za-z0-9._ -]+', '_', value).strip(' ._')
    return value or 'manual.pdf'


def is_probably_pdf_url(url):
    parsed = urlparse((url or '').strip())
    return parsed.scheme in ('http', 'https') and parsed.path.lower().endswith('.pdf')


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

    if not parsed.path.lower().endswith('.pdf'):
        raise ValueError('This looks like a source page, not a direct PDF. Open the source page and copy the direct PDF URL first.')

    MANUALS_DIR.mkdir(parents=True, exist_ok=True)
    headers = {'User-Agent': 'Vaultarr/Alpha20 Manual Downloader', 'Accept': 'application/pdf,*/*;q=0.8'}
    with requests.get(manual_url, headers=headers, timeout=35, stream=True, allow_redirects=True) as response:
        response.raise_for_status()
        content_type = response.headers.get('content-type', '').lower()
        path_name = _safe_filename(parsed.path)
        if not path_name.lower().endswith('.pdf'):
            path_name += '.pdf'

        if 'pdf' not in content_type and not path_name.lower().endswith('.pdf'):
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
