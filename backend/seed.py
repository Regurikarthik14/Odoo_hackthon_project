from datetime import datetime
from app import create_app
from models import db, User


def seed_data():
    app = create_app()
    with app.app_context():
        # Drop all existing tables and recreate with new schema
        db.drop_all()
        db.create_all()
        print('[OK] Database tables created successfully with new schema!')
        print()
        print('No seed data loaded.')
        print('Users can register through the app.')


if __name__ == '__main__':
    seed_data()
