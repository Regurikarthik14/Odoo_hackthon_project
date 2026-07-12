from datetime import datetime
from . import db


class Trip(db.Model):
    __tablename__ = 'trips'

    id = db.Column(db.Integer, primary_key=True)
    source = db.Column(db.String(200), nullable=False)
    destination = db.Column(db.String(200), nullable=False)
    cargo_weight = db.Column(db.Float, nullable=False)  # kg
    planned_distance = db.Column(db.Float, default=0.0)  # km
    actual_distance = db.Column(db.Float, default=0.0)
    status = db.Column(db.String(20), default='draft')
    # statuses: draft, dispatched, completed, cancelled
    vehicle_id = db.Column(db.Integer, db.ForeignKey('vehicles.id'), nullable=False)
    driver_id = db.Column(db.Integer, db.ForeignKey('drivers.id'), nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    final_odometer = db.Column(db.Float, default=0.0)
    fuel_consumed = db.Column(db.Float, default=0.0)  # liters
    start_time = db.Column(db.DateTime)
    end_time = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'source': self.source,
            'destination': self.destination,
            'cargo_weight': self.cargo_weight,
            'planned_distance': self.planned_distance,
            'actual_distance': self.actual_distance,
            'status': self.status,
            'vehicle_id': self.vehicle_id,
            'vehicle_reg': self.vehicle.registration_number if self.vehicle else None,
            'driver_id': self.driver_id,
            'driver_name': self.driver.name if self.driver else None,
            'created_by': self.created_by,
            'final_odometer': self.final_odometer,
            'fuel_consumed': self.fuel_consumed,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'fuel_efficiency': round(self.actual_distance / self.fuel_consumed, 2) if self.fuel_consumed and self.actual_distance > 0 else None
        }
