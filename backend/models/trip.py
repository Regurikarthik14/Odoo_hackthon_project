from models.db import db
from datetime import datetime

class Trip(db.Model):
    __tablename__ = 'trips'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    vehicle_id = db.Column(db.Integer, db.ForeignKey('vehicles.id'), nullable=False)
    driver_id = db.Column(db.Integer, db.ForeignKey('drivers.id'), nullable=False)
    route_origin = db.Column(db.String(255), nullable=False)
    route_destination = db.Column(db.String(255), nullable=False)
    cargo_description = db.Column(db.Text, nullable=True)
    cargo_weight_kg = db.Column(db.Numeric(10, 2), nullable=True)
    distance_km = db.Column(db.Numeric(10, 2), nullable=True)
    start_time = db.Column(db.DateTime, nullable=True)
    end_time = db.Column(db.DateTime, nullable=True)
    status = db.Column(db.Enum('planned', 'in-progress', 'completed', 'cancelled', 'delayed'), nullable=False, default='planned')
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    vehicle = db.relationship('Vehicle', backref='trips', lazy=True)
    driver = db.relationship('Driver', backref='trips', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'vehicle_id': self.vehicle_id,
            'driver_id': self.driver_id,
            'route_origin': self.route_origin,
            'route_destination': self.route_destination,
            'cargo_description': self.cargo_description,
            'cargo_weight_kg': float(self.cargo_weight_kg) if self.cargo_weight_kg else None,
            'distance_km': float(self.distance_km) if self.distance_km else None,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'status': self.status,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
