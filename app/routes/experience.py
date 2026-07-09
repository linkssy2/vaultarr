from flask import Blueprint, render_template, jsonify

from app.services.collection_experience_service import get_collection_experience

experience_bp = Blueprint('experience', __name__)


@experience_bp.route('/experience')
def experience():
    data = get_collection_experience()
    return render_template('experience.html', **data)


@experience_bp.route('/api/experience/summary')
def experience_summary():
    data = get_collection_experience()
    return jsonify({
        'vault_score': data['vault_score'],
        'earned_count': len(data['earned_badges']),
        'total_badges': len(data['badges']),
        'next_badges': data['next_badges'],
    })
