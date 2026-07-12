from flask import Blueprint, request, jsonify, g
from flask_jwt_extended import create_access_token, create_refresh_token
from models.user import User
from models.db import db
from middleware.auth_middleware import jwt_required
import bcrypt

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    full_name = data.get('full_name', '').strip()
    role = data.get('role', 'driver')
    if not email or not password or not full_name:
        return jsonify({'error': 'Email, password, and full name are required'}), 400
    if '@' not in email:
        return jsonify({'error': 'Invalid email format'}), 400
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 409
    valid_roles = ['fleet-manager', 'driver', 'safety-officer', 'financial-analyst']
    if role not in valid_roles:
        return jsonify({'error': f'Invalid role'}), 400
    pw_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    user = User(email=email, password_hash=pw_hash, full_name=full_name, role=role)
    db.session.add(user)
    db.session.commit()
    token = create_access_token(identity=str(user.id))
    refresh = create_refresh_token(identity=str(user.id))
    return jsonify({'message': 'Registered', 'user': user.to_dict(), 'access_token': token, 'refresh_token': refresh}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400
    user = User.query.filter_by(email=email).first()
    if not user or not bcrypt.checkpw(password.encode('utf-8'), user.password_hash.encode('utf-8')):
        return jsonify({'error': 'Invalid email or password'}), 401
    if not user.is_active:
        return jsonify({'error': 'Account is inactive'}), 403
    token = create_access_token(identity=str(user.id))
    refresh = create_refresh_token(identity=str(user.id))
    return jsonify({'message': 'Login successful', 'user': user.to_dict(), 'access_token': token, 'refresh_token': refresh}), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required
def me():
    return jsonify({'user': g.current_user.to_dict()}), 200
