from flask import Blueprint, render_template, request, redirect, url_for, jsonify
from app.services.collection_service import build_collections, create_custom_collection, refresh_all_attributes

collections_bp = Blueprint('collections', __name__)

@collections_bp.route('/collections')
def collections():
    return redirect('/museum?view=collections')

@collections_bp.route('/collections/create', methods=['POST'])
def create_collection():
    create_custom_collection(request.form.get('name', ''), request.form.get('description', ''))
    return redirect('/museum?view=collections')

@collections_bp.route('/api/collections/auto-classify', methods=['POST'])
def api_auto_classify():
    count = refresh_all_attributes()
    return jsonify({'success': True, 'classified': count})
