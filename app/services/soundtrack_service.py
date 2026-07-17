import html
import mimetypes
import re
from pathlib import Path
from urllib.parse import quote_plus, urlencode, urlparse

import requests

from app.database.database import APP_DIR


AUDIO_EXTENSIONS = {'.mp3', '.flac', '.ogg', '.wav', '.m4a'}
SOUNDTRACK_DIR = APP_DIR / 'soundtracks'
KHINSIDER_ROOT = 'https://downloads.khinsider.com'
USER_AGENT = 'Vaultarr/2.0 Soundtrack Catalog'
MAX_TRACKS_PER_GAME = 500
MAX_UPLOAD_BYTES = 250 * 1024 * 1024


def _plain_html(value):
    text = re.sub(r'<[^>]+>', ' ', value or '')
    return re.sub(r'\s+', ' ', html.unescape(text)).strip()


def _score_album(title, game_title, platform='', year=''):
    candidate = (title or '').lower()
    game = (game_title or '').lower()
    score = 25
    if game and game in candidate:
        score += 50
    tokens = [token for token in re.findall(r'[a-z0-9]+', game) if len(token) >= 3 and token not in {'the', 'and', 'game'}]
    score += min(20, sum(5 for token in tokens if token in candidate))
    if re.search(r'\b(soundtrack|ost|score)\b', candidate):
        score += 10
    if platform and platform.lower() in candidate:
        score += 4
    if year and str(year) in candidate:
        score += 4
    return max(1, min(100, score))


def khinsider_album_candidates(game_title, platform='', year=''):
    """Return public KHInsider album catalog metadata without fetching audio files."""
    query = (game_title or '').strip()
    url = f'{KHINSIDER_ROOT}/search?search={quote_plus(query)}&type=album'
    response = requests.get(
        url,
        timeout=18,
        headers={'User-Agent': USER_AGENT, 'Accept-Language': 'en-US,en;q=0.9'},
    )
    response.raise_for_status()
    results = []
    seen = set()
    for row in re.findall(r'<tr[^>]*>(.*?)</tr>', response.text, flags=re.I | re.S):
        album_links = re.findall(
            r'<a[^>]+href=["\'](/game-soundtracks/album/[^"\']+)["\'][^>]*>(.*?)</a>',
            row,
            flags=re.I | re.S,
        )
        album_match = next(((path, label) for path, label in album_links if _plain_html(label)), None)
        if not album_match:
            continue
        path, label = album_match
        title = _plain_html(label)
        if not title or path in seen:
            continue
        seen.add(path)
        cells = re.findall(r'<td[^>]*>(.*?)</td>', row, flags=re.I | re.S)
        platform_text = _plain_html(cells[2]) if len(cells) > 2 else ''
        platform_text = re.sub(r'\s*,\s*', ', ', platform_text)
        album_type = _plain_html(cells[3]) if len(cells) > 3 else ''
        album_year = _plain_html(cells[4]) if len(cells) > 4 else ''
        image_match = re.search(r'<img[^>]+src=["\']([^"\']+)["\']', row, flags=re.I)
        score = _score_album(title, game_title, platform, year)
        results.append({
            'source': 'KHInsider Catalog',
            'provider': 'KHInsider',
            'title': title,
            'url': f'{KHINSIDER_ROOT}{path}',
            'embed_url': '',
            'thumbnail': html.unescape(image_match.group(1)) if image_match else '',
            'duration': platform_text,
            'published': ' · '.join(value for value in (album_type, album_year) if value),
            'confidence': score,
            'reason': 'Catalog match · opens on KHInsider',
            'catalog_only': True,
        })
    results.sort(key=lambda item: item.get('confidence', 0), reverse=True)
    return results[:8]


def khinsider_album_tracks(album_url):
    """Return track metadata and KHInsider song-page links, never audio URLs or bytes."""
    parsed = urlparse(album_url or '')
    if parsed.scheme != 'https' or parsed.netloc != 'downloads.khinsider.com' or not parsed.path.startswith('/game-soundtracks/album/'):
        raise ValueError('Invalid KHInsider album URL.')
    response = requests.get(
        album_url,
        timeout=18,
        headers={'User-Agent': USER_AGENT, 'Accept-Language': 'en-US,en;q=0.9'},
    )
    response.raise_for_status()
    heading_match = re.search(r'<h2[^>]*>(.*?)</h2>', response.text, flags=re.I | re.S)
    album_title = _plain_html(heading_match.group(1)) if heading_match else 'KHInsider Album'
    tracks = []
    seen = set()
    for row in re.findall(r'<tr[^>]*>(.*?)</tr>', response.text, flags=re.I | re.S):
        if 'clickable-row' not in row:
            continue
        links = re.findall(
            r'<a[^>]+href=["\'](/game-soundtracks/album/[^"\']+)["\'][^>]*>(.*?)</a>',
            row,
            flags=re.I | re.S,
        )
        values = [(path, _plain_html(label)) for path, label in links if _plain_html(label)]
        if len(values) < 3:
            continue
        path, title = values[0]
        if path in seen:
            continue
        seen.add(path)
        tracks.append({
            'number': len(tracks) + 1,
            'title': title,
            'duration': values[1][1],
            'size': values[2][1],
            'page_url': f'{KHINSIDER_ROOT}{path}',
        })
        if len(tracks) >= MAX_TRACKS_PER_GAME:
            break
    return {'title': album_title, 'url': album_url, 'tracks': tracks, 'count': len(tracks)}


def _safe_upload_name(filename):
    original = Path(filename or 'track').name
    stem = re.sub(r'[^A-Za-z0-9._ -]+', '_', Path(original).stem).strip(' ._') or 'track'
    suffix = Path(original).suffix.lower()
    return f'{stem[:120]}{suffix}'


def _track_title(path):
    return re.sub(r'\s+', ' ', path.stem.replace('_', ' ').replace('-', ' ')).strip() or path.name


def _track_payload(game_id, path, root, source):
    relative = path.relative_to(root).as_posix()
    query = urlencode({'source': source, 'path': relative})
    return {
        'title': _track_title(path),
        'filename': path.name,
        'album': path.parent.name if path.parent != root else ('Vaultarr Imports' if source == 'vault' else 'Game Folder'),
        'source': 'Vaultarr Import' if source == 'vault' else 'Game Folder',
        'size_bytes': path.stat().st_size,
        'url': f'/api/games/{game_id}/soundtrack/audio?{query}',
        'removable': source == 'vault',
    }


def list_local_tracks(game):
    game_id = int(game.get('id') or 0)
    tracks = []
    vault_root = SOUNDTRACK_DIR / str(game_id)
    if vault_root.exists():
        for path in sorted(vault_root.rglob('*'), key=lambda item: item.name.lower()):
            if path.is_file() and path.suffix.lower() in AUDIO_EXTENSIONS:
                tracks.append(_track_payload(game_id, path, vault_root, 'vault'))
                if len(tracks) >= MAX_TRACKS_PER_GAME:
                    return tracks

    library_value = str(game.get('path') or '').strip()
    library_root = Path(library_value) if library_value else None
    if library_root and library_root.exists() and library_root.is_dir():
        for path in sorted(library_root.rglob('*'), key=lambda item: item.name.lower()):
            if not path.is_file() or path.suffix.lower() not in AUDIO_EXTENSIONS:
                continue
            relative_lower = path.relative_to(library_root).as_posix().lower()
            if not any(marker in relative_lower for marker in ('soundtrack', '/ost/', '/music/', ' ost.', ' soundtrack.')):
                continue
            tracks.append(_track_payload(game_id, path, library_root, 'library'))
            if len(tracks) >= MAX_TRACKS_PER_GAME:
                break
    return tracks


def save_uploaded_tracks(game_id, uploads):
    target = SOUNDTRACK_DIR / str(int(game_id))
    target.mkdir(parents=True, exist_ok=True)
    saved = []
    rejected = []
    for upload in uploads:
        suffix = Path(upload.filename or '').suffix.lower()
        if suffix not in AUDIO_EXTENSIONS:
            rejected.append(Path(upload.filename or 'unknown').name)
            continue
        upload.stream.seek(0, 2)
        size = upload.stream.tell()
        upload.stream.seek(0)
        if size <= 0 or size > MAX_UPLOAD_BYTES:
            rejected.append(Path(upload.filename or 'unknown').name)
            continue
        name = _safe_upload_name(upload.filename)
        destination = target / name
        counter = 2
        while destination.exists():
            destination = target / f'{Path(name).stem} ({counter}){suffix}'
            counter += 1
        upload.save(destination)
        saved.append(destination.name)
    return {'saved': saved, 'rejected': rejected}


def resolve_audio_path(game, source, relative_path):
    game_id = int(game.get('id') or 0)
    library_value = str(game.get('path') or '').strip()
    if source == 'vault':
        root = SOUNDTRACK_DIR / str(game_id)
    elif source == 'library' and library_value:
        root = Path(library_value)
    else:
        return None
    if not root.exists() or not root.is_dir():
        return None
    try:
        root = root.resolve()
        candidate = (root / (relative_path or '')).resolve()
        if not candidate.is_relative_to(root):
            return None
        if not candidate.is_file() or candidate.suffix.lower() not in AUDIO_EXTENSIONS:
            return None
        return candidate
    except (OSError, RuntimeError, ValueError):
        return None


def audio_mimetype(path):
    return mimetypes.guess_type(path.name)[0] or 'application/octet-stream'
