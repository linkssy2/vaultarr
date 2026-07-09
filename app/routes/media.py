import os
from pathlib import Path
from flask import Blueprint, send_from_directory, abort

media_bp = Blueprint('media', __name__)
APP_DIR = Path(os.getenv('LOCALAPPDATA', '.')) / 'Vaultarr'
COVERS_DIR = APP_DIR / 'covers'
MANUALS_DIR = APP_DIR / 'manuals'
MEDIA_DIR = APP_DIR / 'media'

@media_bp.route('/covers/<path:filename>')
def cover_file(filename):
    if not (COVERS_DIR / filename).exists():
        abort(404)
    return send_from_directory(COVERS_DIR, filename)


@media_bp.route('/manuals/<path:filename>')
def manual_file(filename):
    if not (MANUALS_DIR / filename).exists():
        abort(404)
    return send_from_directory(MANUALS_DIR, filename, mimetype='application/pdf')


@media_bp.route('/media-assets/<path:filename>')
def media_asset_file(filename):
    if not (MEDIA_DIR / filename).exists():
        abort(404)
    return send_from_directory(MEDIA_DIR, filename)
