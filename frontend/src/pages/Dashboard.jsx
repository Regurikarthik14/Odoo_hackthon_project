import { useState, useEffect } from 'react';
import { dashboardService } from '../services';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
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

  const COLORS = {
    orange: '#FF6B35',
    red: '#C0392B',
    green: '#22c55e',
    blue: '#3b82f6',
    purple: '#8b5cf6',
    teal: '#14b8a6',
    yellow: '#eab308',
    pink: '#ec4899',
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

  // Chart data preparation
  const vehicleStatusData = kpis ? [
    { name: 'Available', value: kpis.available_vehicles || 0, color: COLORS.green },
    { name: 'Active', value: kpis.active_vehicles || 0, color: COLORS.blue },
    { name: 'In Maintenance', value: kpis.vehicles_in_maintenance || 0, color: COLORS.orange },
  ].filter(d => d.value > 0) : [];

  const fleetComparisonData = kpis ? [
    { name: 'Vehicles', Total: kpis.total_vehicles || 0, Active: kpis.active_vehicles || 0, Available: kpis.available_vehicles || 0, Completed: 0 },
    { name: 'Drivers', Total: kpis.total_drivers || 0, Active: kpis.drivers_on_duty || 0, Available: kpis.available_drivers || 0, Completed: 0 },
    { name: 'Trips', Total: (kpis.active_trips + kpis.pending_trips + kpis.completed_trips) || 0, Active: kpis.active_trips || 0, Available: 0, Completed: kpis.completed_trips || 0 },
  ] : [];

  const tripStatusData = kpis ? [
    { name: 'Active', value: kpis.active_trips || 0, color: COLORS.blue },
    { name: 'Pending', value: kpis.pending_trips || 0, color: COLORS.yellow },
    { name: 'Completed', value: kpis.completed_trips || 0, color: COLORS.green },
  ].filter(d => d.value > 0) : [];

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip">
          <p className="chart-tooltip-label">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="chart-tooltip-value" style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
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

          {/* Charts Section */}
          <div className="charts-section">
            <div className="section-title">📊 Fleet Analytics</div>
            <div className="charts-grid">
              {/* Vehicle Status PieChart */}
              {vehicleStatusData.length > 0 && (
                <div className="chart-card">
                  <h3 className="chart-title">🚛 Vehicle Status Distribution</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={vehicleStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={4}
                        dataKey="value"
                        animationBegin={0}
                        animationDuration={1000}
                      >
                        {vehicleStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(255,255,255,0.1)" />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value) => <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Fleet Comparison BarChart */}
              {fleetComparisonData.length > 0 && (
                <div className="chart-card">
                  <h3 className="chart-title">📈 Fleet vs Drivers vs Trips</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={fleetComparisonData} barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        verticalAlign="top"
                        height={36}
                        formatter={(value) => <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{value}</span>}
                      />
                      <Bar dataKey="Total" fill={COLORS.orange} radius={[4, 4, 0, 0]} animationDuration={800} />
                      <Bar dataKey="Active" fill={COLORS.blue} radius={[4, 4, 0, 0]} animationDuration={1000} />
                      <Bar dataKey="Available" fill={COLORS.green} radius={[4, 4, 0, 0]} animationDuration={1200} />
                      <Bar dataKey="Completed" fill={COLORS.purple} radius={[4, 4, 0, 0]} animationDuration={1200} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Trip Status PieChart */}
              {tripStatusData.length > 0 && (
                <div className="chart-card">
                  <h3 className="chart-title">🗺️ Trip Status Overview</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={tripStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={4}
                        dataKey="value"
                        animationBegin={200}
                        animationDuration={1000}
                      >
                        {tripStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(255,255,255,0.1)" />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value) => <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Fleet Utilization Gauge */}
              {kpis && (
                <div className="chart-card">
                  <h3 className="chart-title">📊 Fleet Utilization Rate</h3>
                  <div className="utilization-display">
                    <div className="utilization-ring">
                      <svg viewBox="0 0 120 120" className="utilization-svg">
                        <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
                        <circle
                          cx="60" cy="60" r="52" fill="none"
                          stroke={COLORS.orange}
                          strokeWidth="10"
                          strokeDasharray={`${2 * Math.PI * 52}`}
                          strokeDashoffset={`${2 * Math.PI * 52 * (1 - (kpis.fleet_utilization || 0) / 100)}`}
                          strokeLinecap="round"
                          transform="rotate(-90 60 60)"
                          style={{ transition: 'stroke-dashoffset 1.5s ease-in-out' }}
                        />
                        <text x="60" y="56" textAnchor="middle" fill="var(--text-primary)" fontSize="24" fontWeight="bold">
                          {kpis.fleet_utilization}%
                        </text>
                        <text x="60" y="74" textAnchor="middle" fill="var(--text-muted)" fontSize="10">
                          Utilization
                        </text>
                      </svg>
                    </div>
                    <div className="utilization-details">
                      <div className="utilization-item">
                        <span className="utilization-dot" style={{ background: COLORS.orange }} />
                        <span>Active: {kpis.active_vehicles} vehicles</span>
                      </div>
                      <div className="utilization-item">
                        <span className="utilization-dot" style={{ background: COLORS.green }} />
                        <span>Available: {kpis.available_vehicles} vehicles</span>
                      </div>
                      <div className="utilization-item">
                        <span className="utilization-dot" style={{ background: COLORS.red }} />
                        <span>In Shop: {kpis.vehicles_in_maintenance} vehicles</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="section-title" style={{ marginTop: '8px' }}>
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
