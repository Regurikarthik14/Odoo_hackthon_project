import { useState, useEffect } from 'react';
import { dashboardService } from '../services';
import LoadingSpinner from '../components/LoadingSpinner';
import './Dashboard.css';

const KPI_ICONS = {
  total_vehicles: '🚛',
  active_vehicles: '🏃',
  available_vehicles: '✅',
  vehicles_in_maintenance: '🔧',
  total_drivers: '👤',
  drivers_on_duty: '🎯',
  available_drivers: '👍',
  active_trips: '🗺️',
  pending_trips: '📋',
  completed_trips: '✅',
  fleet_utilization: '📊',
};

const KPI_LABELS = {
  total_vehicles: 'Total Vehicles',
  active_vehicles: 'Active Vehicles',
  available_vehicles: 'Available Vehicles',
  vehicles_in_maintenance: 'In Maintenance',
  total_drivers: 'Total Drivers',
  drivers_on_duty: 'Drivers On Duty',
  available_drivers: 'Available Drivers',
  active_trips: 'Active Trips',
  pending_trips: 'Pending Trips',
  completed_trips: 'Completed Trips',
  fleet_utilization: 'Fleet Utilization',
};

export default function Dashboard() {
  const [kpis, setKpis] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [filters, setFilters] = useState({ vehicle_type: '', status: '', region: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.vehicle_type) params.vehicle_type = filters.vehicle_type;
      if (filters.status) params.status = filters.status;
      if (filters.region) params.region = filters.region;

      const [kpiRes, activityRes] = await Promise.all([
        dashboardService.getKPIs(params),
        dashboardService.getRecentActivity(),
      ]);
      setKpis(kpiRes.data);
      setRecentActivity(activityRes.data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTrend = (key) => {
    if (key === 'fleet_utilization') return 'up';
    if (key.includes('active') || key.includes('available') || key === 'completed_trips') return 'up';
    if (key.includes('maintenance') || key === 'pending_trips') return 'warning';
    return 'up';
  };

  const formatValue = (key, value) => {
    if (key === 'fleet_utilization') return `${value}%`;
    return value?.toLocaleString() || 0;
  };

  if (!kpis) return <LoadingSpinner fullScreen text="Loading dashboard..." />;

  return (
    <div className="dashboard-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Fleet Dashboard</h1>
          <p className="page-subtitle">Real-time overview of your fleet operations</p>
        </div>
      </div>

      <div className="filter-bar">
        <select
          className="filter-select"
          value={filters.vehicle_type}
          onChange={(e) => setFilters((f) => ({ ...f, vehicle_type: e.target.value }))}
        >
          <option value="">All Types</option>
          <option value="truck">Truck</option>
          <option value="van">Van</option>
          <option value="bus">Bus</option>
        </select>
        <select
          className="filter-select"
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
        >
          <option value="">All Status</option>
          <option value="available">Available</option>
          <option value="on_trip">On Trip</option>
          <option value="in_shop">In Shop</option>
          <option value="retired">Retired</option>
        </select>
        <select
          className="filter-select"
          value={filters.region}
          onChange={(e) => setFilters((f) => ({ ...f, region: e.target.value }))}
        >
          <option value="">All Regions</option>
          <option value="North">North</option>
          <option value="South">South</option>
          <option value="East">East</option>
          <option value="West">West</option>
        </select>
      </div>

      {loading ? (
        <LoadingSpinner text="Updating KPIs..." />
      ) : (
        <>
          <div className="kpi-grid">
            {Object.entries(kpis).map(([key, value]) => (
              <div key={key} className="kpi-card">
                <div className="kpi-icon">{KPI_ICONS[key] || '📌'}</div>
                <div className="kpi-value">{formatValue(key, value)}</div>
                <div className="kpi-label">{KPI_LABELS[key] || key.replace(/_/g, ' ')}</div>
                <span className={`kpi-trend ${getTrend(key)}`}>
                  {typeof value === 'number' && value > 0 ? '↑ Active' : '—'}
                </span>
              </div>
            ))}
          </div>

          <div className="section-title">
            📋 Recent Activity
          </div>
          <div className="activity-list">
            {recentActivity.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
                No recent trip activity
              </p>
            ) : (
              recentActivity.map((trip) => (
                <div key={trip.id} className="activity-item">
                  <div className="activity-icon">
                    {trip.status === 'completed' ? '✅' : trip.status === 'dispatched' ? '🚚' : trip.status === 'cancelled' ? '❌' : '📝'}
                  </div>
                  <div className="activity-details">
                    <div className="activity-text">
                      {trip.source} → {trip.destination}
                    </div>
                    <div className="activity-meta">
                      {trip.vehicle_reg || 'N/A'} · {trip.driver_name || 'Unassigned'} · {trip.cargo_weight} kg
                    </div>
                  </div>
                  <span className={`activity-status status-${trip.status}`}>{trip.status}</span>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
