from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, FuelLog, Expense, Vehicle
from middleware.auth import role_required

expenses_bp = Blueprint('expenses', __name__, url_prefix='/api/expenses')


# ---- Fuel Logs ----
@expenses_bp.route('/fuel', methods=['GET'])
@jwt_required()
@role_required('fleet_manager', 'financial_analyst')
def get_fuel_logs():
    current_user_id = int(get_jwt_identity())
    vehicle_id = request.args.get('vehicle_id')
    query = FuelLog.query.filter_by(created_by=current_user_id)
    if vehicle_id:
        query = query.filter_by(vehicle_id=int(vehicle_id))
    logs = query.order_by(FuelLog.date.desc()).all()
    return jsonify([l.to_dict() for l in logs]), 200


@expenses_bp.route('/fuel', methods=['POST'])
@jwt_required()
@role_required('fleet_manager', 'financial_analyst')
def add_fuel_log():
    current_user_id = int(get_jwt_identity())
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    vehicle = Vehicle.query.get(data.get('vehicle_id'))
    if not vehicle:
        return jsonify({'error': 'Vehicle not found'}), 404

    from datetime import datetime
    log = FuelLog(
        vehicle_id=data['vehicle_id'],
        liters=data.get('liters', 0),
        cost=data.get('cost', 0),
        notes=data.get('notes', ''),
        date=datetime.strptime(data['date'], '%Y-%m-%d') if data.get('date') else datetime.utcnow(),
        created_by=current_user_id
    )
    db.session.add(log)
    db.session.commit()
    return jsonify(log.to_dict()), 201


@expenses_bp.route('/fuel/<int:log_id>', methods=['DELETE'])
@jwt_required()
@role_required('fleet_manager')
def delete_fuel_log(log_id):
    current_user_id = int(get_jwt_identity())
    log = FuelLog.query.filter_by(id=log_id, created_by=current_user_id).first_or_404()
    db.session.delete(log)
    db.session.commit()
    return jsonify({'message': 'Fuel log deleted'}), 200


# ---- Other Expenses ----
@expenses_bp.route('/other', methods=['GET'])
@jwt_required()
@role_required('fleet_manager', 'financial_analyst')
def get_other_expenses():
    current_user_id = int(get_jwt_identity())
    vehicle_id = request.args.get('vehicle_id')
    expense_type = request.args.get('expense_type')
    query = Expense.query.filter_by(created_by=current_user_id)
    if vehicle_id:
        query = query.filter_by(vehicle_id=int(vehicle_id))
    if expense_type:
        query = query.filter_by(expense_type=expense_type)
    expenses = query.order_by(Expense.date.desc()).all()
    return jsonify([e.to_dict() for e in expenses]), 200


@expenses_bp.route('/other', methods=['POST'])
@jwt_required()
@role_required('fleet_manager', 'financial_analyst')
def add_expense():
    current_user_id = int(get_jwt_identity())
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    vehicle = Vehicle.query.get(data.get('vehicle_id'))
    if not vehicle:
        return jsonify({'error': 'Vehicle not found'}), 404

    from datetime import datetime
    expense = Expense(
        vehicle_id=data['vehicle_id'],
        expense_type=data.get('expense_type', 'other'),
        amount=data.get('amount', 0),
        description=data.get('description', ''),
        date=datetime.strptime(data['date'], '%Y-%m-%d') if data.get('date') else datetime.utcnow(),
        created_by=current_user_id
    )
    db.session.add(expense)
    db.session.commit()
    return jsonify(expense.to_dict()), 201


@expenses_bp.route('/other/<int:expense_id>', methods=['DELETE'])
@jwt_required()
@role_required('fleet_manager')
def delete_expense(expense_id):
    current_user_id = int(get_jwt_identity())
    expense = Expense.query.filter_by(id=expense_id, created_by=current_user_id).first_or_404()
    db.session.delete(expense)
    db.session.commit()
    return jsonify({'message': 'Expense deleted'}), 200
