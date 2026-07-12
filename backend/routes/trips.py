from flask import Blueprint, request, jsonify
from models.trip import Trip
from models.vehicle import Vehicle
from models.db import db
from middleware.auth_middleware import jwt_required, admin_required
from datetime import datetime

trips_bp = Blueprint('trips', __name__, url_prefix='/api/trips')

@trips_bp.route('', methods=['GET'])
@jwt_required
def get_trips():
    q = Trip.query
    for param, field in [('status', 'status'), ('vehicle_id', 'vehicle_id'), ('driver_id', 'driver_id')]:
        val = request.args.get(param)
        if val:
            q = q.filter_by(**{field: int(val) if param != 'status' else val})
    ts = q.order_by(Trip.created_at.desc()).all()
    return jsonify({'trips': [t.to_dict() for t in ts], 'total': len(ts)}), 200

@trips_bp.route('/<int:tid>', methods=['GET'])
@jwt_required
def get_trip(tid):
    t = Trip.query.get(tid)
    if not t:
        return jsonify({'error': 'Trip not found'}), 404
    return jsonify({'trip': t.to_dict()}), 200

@trips_bp.route('', methods=['POST'])
@jwt_required
def create_trip():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data'}), 400
    for f in ['vehicle_id', 'driver_id', 'route_origin', 'route_destination']:
        if not data.get(f):
            return jsonify({'error': f'Missing: {f}'}), 400
    v = Vehicle.query.get(data['vehicle_id'])
    if not v:
        return jsonify({'error': 'Vehicle not found'}), 404
    if v.status != 'available':
        return jsonify({'error': f'Vehicle status: {v.status}'}), 400
    t = Trip(vehicle_id=data['vehicle_id'], driver_id=data['driver_id'], route_origin=data['route_origin'],
             route_destination=data['route_destination'], cargo_description=data.get('cargo_description'),
             cargo_weight_kg=data.get('cargo_weight_kg'), distance_km=data.get('distance_km'),
             status=data.get('status', 'planned'), notes=data.get('notes'))
    if data.get('start_time'):
        t.start_time = datetime.fromisoformat(data['start_time'])
    db.session.add(t)
    if t.status == 'in-progress':
        v.status = 'on-trip'
    db.session.commit()
    return jsonify({'message': 'Created', 'trip': t.to_dict()}), 201

@trips_bp.route('/<int:tid>', methods=['PUT'])
@jwt_required
def update_trip(tid):
    t = Trip.query.get(tid)
    if not t:
        return jsonify({'error': 'Not found'}), 404
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data'}), 400
    v = Vehicle.query.get(t.vehicle_id)
    for field in ['route_origin', 'route_destination', 'cargo_description', 'cargo_weight_kg', 'distance_km', 'notes']:
        if field in data:
            setattr(t, field, data[field])
    if 'status' in data:
        old = t.status
        t.status = data['status']
        if v:
            if data['status'] == 'in-progress' and old != 'in-progress':
                v.status = 'on-trip'
            elif data['status'] in ('completed', 'cancelled') and old in ('in-progress', 'planned', 'delayed'):
                v.status = 'available'
    if 'start_time' in data:
        t.start_time = datetime.fromisoformat(data['start_time']) if data['start_time'] else None
    if 'end_time' in data:
        t.end_time = datetime.fromisoformat(data['end_time']) if data['end_time'] else None
    db.session.commit()
    return jsonify({'message': 'Updated', 'trip': t.to_dict()}), 200

@trips_bp.route('/<int:tid>', methods=['DELETE'])
@admin_required
def delete_trip(tid):
    t = Trip.query.get(tid)
    if not t:
        return jsonify({'error': 'Not found'}), 404
    v = Vehicle.query.get(t.vehicle_id)
    if v and v.status == 'on-trip':
        v.status = 'available'
    db.session.delete(t)
    db.session.commit()
    return jsonify({'message': 'Deleted'}), 200
