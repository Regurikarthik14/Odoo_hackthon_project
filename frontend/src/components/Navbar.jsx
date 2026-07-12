import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import './Navbar.css';

export default function Navbar() {
  const { user, logout, hasRole } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/vehicles', label: 'Vehicles', icon: '🚛' },
    { path: '/drivers', label: 'Drivers', icon: '👤' },
    { path: '/trips', label: 'Trips', icon: '🗺️' },
    { path: '/maintenance', label: 'Maintenance', icon: '🔧' },
    { path: '/expenses', label: 'Expenses', icon: '💰' },
    { path: '/reports', label: 'Reports', icon: '📈' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar glass">
      <div className="nav-brand">
        <span className="brand-icon">🚛</span>
        <span className="brand-text">ODDO Fleet</span>
      </div>

      <div className="nav-links">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
      </div>

      <div className="nav-right">
        <ThemeToggle />
        <div className="user-info">
          <span className="user-avatar">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </span>
          <div className="user-details">
            <span className="user-name">{user?.name}</span>
            <span className="user-role">{user?.role?.replace('_', ' ')}</span>
          </div>
        </div>
        <button className="logout-btn" onClick={logout} title="Logout">
          <span className="logout-icon">🚪</span>
        </button>
      </div>
    </nav>
  );
}
