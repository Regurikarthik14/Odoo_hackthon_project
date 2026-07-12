# 🚛 FleetMaster Pro — Fleet Management System

A comprehensive fleet management frontend built with **React + Vite**. Manages vehicles, drivers, trips, maintenance, fuel/expenses, and generates analytics reports with beautiful charts and animations.

---

## 📋 Table of Contents

- [Tech Stack](#-tech-stack)
- [Architecture Overview](#-architecture-overview)
- [Project Structure](#-project-structure)
- [Installation & Setup](#-installation--setup)
- [Running the App](#-running-the-app)
- [Login Credentials](#-login-credentials)
- [Feature Walkthrough](#-feature-walkthrough)
- [Business Rules Implemented](#-business-rules-implemented)
- [API Integration Guide](#-api-integration-guide)
- [Animated Interactions](#-animated-interactions)
- [Backend Integration](#-backend-integration)

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **UI Framework** | React 18 | Component-based UI |
| **Build Tool** | Vite 6 | Fast dev server & optimized builds |
| **Routing** | React Router v6 | SPA navigation with auth guards |
| **Charts** | Recharts | Interactive bar, pie, and line charts |
| **Styling** | Pure CSS (Flexbox/Grid) | Custom animations & responsive design |
| **State** | React Context API | Auth + RBAC state management |
| **Animations** | CSS Keyframes | Steering wheel loader & car page transitions |
| **Backend** | REST API (Mock) | Replace with your backend |

### Backend (to be implemented by you)

| Layer | Recommendation |
|-------|---------------|
| **Database** | MySQL |
| **Backend API** | Node.js (Express) / Python (FastAPI) / PHP (Laravel) |
| **Auth** | JWT tokens with role-based access |

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                   FleetMaster Pro                        │
├─────────────────────────────────────────────────────────┤
│  BrowserRouter                                          │
│  ├── AuthProvider (Context + RBAC)                      │
│  └── Routes                                             │
│       ├── /login  → Login page                          │
│       └── / → Layout (Sidebar + Navbar)                 │
│            ├── /dashboard   → Dashboard (KPIs + Charts) │
│            ├── /vehicles    → Vehicle Registry          │
│            ├── /drivers     → Driver Management          │
│            ├── /trips       → Trip Management            │
│            ├── /maintenance → Maintenance Records        │
│            ├── /fuel-expenses → Fuel & Expense Tracking  │
│            └── /reports     → Reports & Analytics        │
├─────────────────────────────────────────────────────────┤
│  services/api.js → Mock API (replace with real backend)  │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Action → Page Component → API Service → Mock Data / Backend
                                                    ↓
User sees ← Page Re-renders ← State Updated ← Response
```

---

## 📁 Project Structure

```
fleetmaster-pro/
├── public/
│   └── steering-wheel.svg          # Favicon
├── src/
│   ├── main.jsx                    # Entry point
│   ├── App.jsx                     # Routes & auth protection
│   ├── index.css                   # Global styles & animations
│   ├── context/
│   │   └── AuthContext.jsx         # Auth + RBAC provider
│   ├── services/
│   │   └── api.js                  # API service (mock data + real fetch guide)
│   ├── components/
│   │   ├── LoadingSpinner.jsx      # Steering wheel loader
│   │   ├── PageTransition.jsx      # Car animation on route change
│   │   ├── Layout.jsx              # Main layout (sidebar + navbar)
│   │   ├── Sidebar.jsx             # Collapsible navigation
│   │   ├── Navbar.jsx              # Top bar with user profile
│   │   └── ProtectedRoute.jsx      # Auth guard wrapper
│   └── pages/
│       ├── Login.jsx               # Login with role selector
│       ├── Dashboard.jsx           # KPIs & charts
│       ├── Vehicles.jsx            # Vehicle CRUD
│       ├── Drivers.jsx             # Driver CRUD
│       ├── Trips.jsx               # Trip lifecycle
│       ├── Maintenance.jsx         # Maintenance records
│       ├── FuelExpense.jsx         # Fuel & expense tracking
│       └── Reports.jsx             # Analytics & CSV export
├── index.html
├── vite.config.js
└── package.json
```

---

## 🔧 Installation & Setup

```bash
# 1. Navigate to the project
cd D:/oddo

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev

# 4. Build for production
npm run build
```

---

## 🚀 Running the App

```bash
npm run dev
```

Opens at **http://localhost:5173** by default.

---

## 👥 Login Credentials

| Role | Email | Password | Permissions |
|------|-------|----------|-------------|
| 👔 **Fleet Manager** | `fleet.manager@fleetmaster.com` | `admin123` | Full access |
| 🚚 **Driver** | `driver@fleetmaster.com` | `driver123` | View dashboard, vehicles, drivers; manage trips |
| 🛡️ **Safety Officer** | `safety@fleetmaster.com` | `safety123` | View dashboard, vehicles, drivers, trips, maintenance, reports; manage drivers |
| 📊 **Financial Analyst** | `finance@fleetmaster.com` | `finance123` | View dashboard, vehicles, trips, maintenance, reports; manage fuel/expenses |

**Quick Login:** On the login page, click a role button to auto-fill credentials.

---

## ✨ Feature Walkthrough

### Step-by-Step Demo Flow

1. **Register a vehicle**: Navigate to **Vehicles** → click **+ Add Vehicle** → enter `Van-05`, capacity `500 kg`
2. **Register a driver**: Navigate to **Drivers** → click **+ Add Driver** → enter `Alex` with valid license
3. **Create a trip**: Navigate to **Trips** → click **+ New Trip** → select Van-05, Alex, cargo `450 kg`
4. **System validation**: Cargo weight (450 kg) ≤ capacity (500 kg) ✓ → Trip dispatched!
5. **Status updates**: Vehicle and driver status auto-change to **On Trip** ✅
6. **Complete the trip**: Click **✅** on the trip → enter final odometer and fuel consumed
7. **Status reset**: Both vehicle and driver return to **Available** ✅
8. **Add maintenance**: Navigate to **Maintenance** → **+ Add Record** for Van-05 → status becomes **In Shop**
9. **View reports**: Navigate to **Reports** → see fuel efficiency, operational costs, ROI

---

## 📜 Business Rules Implemented

| Rule | Implementation |
|------|---------------|
| Unique registration number | Checked in `createVehicle()` API |
| Retired/In Shop hidden from dispatch | Trips page only shows `available` vehicles |
| Expired/suspended drivers blocked | Checked in `createTrip()` API |
| No double-booking vehicles/drivers | Status check before dispatch |
| Cargo ≤ vehicle capacity | Frontend validation + API check |
| Dispatch → auto On Trip | `createTrip()` updates both statuses |
| Complete → auto Available | `updateTripStatus('completed')` restores |
| Cancel dispatched → restore Available | `updateTripStatus('cancelled')` restores |
| Maintenance → auto In Shop | `createMaintenanceRecord()` updates vehicle |
| Close maintenance → auto Available | `closeMaintenanceRecord()` restores |

---

## 🔌 API Integration Guide

### Current State: Mock Data

All data operations in `src/services/api.js` use in-memory arrays. Perfect for frontend development.

### Connecting to Your Backend

Replace each function in `src/services/api.js` with real API calls. Example:

```javascript
// src/services/api.js
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function apiRequest(endpoint, options = {}) {
  const token = sessionStorage.getItem('auth_token'); // or localStorage
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Request failed');
  }
  return res.json();
}

// Example: Get vehicles
export async function getVehicles(filters = {}) {
  const params = new URLSearchParams(filters);
  return apiRequest(`/vehicles?${params}`);
}
```

### API Endpoints Needed (Backend)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Authenticate user |
| GET | `/api/vehicles` | List vehicles (with filters) |
| POST | `/api/vehicles` | Create vehicle |
| PUT | `/api/vehicles/:id` | Update vehicle |
| DELETE | `/api/vehicles/:id` | Delete vehicle |
| GET | `/api/drivers` | List drivers |
| POST | `/api/drivers` | Create driver |
| PUT | `/api/drivers/:id` | Update driver |
| DELETE | `/api/drivers/:id` | Delete driver |
| GET | `/api/trips` | List trips |
| POST | `/api/trips` | Create trip |
| PUT | `/api/trips/:id/status` | Update trip status |
| GET | `/api/maintenance` | List maintenance records |
| POST | `/api/maintenance` | Create maintenance record |
| PUT | `/api/maintenance/:id/close` | Close maintenance |
| GET | `/api/fuel-logs` | List fuel logs |
| POST | `/api/fuel-logs` | Create fuel log |
| GET | `/api/expenses` | List expenses |
| POST | `/api/expenses` | Create expense |
| GET | `/api/reports/kpi` | Dashboard KPIs |
| GET | `/api/reports/analytics` | Report data |

### Database Schema (MySQL)

```sql
-- Users table for auth
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role ENUM('fleet-manager', 'driver', 'safety-officer', 'financial-analyst') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vehicles
CREATE TABLE vehicles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  reg_number VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  max_capacity DECIMAL(10,2) NOT NULL,
  odometer INT DEFAULT 0,
  acquisition_cost DECIMAL(12,2) NOT NULL,
  year INT,
  region VARCHAR(50),
  status ENUM('available', 'on-trip', 'in-shop', 'retired') DEFAULT 'available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Drivers
CREATE TABLE drivers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  license_number VARCHAR(100) UNIQUE NOT NULL,
  license_category VARCHAR(10) NOT NULL,
  license_expiry DATE NOT NULL,
  contact VARCHAR(50),
  safety_score INT DEFAULT 85,
  status ENUM('available', 'on-trip', 'off-duty', 'suspended') DEFAULT 'available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trips
CREATE TABLE trips (
  id INT PRIMARY KEY AUTO_INCREMENT,
  source VARCHAR(255) NOT NULL,
  destination VARCHAR(255) NOT NULL,
  vehicle_id INT NOT NULL,
  driver_id INT NOT NULL,
  cargo_weight DECIMAL(10,2) NOT NULL,
  planned_distance INT NOT NULL,
  status ENUM('draft', 'dispatched', 'completed', 'cancelled') DEFAULT 'draft',
  start_date DATE,
  end_date DATE,
  odometer_start INT,
  odometer_end INT,
  fuel_consumed DECIMAL(10,2),
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  FOREIGN KEY (driver_id) REFERENCES drivers(id)
);

-- Maintenance Records
CREATE TABLE maintenance (
  id INT PRIMARY KEY AUTO_INCREMENT,
  vehicle_id INT NOT NULL,
  type VARCHAR(100) NOT NULL,
  description TEXT,
  cost DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL,
  status ENUM('active', 'closed') DEFAULT 'active',
  mechanic VARCHAR(255),
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);

-- Fuel Logs
CREATE TABLE fuel_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  vehicle_id INT NOT NULL,
  liters DECIMAL(10,2) NOT NULL,
  cost DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);

-- Other Expenses
CREATE TABLE expenses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  vehicle_id INT NOT NULL,
  type VARCHAR(50) NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);
```

---

## 🎬 Animated Interactions

### Steering Wheel Loader
- **File**: `src/components/LoadingSpinner.jsx`
- **CSS**: `.steering-wheel-loader` with SVG animation
- Shown on initial app load and auth state check
- Features rotating SVG steering wheel with pulsing glow background

### Car Page Transition
- **File**: `src/components/PageTransition.jsx`
- **CSS**: `.car-animation` with `@keyframes car-drive`
- On every route change, a car emoji (🚗) drives from **right to left** across the screen
- Includes a trail effect for smooth visual transition
- Content fades in with subtle upward animation

### Micro-interactions
- Hover states on cards, buttons, and table rows
- Modal open/close animations (scale + fade)
- Toast notifications slide in from the right
- Status badges with color-coded dots
- Loading states with animated dots

---

## 📊 Reports & Analytics Formulas

| Metric | Formula |
|--------|---------|
| **Fleet Utilization** | `Active Vehicles ÷ Total Vehicles × 100` |
| **Fuel Efficiency** | `Distance ÷ Fuel Consumed` |
| **Operational Cost** | `Fuel Cost + Maintenance Cost + Other Expenses` |
| **Vehicle ROI** | `(Revenue − Operational Cost) ÷ Acquisition Cost × 100` |

**CSV Export**: All reports support one-click CSV download.

---

## 🧪 Testing the Demo

### Prerequisites
```bash
npm install
npm run dev
```

### Test Steps
1. Open http://localhost:5173
2. Click **Fleet Manager** role → **Sign In**
3. Dashboard loads with KPI cards and charts
4. Navigate through each section via the sidebar
5. Watch the 🚗 car animation on every page change
6. Watch the ⏳ steering wheel loader on initial load
7. Create, edit, and delete records in each section
8. Try creating a trip with cargo > capacity (should show error)
9. Complete a trip and see vehicle/driver restore to Available
10. Add maintenance and see vehicle become In Shop
11. View Reports with charts, tables, and CSV export

---

## 🔐 Role-Based Access Control (RBAC)

| Permission | Fleet Manager | Driver | Safety Officer | Financial Analyst |
|-----------|:-------------:|:------:|:--------------:|:-----------------:|
| View Dashboard | ✅ | ✅ | ✅ | ✅ |
| View Vehicles | ✅ | ✅ | ✅ | ✅ |
| Manage Vehicles | ✅ | ❌ | ❌ | ❌ |
| View Drivers | ✅ | ✅ | ✅ | ❌ |
| Manage Drivers | ✅ | ❌ | ✅ | ❌ |
| View Trips | ✅ | ✅ | ✅ | ✅ |
| Manage Trips | ✅ | ✅ | ❌ | ❌ |
| View Maintenance | ✅ | ❌ | ✅ | ✅ |
| Manage Maintenance | ✅ | ❌ | ❌ | ❌ |
| View Fuel/Expenses | ✅ | ❌ | ❌ | ✅ |
| Manage Fuel/Expenses | ✅ | ❌ | ❌ | ✅ |
| View Reports | ✅ | ❌ | ✅ | ✅ |

---

## 📄 License

MIT — Free for personal and commercial use.
