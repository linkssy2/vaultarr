from pathlib import Path
from datetime import datetime

EXECUTABLE_EXTENSIONS = {'.exe', '.bat', '.cmd', '.com'}
ARCHIVE_EXTENSIONS = {'.zip', '.rar', '.7z', '.tar', '.gz'}
AUDIO_EXTENSIONS = {'.mp3', '.flac', '.ogg', '.wav', '.m4a'}
DISC_IMAGE_EXTENSIONS = {'.iso', '.bin', '.cue', '.ccd', '.mdf', '.mds'}
MANUAL_KEYWORDS = {'manual', 'guide', 'booklet'}
README_KEYWORDS = {'readme', 'read me', 'info'}
INSTALLER_KEYWORDS = {'setup', 'install', 'installer'}
PATCH_KEYWORDS = {'patch', 'update', 'hotfix', 'fix'}
BONUS_KEYWORDS = {'bonus', 'extras', 'extra', 'artbook', 'ost', 'soundtrack'}


def _name_has_keyword(path: Path, keywords):
    name = path.stem.lower().replace('_', ' ').replace('-', ' ')
    return any(keyword in name for keyword in keywords)


def scan_game_folder(folder: Path):
    size_bytes = 0
    file_count = 0
    executables = []
    manual_count = 0
    readme_count = 0
    archive_count = 0
    installer_count = 0
    disc_image_count = 0
    patch_count = 0
    soundtrack_count = 0
    bonus_count = 0

    for item in folder.rglob('*'):
        try:
            if item.is_file():
                file_count += 1
                size_bytes += item.stat().st_size
                suffix = item.suffix.lower()

                if suffix in EXECUTABLE_EXTENSIONS:
                    executables.append(item.name)
                    if _name_has_keyword(item, INSTALLER_KEYWORDS):
                        installer_count += 1

                if suffix in {'.pdf', '.txt', '.doc', '.docx', '.rtf'} and _name_has_keyword(item, MANUAL_KEYWORDS):
                    manual_count += 1

                if suffix in {'.txt', '.nfo', '.md'} and _name_has_keyword(item, README_KEYWORDS):
                    readme_count += 1

                if suffix in ARCHIVE_EXTENSIONS:
                    archive_count += 1

                if suffix in DISC_IMAGE_EXTENSIONS:
                    disc_image_count += 1

                if _name_has_keyword(item, PATCH_KEYWORDS):
                    patch_count += 1

                if suffix in AUDIO_EXTENSIONS or _name_has_keyword(item, {'soundtrack', 'ost'}):
                    if 'soundtrack' in str(item.parent).lower() or 'ost' in str(item.parent).lower() or _name_has_keyword(item, {'soundtrack', 'ost'}):
                        soundtrack_count += 1

                if _name_has_keyword(item, BONUS_KEYWORDS) or any(part.lower() in BONUS_KEYWORDS for part in item.parts):
                    bonus_count += 1
        except (PermissionError, OSError):
            continue

    return {
        'title': folder.name,
        'path': str(folder),
        'size_bytes': size_bytes,
        'file_count': file_count,
        'executable_count': len(executables),
        'executables': ', '.join(executables[:25]),
        'manual_count': manual_count,
        'readme_count': readme_count,
        'archive_count': archive_count,
        'installer_count': installer_count,
        'disc_image_count': disc_image_count,
        'patch_count': patch_count,
        'soundtrack_count': soundtrack_count,
        'bonus_count': bonus_count,
        'last_scanned': datetime.now().isoformat(timespec='seconds'),
    }


def scan_library(library):
    library_path = Path(library['path'])
    result = {'library_id': library['id'], 'library_name': library['name'], 'games': [], 'skipped': 0, 'errors': []}
    if not library_path.exists():
        result['errors'].append('Library path does not exist.')
        return result
    for folder in library_path.iterdir():
        if not folder.is_dir():
            continue
        try:
            game = scan_game_folder(folder)
            game['library_id'] = library['id']
            if game['file_count'] == 0:
                result['skipped'] += 1
                continue
            result['games'].append(game)
        except Exception as e:
            result['errors'].append(f'{folder}: {e}')
    return result
