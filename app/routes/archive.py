from pathlib import Path
from flask import Blueprint, render_template, request, redirect, send_file, abort

from app.services.archive_service import (
    archive_status,
    create_archive,
    import_archive,
    save_uploaded_archive,
    verify_archive,
    ARCHIVES_DIR,
    save_backup_settings,
    run_scheduled_backup,
)

archive_bp = Blueprint('archive', __name__)


def _redirect_with(message, status='ok'):
    return redirect(f'/settings?archive_status={status}&archive_message={message[:180]}#museum-backup')


@archive_bp.route('/archive')
def archive_home():
    return redirect('/settings#museum-backup')


@archive_bp.route('/archive/export', methods=['POST'])
def archive_export():
    name = request.form.get('name', '').strip() or 'vaultarr_backup'
    include_cache = request.form.get('include_cache') == 'on'

    try:
        info = create_archive(name=name, include_cache=include_cache)
        return redirect(f"/settings?archive_status=ok&archive_message=Exported local archive: {info['name']}#museum-backup")
    except Exception as exc:
        return _redirect_with(f'Export failed: {exc}', 'error')


@archive_bp.route('/archive/backup-settings', methods=['POST'])
def archive_backup_settings():
    data = {
        'enabled': request.form.get('enabled') == 'on',
        'backup_folder': request.form.get('backup_folder', '').strip(),
        'schedule': request.form.get('schedule', 'daily'),
        'retention_count': request.form.get('retention_count', '20'),
        'include_cache': request.form.get('include_cache') == 'on',
        'verify_after_backup': request.form.get('verify_after_backup') == 'on',
        'compress_backup': request.form.get('compress_backup') == 'on',
        'keep_monthly_snapshots': request.form.get('keep_monthly_snapshots') == 'on',
    }
    try:
        save_backup_settings(data)
        return _redirect_with('Scheduled backup settings saved.', 'ok')
    except Exception as exc:
        return _redirect_with(f'Scheduled backup settings failed: {exc}', 'error')


@archive_bp.route('/archive/backup-now', methods=['POST'])
def archive_backup_now():
    result = run_scheduled_backup(manual=True)
    if result.get('success'):
        archive = result.get('archive') or {}
        return _redirect_with(f'Backup created: {archive.get("name", "backup")}. {result.get("message", "")}', 'ok')
    return _redirect_with(f'Backup failed: {result.get("message", "Unknown error")}', 'error')


@archive_bp.route('/archive/import/folder', methods=['POST'])
def archive_import_folder():
    folder = request.form.get('backup_folder', '').strip()
    archive_path = request.form.get('archive_path', '').strip()
    mode = request.form.get('mode', 'replace')
    if not folder or not archive_path:
        return _redirect_with('Choose a backup folder and archive first.', 'error')
    try:
        path = Path(archive_path).expanduser()
        folder_path = Path(folder).expanduser().resolve()
        if folder_path not in path.resolve().parents and path.resolve().parent != folder_path:
            return _redirect_with('Selected archive is outside the configured backup folder.', 'error')
        verified = verify_archive(path)
        if not verified.get('valid'):
            return _redirect_with(f"Restore rejected: {verified.get('message')}", 'error')
        result = import_archive(path, mode=mode)
        return _redirect_with(f"Restored {path.name}. Database backup: {result.get('backup_database') or 'none'}", 'ok')
    except Exception as exc:
        return _redirect_with(f'Folder restore failed: {exc}', 'error')


@archive_bp.route('/archive/download/<path:filename>')
def archive_download(filename):
    path = ARCHIVES_DIR / Path(filename).name
    if not path.exists():
        abort(404)
    return send_file(path, as_attachment=True, download_name=path.name)


@archive_bp.route('/archive/import/upload', methods=['POST'])
def archive_import_upload():
    uploaded = request.files.get('archive_file')
    mode = request.form.get('mode', 'replace')
    if not uploaded or not uploaded.filename:
        return _redirect_with('Choose a .vaultarr archive to import.', 'error')
    try:
        info = save_uploaded_archive(uploaded)
        verified = verify_archive(info['path'])
        if not verified.get('valid'):
            return _redirect_with(f"Import rejected: {verified.get('message')}", 'error')
        result = import_archive(info['path'], mode=mode)
        return _redirect_with(f"Imported {info['name']} ({mode}). Database backup: {result.get('backup_database') or 'none'}", 'ok')
    except Exception as exc:
        return _redirect_with(f'Import failed: {exc}', 'error')
