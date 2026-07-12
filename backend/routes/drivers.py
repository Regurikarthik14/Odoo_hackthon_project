from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import date
from models import db, Driver
from middleware.auth import role_required

drivers_bp = Blueprint('drivers', __name__, url_prefix='/api/drivers')


@drivers_bp.route('', methods=['GET'])
@jwt_required()
def get_drivers():
    current_user_id = int(get_jwt_identity())
    status = request.args.get('status')
    query = Driver.query.filter_by(created_by=current_user_id)
    if status:
        query = query.filter_by(status=status)
    drivers = query.order_by(Driver.created_at.desc()).all()
    return jsonify([d.to_dict() for d in drivers]), 200


@drivers_bp.route('/available', methods=['GET'])
@jwt_required()
def get_available_drivers():
    current_user_id = int(get_jwt_identity())
    today = date.today()
    drivers = Driver.query.filter(
        Driver.created_by == current_user_id,
        Driver.status == 'available',
        Driver.license_expiry_date >= today
    ).all()
    return jsonify([d.to_dict() for d in drivers]), 200


@drivers_bp.route('/<int:driver_id>', methods=['GET'])
@jwt_required()
def get_driver(driver_id):
    current_user_id = int(get_jwt_identity())
    driver = Driver.query.filter_by(id=driver_id, created_by=current_user_id).first_or_404()
    return jsonify(driver.to_dict()), 200


@drivers_bp.route('', methods=['POST'])
@jwt_required()
@role_required('fleet_manager', 'safety_officer')
def create_driver():
    current_user_id = int(get_jwt_identity())
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    license_num = data.get('license_number', '').strip()
    if not license_num:
        return jsonify({'error': 'License number is required'}), 400

    if Driver.query.filter_by(license_number=license_num).first():
        return jsonify({'error': 'Driver with this license number already exists'}), 409

    from datetime import datetime
    expiry_str = data.get('license_expiry_date')
    expiry_date = None
    if expiry_str:
        try:
            expiry_date = datetime.strptime(expiry_str, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format, use YYYY-MM-DD'}), 400

    driver = Driver(
        name=data.get('name', ''),
        license_number=license_num,
        license_category=data.get('license_category', 'B'),
        license_expiry_date=expiry_date,
        contact_number=data.get('contact_number', ''),
        safety_score=data.get('safety_score', 100.0),
        status=data.get('status', 'available'),
        created_by=current_user_id
    )
    db.session.add(driver)
    db.session.commit()
    return jsonify(driver.to_dict()), 201


@drivers_bp.route('/<int:driver_id>', methods=['PUT'])
@jwt_required()
@role_required('fleet_manager', 'safety_officer')
def update_driver(driver_id):
    current_user_id = int(get_jwt_identity())
    driver = Driver.query.filter_by(id=driver_id, created_by=current_user_id).first_or_404()
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    if 'license_number' in data:
        new_license = data['license_number'].strip()
        existing = Driver.query.filter_by(license_number=new_license).first()
        if existing and existing.id != driver_id:
            return jsonify({'error': 'License number already in use'}), 409
        driver.license_number = new_license

    from datetime import datetime
    for field in ['name', 'license_category', 'contact_number', 'safety_score', 'status']:
        if field in data:
            setattr(driver, field, data[field])

    if 'license_expiry_date' in data and data['license_expiry_date']:
        try:
            driver.license_expiry_date = datetime.strptime(
                data['license_expiry_date'], '%Y-%m-%d'
            ).date()
        except ValueError:
            return jsonify({'error': 'Invalid date format, use YYYY-MM-DD'}), 400

    db.session.commit()
    return jsonify(driver.to_dict()), 200


@drivers_bp.route('/<int:driver_id>', methods=['DELETE'])
@jwt_required()
@role_required('fleet_manager')
def delete_driver(driver_id):
    current_user_id = int(get_jwt_identity())
    driver = Driver.query.filter_by(id=driver_id, created_by=current_user_id).first_or_404()
    db.session.delete(driver)
    db.session.commit()
    return jsonify({'message': 'Driver deleted successfully'}), 200
