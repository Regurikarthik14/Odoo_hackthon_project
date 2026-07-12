from flask import Blueprint, request, jsonify
from models.expense import Expense
from models.db import db
from middleware.auth_middleware import jwt_required
from datetime import datetime

expenses_bp = Blueprint('expenses', __name__, url_prefix='/api/expenses')

@expenses_bp.route('', methods=['GET'])
@jwt_required
def get_expenses():
    q = Expense.query
    cat = request.args.get('category')
    vid = request.args.get('vehicle_id')
    sd = request.args.get('start_date')
    ed = request.args.get('end_date')
    if cat:
        q = q.filter_by(category=cat)
    if vid:
        q = q.filter_by(vehicle_id=int(vid))
    if sd:
        q = q.filter(Expense.expense_date >= datetime.strptime(sd, '%Y-%m-%d').date())
    if ed:
        q = q.filter(Expense.expense_date <= datetime.strptime(ed, '%Y-%m-%d').date())
    exps = q.order_by(Expense.expense_date.desc()).all()
    return jsonify({'expenses': [e.to_dict() for e in exps], 'total': len(exps)}), 200

@expenses_bp.route('/<int:eid>', methods=['GET'])
@jwt_required
def get_expense(eid):
    e = Expense.query.get(eid)
    if not e:
        return jsonify({'error': 'Not found'}), 404
    return jsonify({'expense': e.to_dict()}), 200

@expenses_bp.route('', methods=['POST'])
@jwt_required
def create_expense():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data'}), 400
    for f in ['category', 'amount', 'expense_date']:
        if not data.get(f):
            return jsonify({'error': f'Missing: {f}'}), 400
    e = Expense(vehicle_id=data.get('vehicle_id'), trip_id=data.get('trip_id'), category=data['category'],
                amount=data['amount'], description=data.get('description'),
                expense_date=datetime.strptime(data['expense_date'], '%Y-%m-%d').date(),
                receipt_url=data.get('receipt_url'))
    db.session.add(e)
    db.session.commit()
    return jsonify({'message': 'Created', 'expense': e.to_dict()}), 201

@expenses_bp.route('/<int:eid>', methods=['PUT'])
@jwt_required
def update_expense(eid):
    e = Expense.query.get(eid)
    if not e:
        return jsonify({'error': 'Not found'}), 404
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data'}), 400
    for field in ['vehicle_id', 'trip_id', 'category', 'amount', 'description', 'receipt_url']:
        if field in data:
            setattr(e, field, data[field])
    if 'expense_date' in data:
        e.expense_date = datetime.strptime(data['expense_date'], '%Y-%m-%d').date()
    db.session.commit()
    return jsonify({'message': 'Updated', 'expense': e.to_dict()}), 200

@expenses_bp.route('/<int:eid>', methods=['DELETE'])
@jwt_required
def delete_expense(eid):
    e = Expense.query.get(eid)
    if not e:
        return jsonify({'error': 'Not found'}), 404
    db.session.delete(e)
    db.session.commit()
    return jsonify({'message': 'Deleted'}), 200
