import csv
from io import StringIO
from flask import Blueprint, request, jsonify, Response
from flask_jwt_extended import jwt_required
from models import db, Vehicle, Trip, FuelLog, Expense, MaintenanceRecord
from middleware.auth import role_required
from sqlalchemy import func

reports_bp = Blueprint('reports', __name__, url_prefix='/api/reports')


@reports_bp.route('/summary', methods=['GET'])
@jwt_required()
@role_required('fleet_manager', 'financial_analyst')
def get_report_summary():
    vehicle_id = request.args.get('vehicle_id')

    # Build aggregate queries
    total_fuel = db.session.query(func.sum(FuelLog.liters))
    if vehicle_id:
        total_fuel = total_fuel.filter(FuelLog.vehicle_id == int(vehicle_id))
    total_fuel = total_fuel.scalar() or 0

    total_distance = db.session.query(func.sum(Trip.actual_distance)).filter(Trip.status == 'completed')
    if vehicle_id:
        total_distance = total_distance.filter(Trip.vehicle_id == int(vehicle_id))
    total_distance = total_distance.scalar() or 0

    fuel_efficiency = round(total_distance / total_fuel, 2) if total_fuel > 0 else 0

    # Costs
    total_fuel_cost = db.session.query(func.sum(FuelLog.cost))
    if vehicle_id:
        total_fuel_cost = total_fuel_cost.filter(FuelLog.vehicle_id == int(vehicle_id))
    total_fuel_cost = total_fuel_cost.scalar() or 0

    total_maint_cost = db.session.query(func.sum(MaintenanceRecord.cost)).filter(MaintenanceRecord.status == 'closed')
    if vehicle_id:
        total_maint_cost = total_maint_cost.filter(MaintenanceRecord.vehicle_id == int(vehicle_id))
    total_maint_cost = total_maint_cost.scalar() or 0

    total_other_expenses = db.session.query(func.sum(Expense.amount))
    if vehicle_id:
        total_other_expenses = total_other_expenses.filter(Expense.vehicle_id == int(vehicle_id))
    total_other_expenses = total_other_expenses.scalar() or 0

    total_operational_cost = total_fuel_cost + total_maint_cost + total_other_expenses

    # Fleet utilization
    total_vehicles = Vehicle.query.count()
    active_vehicles = Vehicle.query.filter_by(status='on_trip').count()
    fleet_utilization = round((active_vehicles / total_vehicles * 100), 1) if total_vehicles > 0 else 0

    per_vehicle_data = []
    if not vehicle_id:
        vehicles = Vehicle.query.all()
        for v in vehicles:
            v_fuel = db.session.query(func.sum(FuelLog.cost)).filter_by(vehicle_id=v.id).scalar() or 0
            v_maint = db.session.query(func.sum(MaintenanceRecord.cost)).filter(
                MaintenanceRecord.vehicle_id == v.id,
                MaintenanceRecord.status == 'closed'
            ).scalar() or 0
            v_trips = Trip.query.filter_by(vehicle_id=v.id, status='completed').count()

            revenue = v_trips * 500  # estimated revenue per trip
            total_cost = v_fuel + v_maint
            roi = round(
                (revenue - total_cost) / v.acquisition_cost * 100, 1
            ) if v.acquisition_cost > 0 else 0

            per_vehicle_data.append({
                'vehicle_id': v.id,
                'registration': v.registration_number,
                'name': v.name,
                'total_fuel_cost': round(v_fuel, 2),
                'total_maintenance_cost': round(v_maint, 2),
                'total_operational_cost': round(v_fuel + v_maint, 2),
                'completed_trips': v_trips,
                'estimated_revenue': revenue,
                'roi_percentage': roi
            })

    return jsonify({
        'fuel_efficiency': fuel_efficiency,
        'total_fuel_consumed': round(total_fuel, 2),
        'total_distance_traveled': round(total_distance, 2),
        'total_fuel_cost': round(total_fuel_cost, 2),
        'total_maintenance_cost': round(total_maint_cost, 2),
        'total_other_expenses': round(total_other_expenses, 2),
        'total_operational_cost': round(total_operational_cost, 2),
        'fleet_utilization': fleet_utilization,
        'per_vehicle': per_vehicle_data
    }), 200


@reports_bp.route('/export/csv', methods=['GET'])
@jwt_required()
@role_required('fleet_manager', 'financial_analyst')
def export_csv():
    report_type = request.args.get('type', 'vehicles')

    if report_type == 'vehicles':
        vehicles = Vehicle.query.all()
        output = StringIO()
        writer = csv.writer(output)
        writer.writerow(['ID', 'Registration', 'Name', 'Model', 'Type', 'Max Load (kg)',
                         'Odometer (km)', 'Acquisition Cost ($)', 'Status', 'Region'])
        for v in vehicles:
            writer.writerow([v.id, v.registration_number, v.name, v.model, v.vehicle_type,
                           v.max_load_capacity, v.odometer, v.acquisition_cost, v.status, v.region])
        csv_content = output.getvalue()

    elif report_type == 'trips':
        trips = Trip.query.order_by(Trip.created_at.desc()).all()
        output = StringIO()
        writer = csv.writer(output)
        writer.writerow(['ID', 'Source', 'Destination', 'Cargo (kg)', 'Distance (km)',
                         'Vehicle', 'Driver', 'Status', 'Fuel (L)', 'Start', 'End'])
        for t in trips:
            writer.writerow([t.id, t.source, t.destination, t.cargo_weight,
                           t.actual_distance or t.planned_distance,
                           t.vehicle.registration_number if t.vehicle else '',
                           t.driver.name if t.driver else '',
                           t.status, t.fuel_consumed,
                           t.start_time.isoformat() if t.start_time else '',
                           t.end_time.isoformat() if t.end_time else ''])
        csv_content = output.getvalue()

    elif report_type == 'expenses':
        expenses = Expense.query.order_by(Expense.date.desc()).all()
        output = StringIO()
        writer = csv.writer(output)
        writer.writerow(['ID', 'Vehicle', 'Type', 'Amount ($)', 'Date', 'Description'])
        for e in expenses:
            writer.writerow([e.id, e.vehicle.registration_number if e.vehicle else '',
                           e.expense_type, e.amount,
                           e.date.isoformat() if e.date else '', e.description or ''])
        csv_content = output.getvalue()

    else:
        return jsonify({'error': 'Invalid report type. Use: vehicles, trips, expenses'}), 400

    return Response(
        csv_content,
        mimetype='text/csv',
        headers={'Content-disposition': f'attachment; filename={report_type}_report.csv'}
    )
