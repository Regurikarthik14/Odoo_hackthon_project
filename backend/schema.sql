CREATE DATABASE IF NOT EXISTS fleetmaster CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE fleetmaster;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role ENUM('fleet-manager','driver','safety-officer','financial-analyst') NOT NULL DEFAULT 'driver',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE vehicles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    registration_number VARCHAR(50) NOT NULL UNIQUE,
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INT NOT NULL,
    capacity_kg DECIMAL(10,2) NOT NULL,
    fuel_type ENUM('diesel','petrol','electric','hybrid','cng') NOT NULL DEFAULT 'diesel',
    status ENUM('available','on-trip','in-shop','retired') NOT NULL DEFAULT 'available',
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    odometer_km DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE drivers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    license_number VARCHAR(50) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    address TEXT,
    emergency_contact VARCHAR(100),
    emergency_phone VARCHAR(20),
    license_expiry DATE NOT NULL,
    medical_expiry DATE,
    safety_score DECIMAL(5,2) DEFAULT 100.00,
    status ENUM('available','on-trip','off-duty','suspended') NOT NULL DEFAULT 'available',
    assigned_vehicle_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL
);

CREATE TABLE trips (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id INT NOT NULL,
    driver_id INT NOT NULL,
    route_origin VARCHAR(255) NOT NULL,
    route_destination VARCHAR(255) NOT NULL,
    cargo_description TEXT,
    cargo_weight_kg DECIMAL(10,2),
    distance_km DECIMAL(10,2),
    start_time DATETIME,
    end_time DATETIME,
    status ENUM('planned','in-progress','completed','cancelled','delayed') NOT NULL DEFAULT 'planned',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE
);

CREATE TABLE maintenance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id INT NOT NULL,
    type ENUM('routine','repair','inspection','emergency','recall') NOT NULL DEFAULT 'routine',
    description TEXT NOT NULL,
    service_date DATE NOT NULL,
    completion_date DATE,
    cost DECIMAL(12,2) DEFAULT 0,
    service_provider VARCHAR(255),
    odometer_at_service DECIMAL(12,2),
    status ENUM('scheduled','in-progress','completed','cancelled') NOT NULL DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

CREATE TABLE fuel_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id INT NOT NULL,
    driver_id INT,
    fuel_type ENUM('diesel','petrol','electric','hybrid','cng') NOT NULL,
    liters DECIMAL(10,2) NOT NULL,
    cost DECIMAL(12,2) NOT NULL,
    odometer_km DECIMAL(12,2),
    station_name VARCHAR(255),
    station_location VARCHAR(255),
    refuel_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL
);

CREATE TABLE expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id INT,
    trip_id INT,
    category ENUM('fuel','maintenance','toll','parking','insurance','tax','fine','other') NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    description TEXT,
    expense_date DATE NOT NULL,
    receipt_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE SET NULL
);
