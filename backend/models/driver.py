from datetime import datetime
from . import db


class Driver(db.Model):
    __tablename__ = 'drivers'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    license_number = db.Column(db.String(50), unique=True, nullable=False, index=True)
    license_category = db.Column(db.String(20), default='B')
    license_expiry_date = db.Column(db.Date, nullable=False)
    contact_number = db.Column(db.String(20))
    safety_score = db.Column(db.Float, default=100.0)
    status = db.Column(db.String(20), default='available')
    # statuses: available, on_trip, off_duty, suspended
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    trips = db.relationship('Trip', backref='driver', lazy='dynamic')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'license_number': self.license_number,
            'license_category': self.license_category,
            'license_expiry_date': self.license_expiry_date.isoformat() if self.license_expiry_date else None,
            'contact_number': self.contact_number,
            'safety_score': self.safety_score,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    def is_available_for_trip(self):
        from datetime import date
        if self.status != 'available':
            return False, 'Driver is not available'
        if self.status == 'suspended':
            return False, 'Driver is suspended'
        if self.license_expiry_date and self.license_expiry_date < date.today():
            return False, 'License has expired'
        return True, 'Driver is available'
