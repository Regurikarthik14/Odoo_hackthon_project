from datetime import datetime
from . import db


class Vehicle(db.Model):
    __tablename__ = 'vehicles'

    id = db.Column(db.Integer, primary_key=True)
    registration_number = db.Column(db.String(50), unique=True, nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)
    model = db.Column(db.String(100))
    vehicle_type = db.Column(db.String(50), default='truck')
    max_load_capacity = db.Column(db.Float, nullable=False)  # kg
    odometer = db.Column(db.Float, default=0.0)  # km
    acquisition_cost = db.Column(db.Float, default=0.0)
    status = db.Column(db.String(20), default='available')
    # statuses: available, on_trip, in_shop, retired
    region = db.Column(db.String(50), default='unknown')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    trips = db.relationship('Trip', backref='vehicle', lazy='dynamic')
    maintenance_records = db.relationship('MaintenanceRecord', backref='vehicle', lazy='dynamic')
    fuel_logs = db.relationship('FuelLog', backref='vehicle', lazy='dynamic')

    def to_dict(self):
        return {
            'id': self.id,
            'registration_number': self.registration_number,
            'name': self.name,
            'model': self.model,
            'vehicle_type': self.vehicle_type,
            'max_load_capacity': self.max_load_capacity,
            'odometer': self.odometer,
            'acquisition_cost': self.acquisition_cost,
            'status': self.status,
            'region': self.region,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    def is_available_for_dispatch(self):
        return self.status == 'available'

    def is_in_maintenance(self):
        return self.status == 'in_shop'

    def is_retired(self):
        return self.status == 'retired'
