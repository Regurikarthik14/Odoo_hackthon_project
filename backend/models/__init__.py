from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

from .user import User
from .vehicle import Vehicle
from .driver import Driver
from .trip import Trip
from .maintenance import MaintenanceRecord
from .expense import FuelLog, Expense
