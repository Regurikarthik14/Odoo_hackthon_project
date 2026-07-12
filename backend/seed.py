from datetime import date, datetime, timedelta
import random
from app import create_app
from models import db, User, Vehicle, Driver, Trip, MaintenanceRecord, FuelLog, Expense


def seed_data():
    app = create_app()
    with app.app_context():
        db.create_all()

        # Clear existing data
        User.query.delete()
        Vehicle.query.delete()
        Driver.query.delete()
        Trip.query.delete()
        MaintenanceRecord.query.delete()
        FuelLog.query.delete()
        Expense.query.delete()
        db.session.commit()

        # --- Users (RBAC) ---
        users_data = [
            ('admin@oddo.com', 'Admin123!', 'Admin User', 'fleet_manager'),
            ('driver@oddo.com', 'Driver123!', 'John Driver', 'driver'),
            ('safety@oddo.com', 'Safety123!', 'Sarah Safety', 'safety_officer'),
            ('finance@oddo.com', 'Finance123!', 'Finn Analyst', 'financial_analyst'),
        ]
        users = []
        for email, pwd, name, role in users_data:
            user = User(email=email, name=name, role=role)
            user.set_password(pwd)
            db.session.add(user)
            users.append(user)
        db.session.commit()

        # --- Vehicles ---
        vehicles_data = [
            ('Van-05', 'Cargo Van', 'Ford Transit 350', 'van', 500, 15000, 35000, 'available', 'North'),
            ('TRK-01', 'Heavy Truck A', 'Volvo FH16', 'truck', 2000, 85000, 120000, 'available', 'South'),
            ('TRK-02', 'Heavy Truck B', 'Scania R500', 'truck', 1800, 62000, 110000, 'available', 'East'),
            ('VAN-03', 'Light Van', 'Mercedes Sprinter', 'van', 800, 28000, 45000, 'available', 'West'),
            ('BUS-01', 'Minibus', 'Toyota Coaster', 'bus', 1500, 45000, 65000, 'available', 'North'),
        ]
        vehicles = []
        for reg, name, model, vtype, cap, odo, cost, status, region in vehicles_data:
            v = Vehicle(
                registration_number=reg, name=name, model=model, vehicle_type=vtype,
                max_load_capacity=cap, odometer=odo, acquisition_cost=cost,
                status=status, region=region
            )
            db.session.add(v)
            vehicles.append(v)
        db.session.commit()

        # --- Drivers ---
        drivers_data = [
            ('Alex Turner', 'LIC-001', 'C', date(2027, 6, 15), '+1-555-0101', 95.0),
            ('Maria Garcia', 'LIC-002', 'B', date(2026, 12, 20), '+1-555-0102', 98.0),
            ('James Wilson', 'LIC-003', 'C', date(2028, 3, 10), '+1-555-0103', 88.0),
            ('Emily Chen', 'LIC-004', 'B', date(2025, 11, 5), '+1-555-0104', 92.0),
            ('Robert Kim', 'LIC-005', 'D', date(2027, 9, 1), '+1-555-0105', 85.0),
        ]
        drivers = []
        for name, lic, cat, exp, contact, score in drivers_data:
            d = Driver(
                name=name, license_number=lic, license_category=cat,
                license_expiry_date=exp, contact_number=contact, safety_score=score,
                status='available'
            )
            db.session.add(d)
            drivers.append(d)
        db.session.commit()

        # --- Completed Trips ---
        completed_trips = [
            ('Warehouse A', 'Distribution Center 1', 450, 120, vehicles[0], drivers[0], 15120, 18.5),
            ('Port Terminal', 'City Depot', 1200, 280, vehicles[1], drivers[1], 85280, 42.0),
            ('Factory Site', 'Retail Hub', 900, 195, vehicles[2], drivers[2], 62195, 35.2),
        ]
        for src, dst, cargo, dist, v, d, final_odo, fuel in completed_trips:
            trip = Trip(
                source=src, destination=dst, cargo_weight=cargo, planned_distance=dist,
                actual_distance=dist, vehicle_id=v.id, driver_id=d.id,
                created_by=users[0].id, status='completed',
                start_time=datetime.utcnow() - timedelta(days=random.randint(1, 10)),
                end_time=datetime.utcnow() - timedelta(days=random.randint(0, 5)),
                final_odometer=final_odo, fuel_consumed=fuel
            )
            db.session.add(trip)
        db.session.commit()

        # --- Draft Trips ---
        draft_trips = [
            ('Depot 1', 'Customer Site A', 350, 85, vehicles[3], drivers[2]),
            ('HQ', 'Warehouse B', 600, 150, vehicles[0], drivers[3]),
        ]
        for src, dst, cargo, dist, v, d in draft_trips:
            trip = Trip(
                source=src, destination=dst, cargo_weight=cargo, planned_distance=dist,
                vehicle_id=v.id, driver_id=d.id, created_by=users[1].id, status='draft'
            )
            db.session.add(trip)
        db.session.commit()

        # --- Maintenance Records ---
        maint_records = [
            (vehicles[4].id, 'Oil Change & Filter Replacement', 'Oil Change', 250.00, 'active'),
            (vehicles[3].id, 'Brake Pad Replacement - All 4 wheels', 'Brake Service', 480.00, 'closed'),
        ]
        for vid, desc, mtype, cost, status in maint_records:
            record = MaintenanceRecord(
                vehicle_id=vid, description=desc, maintenance_type=mtype,
                cost=cost, status=status,
                end_date=datetime.utcnow() if status == 'closed' else None
            )
            db.session.add(record)
        # Set vehicle 4 to in_shop since it has active maintenance
        vehicles[4].status = 'in_shop'
        db.session.commit()

        # --- Fuel Logs ---
        fuel_logs = [
            (vehicles[0].id, 45.0, 135.00, 'Regular fill-up'),
            (vehicles[1].id, 120.0, 360.00, 'Full tank'),
            (vehicles[2].id, 95.0, 285.00, 'Highway refuel'),
        ]
        for vid, liters, cost, notes in fuel_logs:
            log = FuelLog(vehicle_id=vid, liters=liters, cost=cost, notes=notes)
            db.session.add(log)
        db.session.commit()

        # --- Other Expenses ---
        other_expenses = [
            (vehicles[1].id, 'toll', 45.00, 'Highway toll'),
            (vehicles[2].id, 'parking', 12.00, 'Parking fee'),
            (vehicles[0].id, 'toll', 25.00, 'Bridge toll'),
        ]
        for vid, etype, amount, desc in other_expenses:
            exp = Expense(vehicle_id=vid, expense_type=etype, amount=amount, description=desc)
            db.session.add(exp)
        db.session.commit()

        print('✅ Seed data loaded successfully!')
        print(f'   Users: {User.query.count()}')
        print(f'   Vehicles: {Vehicle.query.count()}')
        print(f'   Drivers: {Driver.query.count()}')
        print(f'   Trips: {Trip.query.count()}')
        print(f'   Maintenance: {MaintenanceRecord.query.count()}')
        print(f'   Fuel Logs: {FuelLog.query.count()}')
        print(f'   Expenses: {Expense.query.count()}')
        print()
        print('📧 Login credentials:')
        print('   Fleet Manager: admin@oddo.com / Admin123!')
        print('   Driver: driver@oddo.com / Driver123!')
        print('   Safety Officer: safety@oddo.com / Safety123!')
        print('   Financial Analyst: finance@oddo.com / Finance123!')


if __name__ == '__main__':
    seed_data()
