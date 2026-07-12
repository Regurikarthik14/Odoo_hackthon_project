import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_LABELS = {
  'fleet-manager': 'Fleet Manager',
  'driver': 'Driver',
  'safety-officer': 'Safety Officer',
  'financial-analyst': 'Financial Analyst',
};

const ROLE_ICONS = {
  'fleet-manager': '👔',
  'driver': '🚚',
  'safety-officer': '🛡️',
  'financial-analyst': '📊',
};

export default function ProtectedRoute({ children, requiredPermission }) {
  const { isAuthenticated, hasPermission, user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        padding: 40,
      }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🚫</div>
        <h2 style={{ color: '#1e293b', marginBottom: 8 }}>Access Denied</h2>
        <p style={{ color: '#64748b', marginBottom: 8, maxWidth: 400 }}>
          Your current role ({ROLE_ICONS[user?.role]} {ROLE_LABELS[user?.role] || user?.role}) does not have permission to access this page.
        </p>
        <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 24 }}>
          Please contact your Fleet Manager or switch to an account with the required permissions.
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/dashboard')}
          >
            ← Back to Dashboard
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              logout();
              navigate('/login', { replace: true });
            }}
          >
            Switch Role
          </button>
        </div>
      </div>
    );
  }

  return children;
}
