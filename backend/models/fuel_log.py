from models.db import db
from datetime import datetime

class FuelLog(db.Model):
    __tablename__ = 'fuel_logs'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    vehicle_id = db.Column(db.Integer, db.ForeignKey('vehicles.id'), nullable=False)
    driver_id = db.Column(db.Integer, db.ForeignKey('drivers.id'), nullable=True)
    fuel_type = db.Column(db.Enum('diesel', 'petrol', 'electric', 'hybrid', 'cng'), nullable=False)
    liters = db.Column(db.Numeric(10, 2), nullable=False)
    cost = db.Column(db.Numeric(12, 2), nullable=False)
    odometer_km = db.Column(db.Numeric(12, 2), nullable=True)
    station_name = db.Column(db.String(255), nullable=True)
    station_location = db.Column(db.String(255), nullable=True)
    refuel_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    vehicle = db.relationship('Vehicle', backref='fuel_logs', lazy=True)
    driver = db.relationship('Driver', backref='fuel_logs', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'vehicle_id': self.vehicle_id,
            'driver_id': self.driver_id,
            'fuel_type': self.fuel_type,
            'liters': float(self.liters) if self.liters else None,
            'cost': float(self.cost) if self.cost else None,
            'odometer_km': float(self.odometer_km) if self.odometer_km else None,
            'station_name': self.station_name,
            'station_location': self.station_location,
            'refuel_date': self.refuel_date.isoformat() if self.refuel_date else None,
            'notes': self.notes,
        }
