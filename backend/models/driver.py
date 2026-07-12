from models.db import db
from datetime import datetime

class Driver(db.Model):
    __tablename__ = 'drivers'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    license_number = db.Column(db.String(50), unique=True, nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    address = db.Column(db.Text, nullable=True)
    emergency_contact = db.Column(db.String(100), nullable=True)
    emergency_phone = db.Column(db.String(20), nullable=True)
    license_expiry = db.Column(db.Date, nullable=False)
    medical_expiry = db.Column(db.Date, nullable=True)
    safety_score = db.Column(db.Numeric(5, 2), default=100.00)
    status = db.Column(db.Enum('available', 'on-trip', 'off-duty', 'suspended'), nullable=False, default='available')
    assigned_vehicle_id = db.Column(db.Integer, db.ForeignKey('vehicles.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = db.relationship('User', backref='driver', lazy=True)
    assigned_vehicle = db.relationship('Vehicle', backref='assigned_drivers', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'phone': self.phone,
            'address': self.address,
            'license_number': self.license_number,
            'emergency_contact': self.emergency_contact,
            'emergency_phone': self.emergency_phone,
            'license_expiry': self.license_expiry.isoformat() if self.license_expiry else None,
            'medical_expiry': self.medical_expiry.isoformat() if self.medical_expiry else None,
            'safety_score': float(self.safety_score) if self.safety_score else None,
            'status': self.status,
            'assigned_vehicle_id': self.assigned_vehicle_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
