from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import Config
from models.db import db

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    CORS(app, resources={r"/api/*": {"origins": "*"}})
    JWTManager(app)
    db.init_app(app)

    with app.app_context():
        from models.user import User
        from models.vehicle import Vehicle
        from models.driver import Driver
        from models.trip import Trip
        from models.maintenance import Maintenance
        from models.fuel_log import FuelLog
        from models.expense import Expense
        db.create_all()

    from routes.auth import auth_bp
    from routes.vehicles import vehicles_bp
    from routes.drivers import drivers_bp
    from routes.trips import trips_bp
    from routes.maintenance import maintenance_bp
    from routes.fuel_logs import fuel_logs_bp
    from routes.expenses import expenses_bp
    from routes.reports import reports_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(vehicles_bp)
    app.register_blueprint(drivers_bp)
    app.register_blueprint(trips_bp)
    app.register_blueprint(maintenance_bp)
    app.register_blueprint(fuel_logs_bp)
    app.register_blueprint(expenses_bp)
    app.register_blueprint(reports_bp)

    @app.route('/api/health', methods=['GET'])
    def health():
        return jsonify({'status': 'healthy', 'message': 'FleetMaster Pro API is running'}), 200

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'error': 'Route not found'}), 404

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({'error': 'Internal server error'}), 500

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5000)
