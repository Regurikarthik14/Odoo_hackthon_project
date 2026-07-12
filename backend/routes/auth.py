import random
import string
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models import db, User
from middleware.auth import role_required

VALID_ROLES = ['fleet_manager', 'driver', 'safety_officer', 'financial_analyst']

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


def generate_otp():
    return ''.join(random.choices(string.digits, k=6))


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    email = data.get('email', '').strip().lower()
    mobile = data.get('mobile', '').strip()
    password = data.get('password', '')

    if not password:
        return jsonify({'error': 'Password is required'}), 400

    if not email and not mobile:
        return jsonify({'error': 'Email or mobile number is required'}), 400

    user = None
    if email:
        user = User.query.filter_by(email=email).first()
    elif mobile:
        user = User.query.filter_by(mobile=mobile).first()

    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid credentials'}), 401

    if not user.is_active:
        return jsonify({'error': 'Account is deactivated'}), 403

    access_token = create_access_token(identity=str(user.id))
    return jsonify({
        'token': access_token,
        'user': user.to_dict()
    }), 200


@auth_bp.route('/check-availability', methods=['POST'])
def check_availability():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    field = data.get('field', '')
    value = data.get('value', '').strip().lower() if field == 'email' else data.get('value', '').strip()

    if not field or not value:
        return jsonify({'available': True}), 200

    if field == 'email':
        exists = User.query.filter_by(email=value).first() is not None
    elif field == 'mobile':
        exists = User.query.filter_by(mobile=value).first() is not None
    else:
        return jsonify({'error': 'Invalid field'}), 400

    return jsonify({'available': not exists, 'field': field}), 200


@auth_bp.route('/send-otp', methods=['POST'])
def send_otp():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    mobile = data.get('mobile', '').strip()
    if not mobile:
        return jsonify({'error': 'Mobile number is required'}), 400

    existing = User.query.filter_by(mobile=mobile).first()
    if existing:
        return jsonify({'error': 'This mobile number is already registered'}), 409

    otp = generate_otp()

    from flask import current_app
    if not hasattr(current_app, '_otp_store'):
        current_app._otp_store = {}

    current_app._otp_store[mobile] = {
        'otp': otp,
        'expiry': (datetime.utcnow() + timedelta(minutes=5)).isoformat()
    }

    print(f'OTP for {mobile}: {otp}')

    return jsonify({
        'message': 'OTP sent successfully',
        'expires_in': 300
    }), 200


@auth_bp.route('/verify-otp', methods=['POST'])
def verify_otp():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    mobile = data.get('mobile', '').strip()
    otp = data.get('otp', '').strip()

    if not mobile or not otp:
        return jsonify({'error': 'Mobile and OTP are required'}), 400

    from flask import current_app
    otp_data = current_app._otp_store.get(mobile) if hasattr(current_app, '_otp_store') else None

    if not otp_data:
        return jsonify({'error': 'No OTP sent for this number. Please request a new OTP.'}), 400

    if otp_data['otp'] != otp:
        return jsonify({'error': 'Invalid OTP'}), 400

    expiry = datetime.fromisoformat(otp_data['expiry'])
    if datetime.utcnow() > expiry:
        del current_app._otp_store[mobile]
        return jsonify({'error': 'OTP has expired. Please request a new one.'}), 400

    del current_app._otp_store[mobile]

    return jsonify({'message': 'OTP verified successfully', 'verified': True}), 200


@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    email = data.get('email', '').strip().lower()
    mobile = data.get('mobile', '').strip()
    password = data.get('password', '')
    name = data.get('name', '').strip()
    otp = data.get('otp', '')
    role = data.get('role', 'driver').strip().lower()

    if role not in VALID_ROLES:
        return jsonify({'error': 'Invalid role. Must be one of: fleet_manager, driver, safety_officer, financial_analyst'}), 400

    if not name:
        return jsonify({'error': 'Full name is required'}), 400

    if not email and not mobile:
        return jsonify({'error': 'Email or mobile number is required'}), 400

    if not password or len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400

    if email:
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'This email is already registered'}), 409

    if mobile:
        if User.query.filter_by(mobile=mobile).first():
            return jsonify({'error': 'This mobile number is already registered'}), 409

    if mobile and not email:
        if not otp:
            return jsonify({'error': 'OTP verification is required for mobile registration'}), 400

    user = User(
        email=email or None,
        mobile=mobile or None,
        name=name,
        role=role,
        is_active=True,
        is_verified=True
    )
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    access_token = create_access_token(identity=str(user.id))
    return jsonify({
        'token': access_token,
        'user': user.to_dict(),
        'message': 'Registration successful! Welcome aboard.'
    }), 201


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_profile():
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(user.to_dict()), 200


@auth_bp.route('/admin/register', methods=['POST'])
@jwt_required()
@role_required('fleet_manager')
def admin_register():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    email = data.get('email', '').strip().lower()
    if not email:
        return jsonify({'error': 'Email is required'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'User with this email already exists'}), 409

    password = data.get('password', '')
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400

    role = data.get('role', 'driver').strip().lower()
    if role not in VALID_ROLES:
        return jsonify({'error': 'Invalid role'}), 400

    user = User(
        email=email,
        name=data.get('name', ''),
        role=role,
        is_active=True,
        is_verified=True
    )
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    access_token = create_access_token(identity=str(user.id))
    return jsonify({
        'token': access_token,
        'user': user.to_dict()
    }), 201


@auth_bp.route('/users', methods=['GET'])
@jwt_required()
def get_users():
    # All authenticated users can view the members list
    users = User.query.all()
    return jsonify({
        'users': [u.to_dict() for u in users]
    }), 200
