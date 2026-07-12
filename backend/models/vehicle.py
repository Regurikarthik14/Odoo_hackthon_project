from models.db import db
from datetime import datetime

class Vehicle(db.Model):
    __tablename__ = 'vehicles'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    registration_number = db.Column(db.String(50), unique=True, nullable=False)
    make = db.Column(db.String(100), nullable=False)
    model = db.Column(db.String(100), nullable=False)
    year = db.Column(db.Integer, nullable=False)
    capacity_kg = db.Column(db.Numeric(10, 2), nullable=False)
    fuel_type = db.Column(db.Enum('diesel', 'petrol', 'electric', 'hybrid', 'cng'), nullable=False, default='diesel')
    status = db.Column(db.Enum('available', 'on-trip', 'in-shop', 'retired'), nullable=False, default='available')
    last_maintenance_date = db.Column(db.Date, nullable=True)
    next_maintenance_date = db.Column(db.Date, nullable=True)
    odometer_km = db.Column(db.Numeric(12, 2), default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'registration_number': self.registration_number,
            'make': self.make,
            'model': self.model,
            'year': self.year,
            'capacity_kg': float(self.capacity_kg) if self.capacity_kg else None,
            'fuel_type': self.fuel_type,
            'status': self.status,
            'last_maintenance_date': self.last_maintenance_date.isoformat() if self.last_maintenance_date else None,
            'next_maintenance_date': self.next_maintenance_date.isoformat() if self.next_maintenance_date else None,
            'odometer_km': float(self.odometer_km) if self.odometer_km else 0,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
