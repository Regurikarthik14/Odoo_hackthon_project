from flask import Blueprint, jsonify
from sqlalchemy import func
from models.db import db
from models.vehicle import Vehicle
from models.driver import Driver
from models.trip import Trip
from models.maintenance import Maintenance
from models.fuel_log import FuelLog
from models.expense import Expense
from middleware.auth_middleware import jwt_required

reports_bp = Blueprint('reports', __name__, url_prefix='/api/reports')

@reports_bp.route('/kpi', methods=['GET'])
@jwt_required
def get_kpi():
    return jsonify({'kpi': {
        'vehicles': {'total': Vehicle.query.count(), 'available': Vehicle.query.filter_by(status='available').count(),
                     'on_trip': Vehicle.query.filter_by(status='on-trip').count(), 'in_shop': Vehicle.query.filter_by(status='in-shop').count()},
        'drivers': {'total': Driver.query.count(), 'available': Driver.query.filter_by(status='available').count()},
        'trips': {'total': Trip.query.count(), 'active': Trip.query.filter(Trip.status.in_(['planned', 'in-progress', 'delayed'])).count(),
                  'completed': Trip.query.filter_by(status='completed').count()},
        'maintenance': {'total': Maintenance.query.count(), 'pending': Maintenance.query.filter(Maintenance.status.in_(['scheduled', 'in-progress'])).count()},
        'costs': {'total_fuel_cost': float(db.session.query(func.sum(FuelLog.cost)).scalar() or 0),
                  'total_maintenance_cost': float(db.session.query(func.sum(Maintenance.cost)).scalar() or 0),
                  'total_combined': float((db.session.query(func.sum(FuelLog.cost)).scalar() or 0) + (db.session.query(func.sum(Maintenance.cost)).scalar() or 0))}
    }}), 200

@reports_bp.route('/analytics', methods=['GET'])
@jwt_required
def get_analytics():
    return jsonify({'analytics': {
        'vehicle_utilization': {'available': Vehicle.query.filter_by(status='available').count(),
                                'on_trip': Vehicle.query.filter_by(status='on-trip').count(),
                                'in_shop': Vehicle.query.filter_by(status='in-shop').count(),
                                'retired': Vehicle.query.filter_by(status='retired').count()}
    }}), 200
