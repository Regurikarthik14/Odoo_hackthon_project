from functools import wraps
from flask import jsonify, g
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity

def jwt_required(fn=None, roles=None):
    """JWT decorator with optional role checking."""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            try:
                verify_jwt_in_request()
                from models.user import User
                user_id = get_jwt_identity()
                user = User.query.get(int(user_id))
                if not user or not user.is_active:
                    return jsonify({'error': 'User not found or inactive'}), 401
                if roles and user.role not in roles:
                    return jsonify({'error': 'Insufficient permissions'}), 403
                g.current_user = user
                return func(*args, **kwargs)
            except Exception:
                return jsonify({'error': 'Invalid or expired token'}), 401
        return wrapper
    if fn is not None:
        return decorator(fn)
    return decorator

def admin_required(fn):
    """Require fleet-manager role."""
    return jwt_required(roles=['fleet-manager'])(fn)
