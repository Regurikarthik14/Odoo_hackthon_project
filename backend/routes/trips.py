from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from models import db, Trip, Vehicle, Driver
from middleware.auth import role_required

trips_bp = Blueprint('trips', __name__, url_prefix='/api/trips')


@trips_bp.route('', methods=['GET'])
@jwt_required()
def get_trips():
    current_user_id = int(get_jwt_identity())
    status = request.args.get('status')
    query = Trip.query.filter_by(created_by=current_user_id)
    if status:
        query = query.filter_by(status=status)
    trips = query.order_by(Trip.created_at.desc()).all()
    return jsonify([t.to_dict() for t in trips]), 200


@trips_bp.route('/active', methods=['GET'])
@jwt_required()
def get_active_trips():
    current_user_id = int(get_jwt_identity())
    trips = Trip.query.filter(
        Trip.created_by == current_user_id,
        Trip.status.in_(['draft', 'dispatched'])
    ).all()
    return jsonify([t.to_dict() for t in trips]), 200


@trips_bp.route('/<int:trip_id>', methods=['GET'])
@jwt_required()
def get_trip(trip_id):
    current_user_id = int(get_jwt_identity())
    trip = Trip.query.filter_by(id=trip_id, created_by=current_user_id).first_or_404()
    return jsonify(trip.to_dict()), 200


@trips_bp.route('', methods=['POST'])
@jwt_required()
@role_required('fleet_manager', 'driver')
def create_trip():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    current_user_id = int(get_jwt_identity())

    # Validate vehicle
    vehicle_id = data.get('vehicle_id')
    vehicle = Vehicle.query.get(vehicle_id)
    if not vehicle:
        return jsonify({'error': 'Vehicle not found'}), 404
    if not vehicle.is_available_for_dispatch():
        return jsonify({'error': f'Vehicle is {vehicle.status} and not available for dispatch'}), 400
    if vehicle.is_retired() or vehicle.is_in_maintenance():
        return jsonify({'error': 'Retired or In Shop vehicles cannot be dispatched'}), 400

    # Validate driver
    driver_id = data.get('driver_id')
    driver = Driver.query.get(driver_id)
    if not driver:
        return jsonify({'error': 'Driver not found'}), 404
    is_available, msg = driver.is_available_for_trip()
    if not is_available:
        return jsonify({'error': msg}), 400

    # Validate cargo weight
    cargo_weight = data.get('cargo_weight', 0)
    if cargo_weight > vehicle.max_load_capacity:
        return jsonify({
            'error': f'Cargo weight ({cargo_weight} kg) exceeds vehicle max load capacity ({vehicle.max_load_capacity} kg)'
        }), 400

    user_id = int(get_jwt_identity())

    trip = Trip(
        source=data.get('source', ''),
        destination=data.get('destination', ''),
        cargo_weight=cargo_weight,
        planned_distance=data.get('planned_distance', 0),
        vehicle_id=vehicle_id,
        driver_id=driver_id,
        created_by=user_id,
        status='draft'
    )
    db.session.add(trip)
    db.session.commit()
    return jsonify(trip.to_dict()), 201


@trips_bp.route('/<int:trip_id>/dispatch', methods=['PUT'])
@jwt_required()
@role_required('fleet_manager', 'driver')
def dispatch_trip(trip_id):
    trip = Trip.query.get_or_404(trip_id)

    if trip.status != 'draft':
        return jsonify({'error': 'Only draft trips can be dispatched'}), 400

    vehicle = Vehicle.query.get(trip.vehicle_id)
    driver = Driver.query.get(trip.driver_id)

    if not vehicle.is_available_for_dispatch():
        return jsonify({'error': f'Vehicle is {vehicle.status}'}), 400

    is_available, msg = driver.is_available_for_trip()
    if not is_available:
        return jsonify({'error': msg}), 400

    # Dispatch: update all statuses
    trip.status = 'dispatched'
    trip.start_time = datetime.utcnow()
    vehicle.status = 'on_trip'
    driver.status = 'on_trip'

    db.session.commit()
    return jsonify(trip.to_dict()), 200


@trips_bp.route('/<int:trip_id>/complete', methods=['PUT'])
@jwt_required()
@role_required('fleet_manager', 'driver')
def complete_trip(trip_id):
    trip = Trip.query.get_or_404(trip_id)

    if trip.status != 'dispatched':
        return jsonify({'error': 'Only dispatched trips can be completed'}), 400

    data = request.get_json()
    if not data:
        return jsonify({'error': 'Final odometer and fuel consumed are required'}), 400

    vehicle = Vehicle.query.get(trip.vehicle_id)
    driver = Driver.query.get(trip.driver_id)

    trip.status = 'completed'
    trip.end_time = datetime.utcnow()
    trip.final_odometer = data.get('final_odometer', vehicle.odometer)
    trip.fuel_consumed = data.get('fuel_consumed', 0)
    trip.actual_distance = trip.final_odometer - vehicle.odometer

    # Update vehicle odometer
    vehicle.odometer = trip.final_odometer
    vehicle.status = 'available'
    driver.status = 'available'

    db.session.commit()
    return jsonify(trip.to_dict()), 200


@trips_bp.route('/<int:trip_id>/cancel', methods=['PUT'])
@jwt_required()
@role_required('fleet_manager', 'driver')
def cancel_trip(trip_id):
    trip = Trip.query.get_or_404(trip_id)

    if trip.status == 'completed':
        return jsonify({'error': 'Completed trips cannot be cancelled'}), 400

    if trip.status == 'draft' or trip.status == 'dispatched':
        trip.status = 'cancelled'
        trip.end_time = datetime.utcnow()

        # Restore vehicle and driver if they were on trip
        vehicle = Vehicle.query.get(trip.vehicle_id)
        if vehicle and vehicle.status == 'on_trip':
            vehicle.status = 'available'

        driver = Driver.query.get(trip.driver_id)
        if driver and driver.status == 'on_trip':
            driver.status = 'available'

        db.session.commit()
        return jsonify(trip.to_dict()), 200

    return jsonify({'error': 'Invalid trip status'}), 400


@trips_bp.route('/<int:trip_id>', methods=['PUT'])
@jwt_required()
@role_required('fleet_manager', 'driver')
def update_trip(trip_id):
    trip = Trip.query.get_or_404(trip_id)
    if trip.status != 'draft':
        return jsonify({'error': 'Only draft trips can be edited'}), 400

    data = request.get_json()
    for field in ['source', 'destination', 'cargo_weight', 'planned_distance']:
        if field in data:
            setattr(trip, field, data[field])

    if 'vehicle_id' in data:
        vehicle = Vehicle.query.get(data['vehicle_id'])
        if vehicle and not vehicle.is_available_for_dispatch():
            return jsonify({'error': 'Selected vehicle is not available'}), 400
        if data.get('cargo_weight', trip.cargo_weight) > (vehicle.max_load_capacity if vehicle else 0):
            return jsonify({'error': 'Cargo weight exceeds vehicle capacity'}), 400
        trip.vehicle_id = data['vehicle_id']

    if 'driver_id' in data:
        driver = Driver.query.get(data['driver_id'])
        if driver:
            is_available, msg = driver.is_available_for_trip()
            if not is_available:
                return jsonify({'error': msg}), 400
        trip.driver_id = data['driver_id']

    db.session.commit()
    return jsonify(trip.to_dict()), 200
