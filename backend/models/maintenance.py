from datetime import datetime
from . import db


class MaintenanceRecord(db.Model):
    __tablename__ = 'maintenance_records'

    id = db.Column(db.Integer, primary_key=True)
    vehicle_id = db.Column(db.Integer, db.ForeignKey('vehicles.id'), nullable=False)
    description = db.Column(db.String(500), nullable=False)
    maintenance_type = db.Column(db.String(100), default='Other')
    cost = db.Column(db.Float, default=0.0)
    status = db.Column(db.String(20), default='active')
    # statuses: active, closed
    start_date = db.Column(db.DateTime, default=datetime.utcnow)
    end_date = db.Column(db.DateTime)
    notes = db.Column(db.Text)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'vehicle_id': self.vehicle_id,
            'vehicle_reg': self.vehicle.registration_number if self.vehicle else None,
            'vehicle_name': self.vehicle.name if self.vehicle else None,
            'description': self.description,
            'maintenance_type': self.maintenance_type,
            'cost': self.cost,
            'status': self.status,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
