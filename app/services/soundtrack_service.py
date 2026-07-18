import html
import mimetypes
import re
import threading
from pathlib import Path
from urllib.parse import quote_plus, unquote, urlencode, urljoin, urlparse

import requests

from app.database.database import APP_DIR, get_connection
from app.services.acquisition_assistant_service import _public_download_url


AUDIO_EXTENSIONS = {'.mp3', '.flac', '.ogg', '.wav', '.m4a'}
SOUNDTRACK_DIR = APP_DIR / 'soundtracks'
KHINSIDER_ROOT = 'https://downloads.khinsider.com'
USER_AGENT = 'Vaultarr/2.0 Soundtrack Catalog'
MAX_TRACKS_PER_GAME = 500
MAX_UPLOAD_BYTES = 250 * 1024 * 1024
DOWNLOAD_CHUNK_BYTES = 1024 * 256
DOWNLOAD_REDIRECT_LIMIT = 5
_DOWNLOAD_JOBS = {}
_DOWNLOAD_LOCK = threading.Lock()


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


def _download_filename(response, final_url):
    disposition = response.headers.get('Content-Disposition', '')
    encoded = re.search(r"filename\*=UTF-8''([^;]+)", disposition, re.I)
    plain = re.search(r'filename=["\']?([^;"\']+)', disposition, re.I)
    name = unquote(encoded.group(1)) if encoded else (plain.group(1).strip() if plain else '')
    if not name:
        name = unquote(Path(urlparse(final_url).path).name)
    name = _safe_upload_name(name or 'soundtrack')
    if Path(name).suffix.lower() not in AUDIO_EXTENSIONS:
        raise ValueError('The direct link must resolve to an MP3, FLAC, OGG, WAV, or M4A audio file.')
    return name


def _available_download_path(game_id, filename):
    target_dir = SOUNDTRACK_DIR / str(int(game_id))
    target_dir.mkdir(parents=True, exist_ok=True)
    target = target_dir / filename
    counter = 2
    while target.exists() or target.with_name(f'{target.name}.part').exists():
        target = target_dir / f'{Path(filename).stem} ({counter}){Path(filename).suffix}'
        counter += 1
    return target


def _set_download_job(game_id, **updates):
    with _DOWNLOAD_LOCK:
        current = dict(_DOWNLOAD_JOBS.get(int(game_id), {}))
        current.update(updates)
        _DOWNLOAD_JOBS[int(game_id)] = current
        return dict(current)


def soundtrack_download_status(game_id):
    with _DOWNLOAD_LOCK:
        job = dict(_DOWNLOAD_JOBS.get(int(game_id), {}))
    if not job:
        return {'status': 'idle', 'progress': 0, 'received_bytes': 0, 'total_bytes': 0}
    return job


def _update_soundtrack_count(game_id):
    conn = get_connection()
    game = conn.execute('SELECT * FROM games WHERE id=?', (game_id,)).fetchone()
    if not game:
        conn.close()
        raise ValueError('Game not found.')
    count = len(list_local_tracks(dict(game)))
    conn.execute(
        'UPDATE games SET soundtrack_count=?, updated_at=CURRENT_TIMESTAMP WHERE id=?',
        (count, game_id),
    )
    conn.commit()
    conn.close()
    return count


def _download_soundtrack_worker(game_id, download_url):
    temporary = None
    response = None
    try:
        session = requests.Session()
        headers = {'User-Agent': USER_AGENT, 'Accept': 'audio/*,application/octet-stream;q=0.9,*/*;q=0.5'}
        current_url = download_url
        for _ in range(DOWNLOAD_REDIRECT_LIMIT + 1):
            current_url = _public_download_url(current_url)
            response = session.get(
                current_url,
                headers=headers,
                timeout=(12, 90),
                stream=True,
                allow_redirects=False,
            )
            if response.status_code in {301, 302, 303, 307, 308}:
                location = response.headers.get('Location', '').strip()
                response.close()
                if not location:
                    raise ValueError('The audio download redirect did not include a destination.')
                current_url = urljoin(current_url, location)
                continue
            response.raise_for_status()
            break
        else:
            raise ValueError('The audio download used too many redirects.')

        content_type = response.headers.get('Content-Type', '').split(';', 1)[0].strip().lower()
        if content_type in {'text/html', 'application/xhtml+xml'}:
            response.close()
            raise ValueError('This link opens a web page, not a direct audio file.')
        filename = _download_filename(response, current_url)
        total = int(response.headers.get('Content-Length') or 0)
        if total > MAX_UPLOAD_BYTES:
            response.close()
            raise ValueError('The audio file exceeds Vaultarr\'s 250 MB per-file limit.')

        target = _available_download_path(game_id, filename)
        temporary = target.with_name(f'{target.name}.part')
        received = 0
        _set_download_job(
            game_id,
            status='downloading',
            filename=filename,
            progress=0,
            received_bytes=0,
            total_bytes=total,
            message='Downloading audio to Vaultarr…',
        )
        with temporary.open('wb') as handle:
            for chunk in response.iter_content(chunk_size=DOWNLOAD_CHUNK_BYTES):
                if not chunk:
                    continue
                received += len(chunk)
                if received > MAX_UPLOAD_BYTES:
                    raise ValueError('The audio file exceeds Vaultarr\'s 250 MB per-file limit.')
                handle.write(chunk)
                progress = min(99, round((received / total) * 100)) if total else 0
                _set_download_job(game_id, progress=progress, received_bytes=received, total_bytes=total)
        response.close()
        if received <= 0:
            raise ValueError('The audio download returned an empty file.')
        temporary.replace(target)
        temporary = None
        track_count = _update_soundtrack_count(game_id)
        _set_download_job(
            game_id,
            status='complete',
            progress=100,
            received_bytes=received,
            total_bytes=total or received,
            filename=target.name,
            track_count=track_count,
            message='Audio download complete and ready in the Vaultarr player.',
        )
    except Exception as exc:
        if response is not None:
            response.close()
        if temporary and temporary.exists():
            try:
                temporary.unlink()
            except OSError:
                pass
        message = 'The remote server interrupted or rejected the audio download.' if isinstance(exc, requests.RequestException) else str(exc)
        _set_download_job(game_id, status='failed', message=message[:220], progress=0)


def start_soundtrack_download(game_id, download_url, permission_confirmed=False):
    if permission_confirmed is not True:
        raise ValueError('Confirm that you have permission to download and preserve this audio file.')
    download_url = _public_download_url(download_url)
    conn = get_connection()
    game = conn.execute('SELECT id FROM games WHERE id=?', (game_id,)).fetchone()
    conn.close()
    if not game:
        raise ValueError('Game not found.')
    with _DOWNLOAD_LOCK:
        existing = _DOWNLOAD_JOBS.get(int(game_id), {})
        if existing.get('status') in {'queued', 'downloading'}:
            raise ValueError('An audio download is already active for this game.')
        _DOWNLOAD_JOBS[int(game_id)] = {
            'status': 'queued',
            'progress': 0,
            'received_bytes': 0,
            'total_bytes': 0,
            'message': 'Audio download queued…',
        }
    worker = threading.Thread(
        target=_download_soundtrack_worker,
        args=(int(game_id), download_url),
        daemon=True,
        name=f'vaultarr-soundtrack-{int(game_id)}',
    )
    worker.start()
    return soundtrack_download_status(game_id)


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
