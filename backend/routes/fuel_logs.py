from flask import Blueprint, request, jsonify
from models.fuel_log import FuelLog
from models.db import db
from middleware.auth_middleware import jwt_required
from datetime import datetime

fuel_logs_bp = Blueprint('fuel_logs', __name__, url_prefix='/api/fuel-logs')

@fuel_logs_bp.route('', methods=['GET'])
@jwt_required
def get_fuel_logs():
    q = FuelLog.query
    vid = request.args.get('vehicle_id')
    did = request.args.get('driver_id')
    if vid:
        q = q.filter_by(vehicle_id=int(vid))
    if did:
        q = q.filter_by(driver_id=int(did))
    logs = q.order_by(FuelLog.refuel_date.desc()).all()
    return jsonify({'fuel_logs': [l.to_dict() for l in logs], 'total': len(logs)}), 200

@fuel_logs_bp.route('/<int:lid>', methods=['GET'])
@jwt_required
def get_fuel_log(lid):
    l = FuelLog.query.get(lid)
    if not l:
        return jsonify({'error': 'Not found'}), 404
    return jsonify({'fuel_log': l.to_dict()}), 200

@fuel_logs_bp.route('', methods=['POST'])
@jwt_required
def create_fuel_log():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data'}), 400
    for f in ['vehicle_id', 'fuel_type', 'liters', 'cost']:
        if not data.get(f):
            return jsonify({'error': f'Missing: {f}'}), 400
    l = FuelLog(vehicle_id=data['vehicle_id'], driver_id=data.get('driver_id'), fuel_type=data['fuel_type'],
                liters=data['liters'], cost=data['cost'], odometer_km=data.get('odometer_km'),
                station_name=data.get('station_name'), station_location=data.get('station_location'), notes=data.get('notes'))
    if data.get('refuel_date'):
        l.refuel_date = datetime.fromisoformat(data['refuel_date'])
    db.session.add(l)
    db.session.commit()
    return jsonify({'message': 'Created', 'fuel_log': l.to_dict()}), 201

@fuel_logs_bp.route('/<int:lid>', methods=['PUT'])
@jwt_required
def update_fuel_log(lid):
    l = FuelLog.query.get(lid)
    if not l:
        return jsonify({'error': 'Not found'}), 404
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data'}), 400
    for field in ['vehicle_id', 'driver_id', 'fuel_type', 'liters', 'cost', 'odometer_km', 'station_name', 'station_location', 'notes']:
        if field in data:
            setattr(l, field, data[field])
    if 'refuel_date' in data:
        l.refuel_date = datetime.fromisoformat(data['refuel_date']) if data['refuel_date'] else l.refuel_date
    db.session.commit()
    return jsonify({'message': 'Updated', 'fuel_log': l.to_dict()}), 200

@fuel_logs_bp.route('/<int:lid>', methods=['DELETE'])
@jwt_required
def delete_fuel_log(lid):
    l = FuelLog.query.get(lid)
    if not l:
        return jsonify({'error': 'Not found'}), 404
    db.session.delete(l)
    db.session.commit()
    return jsonify({'message': 'Deleted'}), 200
