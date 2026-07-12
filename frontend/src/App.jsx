import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import Drivers from './pages/Drivers';
import Trips from './pages/Trips';
import Maintenance from './pages/Maintenance';
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';

// Role-based page access map
const PAGE_ROLES = {
  '/dashboard': ['fleet_manager', 'driver', 'safety_officer', 'financial_analyst'],
  '/vehicles': ['fleet_manager'],
  '/drivers': ['fleet_manager', 'safety_officer'],
  '/trips': ['fleet_manager', 'driver'],
  '/maintenance': ['fleet_manager'],
  '/expenses': ['fleet_manager', 'financial_analyst'],
  '/reports': ['fleet_manager', 'financial_analyst'],
};

export default function App() {
  const { loading } = useAuth();

  if (loading) return <LoadingSpinner fullScreen text="ODDO Fleet Loading..." />;

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute roles={PAGE_ROLES['/dashboard']}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vehicles"
          element={
            <ProtectedRoute roles={PAGE_ROLES['/vehicles']}>
              <Vehicles />
            </ProtectedRoute>
          }
        />
        <Route
          path="/drivers"
          element={
            <ProtectedRoute roles={PAGE_ROLES['/drivers']}>
              <Drivers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trips"
          element={
            <ProtectedRoute roles={PAGE_ROLES['/trips']}>
              <Trips />
            </ProtectedRoute>
          }
        />
        <Route
          path="/maintenance"
          element={
            <ProtectedRoute roles={PAGE_ROLES['/maintenance']}>
              <Maintenance />
            </ProtectedRoute>
          }
        />
        <Route
          path="/expenses"
          element={
            <ProtectedRoute roles={PAGE_ROLES['/expenses']}>
              <Expenses />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute roles={PAGE_ROLES['/reports']}>
              <Reports />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
