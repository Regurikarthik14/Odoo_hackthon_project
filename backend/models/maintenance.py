from models.db import db
from datetime import datetime

class Maintenance(db.Model):
    __tablename__ = 'maintenance'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    vehicle_id = db.Column(db.Integer, db.ForeignKey('vehicles.id'), nullable=False)
    type = db.Column(db.Enum('routine', 'repair', 'inspection', 'emergency', 'recall'), nullable=False, default='routine')
    description = db.Column(db.Text, nullable=False)
    service_date = db.Column(db.Date, nullable=False)
    completion_date = db.Column(db.Date, nullable=True)
    cost = db.Column(db.Numeric(12, 2), default=0)
    service_provider = db.Column(db.String(255), nullable=True)
    odometer_at_service = db.Column(db.Numeric(12, 2), nullable=True)
    status = db.Column(db.Enum('scheduled', 'in-progress', 'completed', 'cancelled'), nullable=False, default='scheduled')
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    vehicle = db.relationship('Vehicle', backref='maintenance_records', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'vehicle_id': self.vehicle_id,
            'type': self.type,
            'description': self.description,
            'service_date': self.service_date.isoformat() if self.service_date else None,
            'completion_date': self.completion_date.isoformat() if self.completion_date else None,
            'cost': float(self.cost) if self.cost else 0,
            'service_provider': self.service_provider,
            'odometer_at_service': float(self.odometer_at_service) if self.odometer_at_service else None,
            'status': self.status,
            'notes': self.notes,
        }
