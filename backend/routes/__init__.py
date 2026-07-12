from routes.auth import auth_bp
from routes.vehicles import vehicles_bp
from routes.drivers import drivers_bp
from routes.trips import trips_bp
from routes.maintenance import maintenance_bp
from routes.fuel_logs import fuel_logs_bp
from routes.expenses import expenses_bp
from routes.reports import reports_bp

__all__ = ['auth_bp', 'vehicles_bp', 'drivers_bp', 'trips_bp', 'maintenance_bp', 'fuel_logs_bp', 'expenses_bp', 'reports_bp']
