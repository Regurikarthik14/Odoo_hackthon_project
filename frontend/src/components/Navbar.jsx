import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/vehicles': 'Vehicle Registry',
  '/drivers': 'Driver Management',
  '/trips': 'Trip Management',
  '/maintenance': 'Maintenance',
  '/fuel-expenses': 'Fuel & Expenses',
  '/reports': 'Reports & Analytics',
};

export default function Navbar({ pathname, onMenuToggle }) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const title = PAGE_TITLES[pathname] || 'FleetMaster Pro';

  const roleLabels = {
    'fleet-manager': 'Fleet Manager',
    'driver': 'Driver',
    'safety-officer': 'Safety Officer',
    'financial-analyst': 'Financial Analyst',
  };

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button className="mobile-menu-btn" onClick={onMenuToggle}>
          ☰
        </button>
        <div>
          <h2 className="navbar-page-title">{title}</h2>
        </div>
      </div>
      <div className="navbar-right">
        <button
          className="navbar-btn theme-toggle"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <button className="navbar-btn" title="Notifications">
          🔔
          <span className="badge-dot"></span>
        </button>
        <div className="user-profile">
          <div className="user-avatar">{user?.avatar || 'U'}</div>
          <div className="user-info">
            <div className="user-name">{user?.name || 'User'}</div>
            <div className="user-role">{roleLabels[user?.role] || user?.role}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
