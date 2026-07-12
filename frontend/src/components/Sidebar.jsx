import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import './Sidebar.css';

const ALL_NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/vehicles', label: 'Vehicles', icon: '🚛' },
  { path: '/drivers', label: 'Drivers', icon: '👤' },
  { path: '/trips', label: 'Trips', icon: '🗺️' },
  { path: '/maintenance', label: 'Maintenance', icon: '🔧' },
  { path: '/expenses', label: 'Expenses', icon: '💰' },
  { path: '/reports', label: 'Reports', icon: '📈' },
];

// Role-based navigation filters
// Per spec: Fleet Manager sees all, Driver sees trips/dashboard,
// Safety Officer sees drivers, Financial Analyst sees expenses/reports
const ROLE_NAV_MAP = {
  fleet_manager: ALL_NAV_ITEMS,
  driver: ALL_NAV_ITEMS.filter((item) =>
    ['/dashboard', '/trips'].includes(item.path)
  ),
  safety_officer: ALL_NAV_ITEMS.filter((item) =>
    ['/dashboard', '/drivers'].includes(item.path)
  ),
  financial_analyst: ALL_NAV_ITEMS.filter((item) =>
    ['/dashboard', '/expenses', '/reports'].includes(item.path)
  ),
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = ROLE_NAV_MAP[user?.role] || [];

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="sidebar glass">
      {/* Brand */}
      <div className="sidebar-brand">
        <span className="sidebar-brand-icon">🚛</span>
        <span className="sidebar-brand-text">ODDO</span>
        <span className="sidebar-brand-sub">Fleet</span>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={`sidebar-link ${isActive(item.path) ? 'active' : ''}`}
          >
            <span className="sidebar-link-icon">{item.icon}</span>
            <span className="sidebar-link-label">{item.label}</span>
            {isActive(item.path) && <span className="sidebar-link-indicator" />}
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="sidebar-bottom">
        <ThemeToggle />

        <div className="sidebar-user">
          <div className="sidebar-user-avatar">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{user?.name}</span>
            <span className="sidebar-user-role">
              {user?.role?.replace(/_/g, ' ')}
            </span>
          </div>
          <button
            className="sidebar-logout"
            onClick={logout}
            title="Logout"
          >
            🚪
          </button>
        </div>
      </div>
    </aside>
  );
}
