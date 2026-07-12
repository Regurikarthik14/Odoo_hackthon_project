from flask import Blueprint, request, jsonify
from models.driver import Driver
from models.db import db
from middleware.auth_middleware import jwt_required, admin_required
from datetime import datetime

drivers_bp = Blueprint('drivers', __name__, url_prefix='/api/drivers')

@drivers_bp.route('', methods=['GET'])
@jwt_required
def get_drivers():
    status = request.args.get('status')
    q = Driver.query
    if status:
        q = q.filter_by(status=status)
    ds = q.order_by(Driver.created_at.desc()).all()
    return jsonify({'drivers': [d.to_dict() for d in ds], 'total': len(ds)}), 200

@drivers_bp.route('/<int:did>', methods=['GET'])
@jwt_required
def get_driver(did):
    d = Driver.query.get(did)
    if not d:
        return jsonify({'error': 'Driver not found'}), 404
    return jsonify({'driver': d.to_dict()}), 200

@drivers_bp.route('', methods=['POST'])
@admin_required
def create_driver():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data'}), 400
    for f in ['license_number', 'phone', 'license_expiry']:
        if not data.get(f):
            return jsonify({'error': f'Missing: {f}'}), 400
    if Driver.query.filter_by(license_number=data['license_number']).first():
        return jsonify({'error': 'License number exists'}), 409
    d = Driver(user_id=data.get('user_id'), license_number=data['license_number'], phone=data['phone'],
               address=data.get('address'), emergency_contact=data.get('emergency_contact'),
               emergency_phone=data.get('emergency_phone'),
               license_expiry=datetime.strptime(data['license_expiry'], '%Y-%m-%d').date(),
               medical_expiry=datetime.strptime(data['medical_expiry'], '%Y-%m-%d').date() if data.get('medical_expiry') else None,
               safety_score=data.get('safety_score', 100.00), status=data.get('status', 'available'),
               assigned_vehicle_id=data.get('assigned_vehicle_id'))
    db.session.add(d)
    db.session.commit()
    return jsonify({'message': 'Created', 'driver': d.to_dict()}), 201

@drivers_bp.route('/<int:did>', methods=['PUT'])
@admin_required
def update_driver(did):
    d = Driver.query.get(did)
    if not d:
        return jsonify({'error': 'Not found'}), 404
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data'}), 400
    for field in ['user_id', 'phone', 'address', 'emergency_contact', 'emergency_phone', 'safety_score', 'status', 'assigned_vehicle_id']:
        if field in data:
            setattr(d, field, data[field])
    if 'license_number' in data:
        d.license_number = data['license_number']
    if 'license_expiry' in data:
        d.license_expiry = datetime.strptime(data['license_expiry'], '%Y-%m-%d').date()
    if 'medical_expiry' in data:
        d.medical_expiry = datetime.strptime(data['medical_expiry'], '%Y-%m-%d').date() if data['medical_expiry'] else None
    db.session.commit()
    return jsonify({'message': 'Updated', 'driver': d.to_dict()}), 200

@drivers_bp.route('/<int:did>', methods=['DELETE'])
@admin_required
def delete_driver(did):
    d = Driver.query.get(did)
    if not d:
        return jsonify({'error': 'Not found'}), 404
    db.session.delete(d)
    db.session.commit()
    return jsonify({'message': 'Deleted'}), 200
