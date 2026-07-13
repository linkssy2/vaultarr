from flask import Blueprint, render_template, redirect, request
from app.database.database import get_connection
from app.services.preservation_engine import preservation_report, update_all_preservation_scores
from app.services.scanner import scan_library
from app.services.intelligence_service import get_vault_intelligence
from app.services.game_removal_service import ignored_paths

preservation_bp = Blueprint('preservation', __name__)


@preservation_bp.route('/preservation')
def preservation():
    # Preservation is now shown per game. Keep the legacy route as a safe redirect.
    return redirect('/museum?attention=1')


@preservation_bp.route('/preservation/refresh', methods=['POST'])
def refresh_preservation():
    updated = update_all_preservation_scores()
    return redirect(f'/museum?attention=1&saved=refreshed-{updated}')


@preservation_bp.route('/preservation/scan-assets', methods=['POST'])
def scan_assets():
    conn = get_connection()
    libraries = conn.execute('SELECT * FROM libraries ORDER BY name').fetchall()
    updated = errors = skipped = 0

    ignored = {row['path'] for row in ignored_paths()}
    for library in libraries:
        result = scan_library(library)
        skipped += result.get('skipped', 0)
        errors += len(result.get('errors', []))
        for game in result.get('games', []):
            if game['path'] in ignored:
                skipped += 1
                continue
            existing = conn.execute('SELECT id FROM games WHERE path=?', (game['path'],)).fetchone()
            if not existing:
                continue
            conn.execute('''
                UPDATE games
                SET file_count=?,
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
                game['file_count'], game['executable_count'], game['executables'],
                game.get('manual_count', 0), game.get('readme_count', 0), game.get('archive_count', 0),
                game.get('installer_count', 0), game.get('disc_image_count', 0), game.get('patch_count', 0),
                game.get('soundtrack_count', 0), game.get('bonus_count', 0), game['last_scanned'], game['path']
            ))
            updated += 1

    conn.commit()
    conn.close()
    update_all_preservation_scores()
    return redirect(f'/museum?attention=1&saved=asset-scan-{updated}-{skipped}-{errors}')
