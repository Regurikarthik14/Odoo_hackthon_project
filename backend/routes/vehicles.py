from flask import Blueprint, request, jsonify
from models.vehicle import Vehicle
from models.db import db
from middleware.auth_middleware import jwt_required, admin_required
from datetime import datetime

vehicles_bp = Blueprint('vehicles', __name__, url_prefix='/api/vehicles')

@vehicles_bp.route('', methods=['GET'])
@jwt_required
def get_vehicles():
    status = request.args.get('status')
    q = Vehicle.query
    if status:
        q = q.filter_by(status=status)
    vs = q.order_by(Vehicle.created_at.desc()).all()
    return jsonify({'vehicles': [v.to_dict() for v in vs], 'total': len(vs)}), 200

@vehicles_bp.route('/<int:vid>', methods=['GET'])
@jwt_required
def get_vehicle(vid):
    v = Vehicle.query.get(vid)
    if not v:
        return jsonify({'error': 'Vehicle not found'}), 404
    return jsonify({'vehicle': v.to_dict()}), 200

@vehicles_bp.route('', methods=['POST'])
@admin_required
def create_vehicle():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data'}), 400
    for f in ['registration_number', 'make', 'model', 'year', 'capacity_kg']:
        if not data.get(f):
            return jsonify({'error': f'Missing: {f}'}), 400
    if Vehicle.query.filter_by(registration_number=data['registration_number']).first():
        return jsonify({'error': 'Registration number exists'}), 409
    v = Vehicle(registration_number=data['registration_number'], make=data['make'], model=data['model'],
                year=data['year'], capacity_kg=data['capacity_kg'], fuel_type=data.get('fuel_type', 'diesel'),
                status=data.get('status', 'available'), odometer_km=data.get('odometer_km', 0))
    if data.get('last_maintenance_date'):
        v.last_maintenance_date = datetime.strptime(data['last_maintenance_date'], '%Y-%m-%d').date()
    if data.get('next_maintenance_date'):
        v.next_maintenance_date = datetime.strptime(data['next_maintenance_date'], '%Y-%m-%d').date()
    db.session.add(v)
    db.session.commit()
    return jsonify({'message': 'Created', 'vehicle': v.to_dict()}), 201

@vehicles_bp.route('/<int:vid>', methods=['PUT'])
@admin_required
def update_vehicle(vid):
    v = Vehicle.query.get(vid)
    if not v:
        return jsonify({'error': 'Not found'}), 404
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data'}), 400
    for field in ['registration_number', 'make', 'model', 'year', 'capacity_kg', 'fuel_type', 'status', 'odometer_km']:
        if field in data:
            setattr(v, field, data[field])
    for d_field, obj_field in [('last_maintenance_date', 'last_maintenance_date'), ('next_maintenance_date', 'next_maintenance_date')]:
        if d_field in data:
            setattr(v, obj_field, datetime.strptime(data[d_field], '%Y-%m-%d').date() if data[d_field] else None)
    db.session.commit()
    return jsonify({'message': 'Updated', 'vehicle': v.to_dict()}), 200

@vehicles_bp.route('/<int:vid>', methods=['DELETE'])
@admin_required
def delete_vehicle(vid):
    v = Vehicle.query.get(vid)
    if not v:
        return jsonify({'error': 'Not found'}), 404
    db.session.delete(v)
    db.session.commit()
    return jsonify({'message': 'Deleted'}), 200
