from flask import Blueprint, redirect

metadata_queue_bp = Blueprint('metadata_queue', __name__)

@metadata_queue_bp.route('/metadata-queue')
def metadata_queue():
    # Compatibility redirect: incomplete records now live in Museum → Needs Attention.
    return redirect('/museum?attention=1')
