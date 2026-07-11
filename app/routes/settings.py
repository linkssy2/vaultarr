from flask import Blueprint, render_template, request, redirect
from pathlib import Path
from app.database.database import get_connection
from app.services.scanner import scan_library
from app.services.curator_service import queue_game, refresh_game_score
from app.services.theme_service import (
    THEME_PACKS,
    load_theme,
    save_theme,
    save_theme_pack,
    custom_theme_from_form,
    get_default_theme,
    save_dark_reader_compat,
)
from app.services.launchbox_service import sync_launchbox_metadata, sync_status
from app.services.media_service import media_cache_summary
from app.services.manual_service import manual_catalog_status, sync_manual_catalog, clear_manual_catalog
from app.services.reset_service import reset_vault
from app.services.auth_service import load_auth_settings, update_auth_from_form
from app.services.game_removal_service import ignored_paths, restore_ignored_path
from app.services.provider_settings import (
    load_provider_settings,
    save_provider_settings,
    provider_settings_from_form,
    masked,
)

settings_bp = Blueprint('settings', __name__)

@settings_bp.route('/settings')
def settings():
    conn = get_connection()
    libraries = conn.execute('SELECT * FROM libraries ORDER BY name').fetchall()
    conn.close()

    scan_result = {k: request.args.get(k) for k in ['added', 'updated', 'skipped', 'errors']}
    saved = request.args.get('saved', '')

    return render_template(
        'settings.html',
        libraries=libraries,
        scan_result=scan_result,
        theme_packs=THEME_PACKS,
        theme_presets=THEME_PACKS,
        current_theme=load_theme(),
        provider_settings=load_provider_settings(),
        launchbox_status=sync_status(),
        media_cache=media_cache_summary(),
        manual_catalog=manual_catalog_status(),
        auth_settings=load_auth_settings(),
        masked=masked,
        saved=saved,
        ignored_games=ignored_paths(),
    )

@settings_bp.route('/settings/theme/preset', methods=['POST'])
def save_theme_preset_route():
    preset = request.form.get('preset', 'vault_blue').strip()
    save_theme_pack(preset)
    return redirect('/settings?saved=theme')

@settings_bp.route('/settings/theme/custom', methods=['POST'])
def save_custom_theme_route():
    theme = custom_theme_from_form(request.form)
    save_theme(theme)
    return redirect('/settings?saved=theme')

@settings_bp.route('/settings/theme', methods=['POST'])
def save_theme_route():
    # Compatibility endpoint used by older Alpha 6 forms.
    preset = request.form.get('preset', '').strip()
    if preset:
        save_theme_pack(preset)
    else:
        save_theme(custom_theme_from_form(request.form))
    return redirect('/settings?saved=theme')

@settings_bp.route('/settings/theme/reset', methods=['POST'])
def reset_theme_route():
    save_theme(get_default_theme())
    return redirect('/settings?saved=theme')


@settings_bp.route('/settings/theme/dark-reader', methods=['POST'])
def save_dark_reader_compat_route():
    enabled = request.form.get('enabled') == 'on'
    save_dark_reader_compat(enabled)
    return redirect('/settings?saved=darkreader')



@settings_bp.route('/settings/metadata-providers', methods=['POST'])
def save_metadata_providers_route():
    save_provider_settings(provider_settings_from_form(request.form))
    return redirect('/settings?saved=providers')


@settings_bp.route('/settings/launchbox/sync', methods=['POST'])
def sync_launchbox_route():
    settings = load_provider_settings()
    url = request.form.get('launchbox_metadata_url', '').strip() or settings.get('launchbox_metadata_url') or 'https://gamesdb.launchbox-app.com/Metadata.zip'
    try:
        result = sync_launchbox_metadata(url)
        return redirect(f"/settings?saved=launchbox&lb_games={result.get('games',0)}&lb_images={result.get('images',0)}")
    except Exception as exc:
        return redirect(f"/settings?saved=launchbox_error&lb_error={str(exc)[:160]}")







@settings_bp.route('/settings/manual-catalog/refresh', methods=['POST'])
def refresh_manual_catalog_route():
    try:
        result = sync_manual_catalog(force=True)
        return redirect(f"/settings?saved=manual_catalog&manual_entries={result.get('entries',0)}")
    except Exception as exc:
        return redirect(f"/settings?saved=manual_catalog_error&manual_error={str(exc)[:160]}")


@settings_bp.route('/settings/manual-catalog/clear', methods=['POST'])
def clear_manual_catalog_route():
    clear_manual_catalog()
    return redirect('/settings?saved=manual_catalog_cleared')

@settings_bp.route('/settings/security', methods=['POST'])
def save_security_route():
    ok, code = update_auth_from_form(request.form)
    if ok:
        return redirect('/settings?saved=security')
    return redirect(f'/settings?saved={code}')

@settings_bp.route('/settings/reset-vault', methods=['POST'])
def reset_vault_route():
    confirmation = request.form.get('confirmation', '').strip()
    if confirmation != 'RESET VAULT':
        return redirect('/settings?saved=reset_error')

    delete_cached_assets = request.form.get('delete_cached_assets') == 'on'
    delete_time_capsules = request.form.get('delete_time_capsules') == 'on'
    result = reset_vault(
        delete_cached_assets=delete_cached_assets,
        delete_time_capsules=delete_time_capsules,
    )

    if result.get('success'):
        return redirect('/onboarding?reset=1')
    return redirect('/settings?saved=reset_failed')

@settings_bp.route('/libraries/add', methods=['POST'])
def add_library():
    name = request.form.get('name', '').strip()
    path = request.form.get('path', '').strip()

    if not name and path:
        name = Path(path).name or path

    if name and path:
        conn = get_connection()
        conn.execute('INSERT OR IGNORE INTO libraries (name,path) VALUES (?,?)', (name, path))
        conn.commit()
        conn.close()

    return redirect('/settings')

@settings_bp.route('/libraries/delete/<int:library_id>', methods=['POST'])
def delete_library(library_id):
    conn = get_connection()
    conn.execute('DELETE FROM games WHERE library_id=?', (library_id,))
    conn.execute('DELETE FROM libraries WHERE id=?', (library_id,))
    conn.commit()
    conn.close()
    return redirect('/settings')

@settings_bp.route('/libraries/scan/<int:library_id>', methods=['POST'])
def scan_library_route(library_id):
    conn = get_connection()
    library = conn.execute('SELECT * FROM libraries WHERE id=?', (library_id,)).fetchone()

    added = updated = skipped = errors = 0

    if library:
        result = scan_library(library)
        skipped = result.get('skipped', 0)
        errors = len(result.get('errors', []))

        ignored = {row['path'] for row in ignored_paths()}
        for game in result.get('games', []):
            if game['path'] in ignored:
                skipped += 1
                continue
            existing = conn.execute('SELECT id FROM games WHERE path=?', (game['path'],)).fetchone()

            if existing:
                conn.execute('''
                    UPDATE games
                    SET title=?,
                        size_bytes=?,
                        file_count=?,
                        executable_count=?,
                        executables=?,
                        manual_count=?,
                        readme_count=?,
                        archive_count=?,
                        installer_count=?,
                        disc_image_count=?,
                        patch_count=?,
                        soundtrack_count=?,
                        bonus_count=?,
                        updated_at=CURRENT_TIMESTAMP,
                        last_scanned=?
                    WHERE path=?
                ''', (
                    game['title'], game['size_bytes'], game['file_count'], game['executable_count'],
                    game['executables'], game.get('manual_count', 0), game.get('readme_count', 0),
                    game.get('archive_count', 0), game.get('installer_count', 0), game.get('disc_image_count', 0),
                    game.get('patch_count', 0), game.get('soundtrack_count', 0), game.get('bonus_count', 0),
                    game['last_scanned'], game['path']
                ))
                updated += 1
            else:
                conn.execute('''
                    INSERT INTO games (
                        library_id,title,path,size_bytes,file_count,executable_count,executables,
                        manual_count,readme_count,archive_count,installer_count,disc_image_count,patch_count,soundtrack_count,bonus_count,last_scanned
                    )
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                ''', (
                    game['library_id'], game['title'], game['path'], game['size_bytes'], game['file_count'],
                    game['executable_count'], game['executables'], game.get('manual_count', 0), game.get('readme_count', 0),
                    game.get('archive_count', 0), game.get('installer_count', 0), game.get('disc_image_count', 0),
                    game.get('patch_count', 0), game.get('soundtrack_count', 0), game.get('bonus_count', 0),
                    game['last_scanned']
                ))
                added += 1

        conn.commit()
        queued_rows = conn.execute("SELECT id FROM games WHERE library_id=? AND curator_paused=0", (library_id,)).fetchall()
    else:
        queued_rows = []

    conn.close()
    for queued_row in queued_rows:
        refresh_game_score(queued_row['id'])
        queue_game(queued_row['id'], 'library scan')
    return redirect(f'/settings?added={added}&updated={updated}&skipped={skipped}&errors={errors}')


@settings_bp.route('/settings/ignored-games/<int:ignore_id>/restore', methods=['POST'])
def restore_ignored_game_route(ignore_id):
    restore_ignored_path(ignore_id)
    return redirect('/settings?saved=ignored_restored')
