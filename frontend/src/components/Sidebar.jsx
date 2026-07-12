import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { section: 'Main Menu' },
  { label: 'Dashboard', path: '/dashboard', icon: '📊', permission: 'view-dashboard' },
  { label: 'Vehicles', path: '/vehicles', icon: '🚛', permission: 'view-vehicles' },
  { label: 'Drivers', path: '/drivers', icon: '👤', permission: 'view-drivers' },
  { label: 'Trips', path: '/trips', icon: '🗺️', permission: 'view-trips' },
  { section: 'Management' },
  { label: 'Maintenance', path: '/maintenance', icon: '🔧', permission: 'view-maintenance' },
  { label: 'Fuel & Expenses', path: '/fuel-expenses', icon: '⛽', permission: 'view-fuel-expenses' },
  { section: 'Analytics' },
  { label: 'Reports', path: '/reports', icon: '📈', permission: 'view-reports' },
];

export default function Sidebar({ collapsed, mobileOpen, onToggle, onMobileClose }) {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredItems = NAV_ITEMS.filter((item) => {
    if (!item.permission) return true;
    return hasPermission(item.permission);
  });

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`mobile-menu-overlay ${mobileOpen ? 'active' : ''}`}
        onClick={onMobileClose}
      />

      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-toggle" onClick={onToggle}>
          {collapsed ? '▶' : '◀'}
        </div>

        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🚛</div>
          <div className="sidebar-logo-text">
            Fleet<span>Master</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {filteredItems.map((item, idx) => {
            if (item.section) {
              return (
                <div key={idx} className="nav-section-label">
                  {item.section}
                </div>
              );
            }
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={onMobileClose}
              >
                <span className="nav-item-icon">{item.icon}</span>
                <span className="nav-item-label">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="nav-item" onClick={handleLogout} style={{ cursor: 'pointer' }}>
            <span className="nav-item-icon">🚪</span>
            <span className="nav-item-label">Logout</span>
          </div>
        </div>
      </aside>
    </>
  );
}
