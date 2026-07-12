from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from datetime import datetime
from models import db, MaintenanceRecord, Vehicle
from middleware.auth import role_required

maintenance_bp = Blueprint('maintenance', __name__, url_prefix='/api/maintenance')


@maintenance_bp.route('', methods=['GET'])
@jwt_required()
def get_maintenance_records():
    status = request.args.get('status')
    vehicle_id = request.args.get('vehicle_id')
    query = MaintenanceRecord.query
    if status:
        query = query.filter_by(status=status)
    if vehicle_id:
        query = query.filter_by(vehicle_id=int(vehicle_id))
    records = query.order_by(MaintenanceRecord.created_at.desc()).all()
    return jsonify([r.to_dict() for r in records]), 200


@maintenance_bp.route('/active', methods=['GET'])
@jwt_required()
def get_active_maintenance():
    records = MaintenanceRecord.query.filter_by(status='active').all()
    return jsonify([r.to_dict() for r in records]), 200


@maintenance_bp.route('/<int:record_id>', methods=['GET'])
@jwt_required()
def get_maintenance_record(record_id):
    record = MaintenanceRecord.query.get_or_404(record_id)
    return jsonify(record.to_dict()), 200


@maintenance_bp.route('', methods=['POST'])
@jwt_required()
@role_required('fleet_manager')
def create_maintenance_record():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    vehicle_id = data.get('vehicle_id')
    vehicle = Vehicle.query.get(vehicle_id)
    if not vehicle:
        return jsonify({'error': 'Vehicle not found'}), 404

    if vehicle.is_retired():
        return jsonify({'error': 'Cannot add retired vehicle to maintenance'}), 400

    record = MaintenanceRecord(
        vehicle_id=vehicle_id,
        description=data.get('description', ''),
        maintenance_type=data.get('maintenance_type', 'Other'),
        cost=data.get('cost', 0),
        notes=data.get('notes', ''),
        status='active'
    )

    # Auto-change vehicle status to in_shop
    vehicle.status = 'in_shop'

    db.session.add(record)
    db.session.commit()
    return jsonify(record.to_dict()), 201


@maintenance_bp.route('/<int:record_id>/close', methods=['PUT'])
@jwt_required()
@role_required('fleet_manager')
def close_maintenance(record_id):
    record = MaintenanceRecord.query.get_or_404(record_id)

    if record.status != 'active':
        return jsonify({'error': 'Maintenance record is not active'}), 400

    record.status = 'closed'
    record.end_date = datetime.utcnow()

    # Restore vehicle to available (unless retired)
    vehicle = Vehicle.query.get(record.vehicle_id)
    if vehicle and not vehicle.is_retired():
        vehicle.status = 'available'

    db.session.commit()
    return jsonify(record.to_dict()), 200


@maintenance_bp.route('/<int:record_id>', methods=['PUT'])
@jwt_required()
@role_required('fleet_manager')
def update_maintenance_record(record_id):
    record = MaintenanceRecord.query.get_or_404(record_id)
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    for field in ['description', 'maintenance_type', 'cost', 'notes']:
        if field in data:
            setattr(record, field, data[field])

    db.session.commit()
    return jsonify(record.to_dict()), 200


@maintenance_bp.route('/<int:record_id>', methods=['DELETE'])
@jwt_required()
@role_required('fleet_manager')
def delete_maintenance_record(record_id):
    record = MaintenanceRecord.query.get_or_404(record_id)
    db.session.delete(record)
    db.session.commit()
    return jsonify({'message': 'Maintenance record deleted'}), 200
