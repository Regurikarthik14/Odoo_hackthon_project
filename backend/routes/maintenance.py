from flask import Blueprint, request, jsonify
from models.maintenance import Maintenance
from models.vehicle import Vehicle
from models.db import db
from middleware.auth_middleware import jwt_required, admin_required
from datetime import datetime

maintenance_bp = Blueprint('maintenance', __name__, url_prefix='/api/maintenance')

@maintenance_bp.route('', methods=['GET'])
@jwt_required
def get_maintenance():
    q = Maintenance.query
    for param, field in [('status', 'status'), ('vehicle_id', 'vehicle_id'), ('type', 'type')]:
        val = request.args.get(param)
        if val:
            q = q.filter_by(**{field: int(val) if param == 'vehicle_id' else val})
    rs = q.order_by(Maintenance.service_date.desc()).all()
    return jsonify({'maintenance': [r.to_dict() for r in rs], 'total': len(rs)}), 200

@maintenance_bp.route('/<int:rid>', methods=['GET'])
@jwt_required
def get_record(rid):
    r = Maintenance.query.get(rid)
    if not r:
        return jsonify({'error': 'Not found'}), 404
    return jsonify({'maintenance': r.to_dict()}), 200

@maintenance_bp.route('', methods=['POST'])
@jwt_required
def create_maintenance():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data'}), 400
    for f in ['vehicle_id', 'description', 'service_date']:
        if not data.get(f):
            return jsonify({'error': f'Missing: {f}'}), 400
    v = Vehicle.query.get(data['vehicle_id'])
    if not v:
        return jsonify({'error': 'Vehicle not found'}), 404
    r = Maintenance(vehicle_id=data['vehicle_id'], type=data.get('type', 'routine'), description=data['description'],
                    service_date=datetime.strptime(data['service_date'], '%Y-%m-%d').date(),
                    cost=data.get('cost', 0), service_provider=data.get('service_provider'),
                    odometer_at_service=data.get('odometer_at_service'), status=data.get('status', 'scheduled'), notes=data.get('notes'))
    if data.get('completion_date'):
        r.completion_date = datetime.strptime(data['completion_date'], '%Y-%m-%d').date()
    db.session.add(r)
    if r.status in ('scheduled', 'in-progress') and v.status == 'available':
        v.status = 'in-shop'
    db.session.commit()
    return jsonify({'message': 'Created', 'maintenance': r.to_dict()}), 201

@maintenance_bp.route('/<int:rid>', methods=['PUT'])
@jwt_required
def update_maintenance(rid):
    r = Maintenance.query.get(rid)
    if not r:
        return jsonify({'error': 'Not found'}), 404
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data'}), 400
    v = Vehicle.query.get(r.vehicle_id)
    for field in ['type', 'description', 'cost', 'service_provider', 'odometer_at_service', 'notes']:
        if field in data:
            setattr(r, field, data[field])
    if 'service_date' in data:
        r.service_date = datetime.strptime(data['service_date'], '%Y-%m-%d').date()
    if 'completion_date' in data:
        r.completion_date = datetime.strptime(data['completion_date'], '%Y-%m-%d').date() if data['completion_date'] else None
    if 'status' in data:
        old = r.status
        r.status = data['status']
        if v and data['status'] == 'completed' and old != 'completed':
            v.last_maintenance_date = r.completion_date or r.service_date
            if v.status == 'in-shop':
                v.status = 'available'
        elif v and data['status'] in ('scheduled', 'in-progress') and v.status == 'available':
            v.status = 'in-shop'
    db.session.commit()
    return jsonify({'message': 'Updated', 'maintenance': r.to_dict()}), 200

@maintenance_bp.route('/<int:rid>', methods=['DELETE'])
@admin_required
def delete_maintenance(rid):
    r = Maintenance.query.get(rid)
    if not r:
        return jsonify({'error': 'Not found'}), 404
    v = Vehicle.query.get(r.vehicle_id)
    if v and v.status == 'in-shop':
        other = Maintenance.query.filter(Maintenance.vehicle_id == r.vehicle_id, Maintenance.id != r.id,
                                         Maintenance.status.in_(['scheduled', 'in-progress'])).first()
        if not other:
            v.status = 'available'
    db.session.delete(r)
    db.session.commit()
    return jsonify({'message': 'Deleted'}), 200
