from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity
from models import User


def role_required(*roles):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            current_user_id = int(get_jwt_identity())
            user = User.query.get(current_user_id)
            if not user:
                return jsonify({'error': 'User not found'}), 404
            if user.role not in roles:
                return jsonify({'error': 'Insufficient permissions'}), 403
            return f(*args, **kwargs)
        return decorated_function
    return decorator


def get_current_user():
    user_id = int(get_jwt_identity())
    return User.query.get(user_id)
