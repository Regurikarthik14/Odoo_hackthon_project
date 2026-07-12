from models.db import db
from datetime import datetime

class Expense(db.Model):
    __tablename__ = 'expenses'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    vehicle_id = db.Column(db.Integer, db.ForeignKey('vehicles.id'), nullable=True)
    trip_id = db.Column(db.Integer, db.ForeignKey('trips.id'), nullable=True)
    category = db.Column(db.Enum('fuel', 'maintenance', 'toll', 'parking', 'insurance', 'tax', 'fine', 'other'), nullable=False)
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    description = db.Column(db.Text, nullable=True)
    expense_date = db.Column(db.Date, nullable=False)
    receipt_url = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    vehicle = db.relationship('Vehicle', backref='expenses', lazy=True)
    trip = db.relationship('Trip', backref='expenses', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'vehicle_id': self.vehicle_id,
            'trip_id': self.trip_id,
            'category': self.category,
            'amount': float(self.amount) if self.amount else None,
            'description': self.description,
            'expense_date': self.expense_date.isoformat() if self.expense_date else None,
            'receipt_url': self.receipt_url,
        }
