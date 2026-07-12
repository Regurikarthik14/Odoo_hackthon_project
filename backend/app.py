from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from config import Config
from models import db
from routes.auth import auth_bp
from routes.vehicles import vehicles_bp
from routes.drivers import drivers_bp
from routes.trips import trips_bp
from routes.maintenance import maintenance_bp
from routes.expenses import expenses_bp
from routes.dashboard import dashboard_bp
from routes.reports import reports_bp


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Initialize extensions
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    db.init_app(app)
    JWTManager(app)
    Migrate(app, db)

    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(vehicles_bp)
    app.register_blueprint(drivers_bp)
    app.register_blueprint(trips_bp)
    app.register_blueprint(maintenance_bp)
    app.register_blueprint(expenses_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(reports_bp)

    # Health check
    @app.route('/api/health')
    def health():
        return {'status': 'ok', 'message': 'ODDO Fleet Management API is running'}

    # Create tables
    with app.app_context():
        db.create_all()

    return app


if __name__ == '__main__':
    app = create_app()
    print('ODDO Fleet Management API starting...')
    print('   http://localhost:5000')
    app.run(debug=True, host='0.0.0.0', port=5000)
