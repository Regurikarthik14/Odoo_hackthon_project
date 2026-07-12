import { useState, useEffect } from 'react';
import { authService } from '../services';
import LoadingSpinner from '../components/LoadingSpinner';
import './Members.css';

const ROLE_CONFIG = {
  fleet_manager: { label: 'Fleet Manager', icon: '👔', color: '#f59e0b' },
  driver: { label: 'Driver', icon: '🚛', color: '#3b82f6' },
  safety_officer: { label: 'Safety Officer', icon: '🛡️', color: '#10b981' },
  financial_analyst: { label: 'Financial Analyst', icon: '📊', color: '#8b5cf6' },
};

export default function Members() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await authService.getUsers();
      setUsers(res.data.users);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.mobile?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleConfig = (role) => ROLE_CONFIG[role] || { label: role, icon: '❓', color: '#6b7280' };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading members..." />;
  }

  return (
    <div className="page-container members-page">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">
            <span className="page-title-icon">👥</span>
            Members
          </h1>
          <p className="page-subtitle">
            {users.length} registered {users.length === 1 ? 'member' : 'members'}
          </p>
        </div>
      </div>

      {error && (
        <div className="page-message error">
          <span>⚠️</span>
          <span>{error}</span>
          <button className="retry-btn" onClick={loadUsers}>Retry</button>
        </div>
      )}

      {/* Filters */}
      <div className="members-filters">
        <div className="search-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search by name, email, or mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="search-clear" onClick={() => setSearchTerm('')}>✕</button>
          )}
        </div>
        <div className="role-filter-chips">
          <button
            className={`role-chip ${roleFilter === 'all' ? 'active' : ''}`}
            onClick={() => setRoleFilter('all')}
          >
            All
          </button>
          {Object.entries(ROLE_CONFIG).map(([key, config]) => (
            <button
              key={key}
              className={`role-chip ${roleFilter === key ? 'active' : ''}`}
              style={roleFilter === key ? { borderColor: config.color, background: `${config.color}15`, color: config.color } : {}}
              onClick={() => setRoleFilter(key)}
            >
              {config.icon} {config.label}
            </button>
          ))}
        </div>
      </div>

      {/* Members Grid */}
      {filteredUsers.length === 0 ? (
        <div className="members-empty">
          <span className="members-empty-icon">👥</span>
          <h3>No members found</h3>
          <p>{searchTerm || roleFilter !== 'all' ? 'Try adjusting your filters' : 'No members registered yet'}</p>
        </div>
      ) : (
        <div className="members-grid">
          {filteredUsers.map((user) => {
            const roleConfig = getRoleConfig(user.role);
            const createdDate = new Date(user.created_at);
            const daysAgo = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

            return (
              <div key={user.id} className="member-card glass">
                <div className="member-card-header">
                  <div className="member-avatar" style={{ background: `${roleConfig.color}20`, color: roleConfig.color }}>
                    {user.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="member-role-badge" style={{ background: `${roleConfig.color}15`, color: roleConfig.color }}>
                    {roleConfig.icon} {roleConfig.label}
                  </div>
                </div>
                <div className="member-card-body">
                  <h3 className="member-name">{user.name}</h3>
                  {user.email && (
                    <div className="member-detail">
                      <span className="member-detail-icon">📧</span>
                      <span>{user.email}</span>
                    </div>
                  )}
                  {user.mobile && (
                    <div className="member-detail">
                      <span className="member-detail-icon">📱</span>
                      <span>{user.mobile}</span>
                    </div>
                  )}
                </div>
                <div className="member-card-footer">
                  <span className="member-joined">
                    🕐 {daysAgo === 0 ? 'Today' : `${daysAgo}d ago`}
                  </span>
                  <span className={`member-status ${user.is_active ? 'active' : 'inactive'}`}>
                    {user.is_active ? '● Active' : '○ Inactive'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
