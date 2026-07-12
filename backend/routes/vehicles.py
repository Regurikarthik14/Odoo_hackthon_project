from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models import db, Vehicle
from middleware.auth import role_required

vehicles_bp = Blueprint('vehicles', __name__, url_prefix='/api/vehicles')


@vehicles_bp.route('', methods=['GET'])
@jwt_required()
def get_vehicles():
    status = request.args.get('status')
    vehicle_type = request.args.get('vehicle_type')
    region = request.args.get('region')

    query = Vehicle.query
    if status:
        query = query.filter_by(status=status)
    if vehicle_type:
        query = query.filter_by(vehicle_type=vehicle_type)
    if region:
        query = query.filter_by(region=region)

    vehicles = query.order_by(Vehicle.created_at.desc()).all()
    return jsonify([v.to_dict() for v in vehicles]), 200


@vehicles_bp.route('/available', methods=['GET'])
@jwt_required()
def get_available_vehicles():
    vehicles = Vehicle.query.filter_by(status='available').all()
    return jsonify([v.to_dict() for v in vehicles]), 200


@vehicles_bp.route('/<int:vehicle_id>', methods=['GET'])
@jwt_required()
def get_vehicle(vehicle_id):
    vehicle = Vehicle.query.get_or_404(vehicle_id)
    return jsonify(vehicle.to_dict()), 200


@vehicles_bp.route('', methods=['POST'])
@jwt_required()
@role_required('fleet_manager')
def create_vehicle():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    reg_num = data.get('registration_number', '').strip()
    if not reg_num:
        return jsonify({'error': 'Registration number is required'}), 400

    if Vehicle.query.filter_by(registration_number=reg_num).first():
        return jsonify({'error': 'Vehicle with this registration number already exists'}), 409

    vehicle = Vehicle(
        registration_number=reg_num,
        name=data.get('name', ''),
        model=data.get('model', ''),
        vehicle_type=data.get('vehicle_type', 'truck'),
        max_load_capacity=data.get('max_load_capacity', 0),
        odometer=data.get('odometer', 0),
        acquisition_cost=data.get('acquisition_cost', 0),
        region=data.get('region', 'unknown'),
        status=data.get('status', 'available')
    )
    db.session.add(vehicle)
    db.session.commit()
    return jsonify(vehicle.to_dict()), 201


@vehicles_bp.route('/<int:vehicle_id>', methods=['PUT'])
@jwt_required()
@role_required('fleet_manager')
def update_vehicle(vehicle_id):
    vehicle = Vehicle.query.get_or_404(vehicle_id)
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    if 'registration_number' in data:
        new_reg = data['registration_number'].strip()
        existing = Vehicle.query.filter_by(registration_number=new_reg).first()
        if existing and existing.id != vehicle_id:
            return jsonify({'error': 'Registration number already in use'}), 409
        vehicle.registration_number = new_reg

    for field in ['name', 'model', 'vehicle_type', 'max_load_capacity',
                  'odometer', 'acquisition_cost', 'status', 'region']:
        if field in data:
            setattr(vehicle, field, data[field])

    db.session.commit()
    return jsonify(vehicle.to_dict()), 200


@vehicles_bp.route('/<int:vehicle_id>', methods=['DELETE'])
@jwt_required()
@role_required('fleet_manager')
def delete_vehicle(vehicle_id):
    vehicle = Vehicle.query.get_or_404(vehicle_id)
    db.session.delete(vehicle)
    db.session.commit()
    return jsonify({'message': 'Vehicle deleted successfully'}), 200
