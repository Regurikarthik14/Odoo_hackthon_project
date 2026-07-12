from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models import db, Vehicle, Driver, Trip, MaintenanceRecord
from sqlalchemy import func

dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/api/dashboard')


@dashboard_bp.route('/kpis', methods=['GET'])
@jwt_required()
def get_kpis():
    vehicle_type = request.args.get('vehicle_type')
    status = request.args.get('status')
    region = request.args.get('region')

    # Build vehicle query with filters
    v_query = Vehicle.query
    if vehicle_type:
        v_query = v_query.filter_by(vehicle_type=vehicle_type)
    if status:
        v_query = v_query.filter_by(status=status)
    if region:
        v_query = v_query.filter_by(region=region)

    total_vehicles = v_query.count()
    active_vehicles = v_query.filter(Vehicle.status == 'on_trip').count()
    available_vehicles = v_query.filter(Vehicle.status == 'available').count()
    vehicles_in_maintenance = v_query.filter(Vehicle.status == 'in_shop').count()

    # Drivers
    total_drivers = Driver.query.count()
    drivers_on_duty = Driver.query.filter(Driver.status == 'on_trip').count()
    available_drivers = Driver.query.filter(Driver.status == 'available').count()

    # Trips
    active_trips = Trip.query.filter(Trip.status == 'dispatched').count()
    pending_trips = Trip.query.filter(Trip.status == 'draft').count()
    completed_trips = Trip.query.filter(Trip.status == 'completed').count()

    # Fleet utilization
    fleet_utilization = round(
        (active_vehicles / total_vehicles * 100) if total_vehicles > 0 else 0,
        1
    )

    return jsonify({
        'total_vehicles': total_vehicles,
        'active_vehicles': active_vehicles,
        'available_vehicles': available_vehicles,
        'vehicles_in_maintenance': vehicles_in_maintenance,
        'total_drivers': total_drivers,
        'drivers_on_duty': drivers_on_duty,
        'available_drivers': available_drivers,
        'active_trips': active_trips,
        'pending_trips': pending_trips,
        'completed_trips': completed_trips,
        'fleet_utilization': fleet_utilization
    }), 200


@dashboard_bp.route('/recent-activity', methods=['GET'])
@jwt_required()
def get_recent_activity():
    recent_trips = Trip.query.order_by(Trip.created_at.desc()).limit(5).all()
    return jsonify([t.to_dict() for t in recent_trips]), 200
