import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function Dashboard() {
  const navigate = useNavigate()
  const [kpi, setKpi] = useState(null)
  const [trips, setTrips] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isGuest, setIsGuest] = useState(false)

  useEffect(() => {
    if (api.isAuthenticated()) {
      fetchDashboardData()
    } else {
      setIsGuest(true)
      setLoading(false)
    }
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    setError('')
    try {
      const [kpiData, tripsData, vehiclesData] = await Promise.all([
        api.getKPI(), api.getTrips(), api.getVehicles()
      ])
      setKpi(kpiData.kpi)
      setTrips(tripsData.trips || [])
      setVehicles(vehiclesData.vehicles || [])
    } catch (err) {
      setError(err.message || 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => { api.logout(); navigate('/login') }

  const getStats = () => {
    if (!kpi) return [
      { label: 'Total Vehicles', value: '--', change: 'Login to see', icon: 'vehicle' },
      { label: 'Active Drivers', value: '--', change: 'Login to see', icon: 'driver' },
      { label: 'Ongoing Trips', value: '--', change: 'Login to see', icon: 'trip' },
      { label: 'Service Due', value: '--', change: 'Login to see', icon: 'maintenance' },
    ]
    return [
      { label: 'Total Vehicles', value: kpi.vehicles.total, change: kpi.vehicles.available + ' available', icon: 'vehicle' },
      { label: 'Active Drivers', value: kpi.drivers.total, change: kpi.drivers.available + ' available', icon: 'driver' },
      { label: 'Ongoing Trips', value: kpi.trips.active, change: kpi.trips.completed + ' completed', icon: 'trip' },
      { label: 'Service Due', value: kpi.maintenance.pending, change: kpi.maintenance.total + ' total', icon: 'maintenance' },
    ]
  }

  const getAlerts = () => {
    if (isGuest) return [{ type: 'info', message: 'Browsing as a guest. Sign in to manage your fleet.' }]
    const a = []
    const iv = vehicles.filter(v => v.status === 'in-shop')
    if (iv.length) a.push({ type: 'warning', message: iv.length + ' vehicle(s) in maintenance' })
    const dt = trips.filter(t => t.status === 'delayed')
    if (dt.length) a.push({ type: 'error', message: dt.length + ' trip(s) delayed' })
    if (!trips.length && !loading) a.push({ type: 'info', message: 'No trips yet. Create your first trip!' })
    return a
  }

  const stats = getStats()
  const alerts = getAlerts()
  const recentTrips = kpi ? trips.slice(0, 5) : []

  const iconSVG = {
    vehicle: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>',
    driver: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    trip: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
    maintenance: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>'
  }

  if (loading) return (
    <div className="dashboard-page">
      <div className="loading-container"><div className="spinner spinner-large"></div><p>Loading dashboard...</p></div>
    </div>
  )

  if (error && !isGuest) return (
    <div className="dashboard-page">
      <div className="error-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <h2>Failed to load dashboard</h2><p>{error}</p>
        <button className="btn btn-primary" onClick={fetchDashboardData}>Retry</button>
        <button className="btn btn-secondary" onClick={handleLogout}>Go to Login</button>
      </div>
    </div>
  )

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div className="header-left">
          <div className="brand-logo small">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
              <line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/>
              <line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/>
            </svg>
          </div>
          <h2>FleetMaster Pro</h2>
        </div>
        <div className="header-right">
          {isGuest ? (
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/login')}>Sign In</button>
          ) : (
            <>
              <button className="btn btn-sm badge" onClick={() => {}}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                {alerts.length > 0 && <span className="badge-count">{alerts.length}</span>}
              </button>
              <button className="btn btn-outline" onClick={handleLogout}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Logout
              </button>
            </>
          )}
        </div>
      </header>

      <main className="dashboard-main">
        {isGuest && (
          <div className="guest-banner">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            <span>You are browsing as a guest.</span>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/login')}>Sign In</button>
            <span>to access live data.</span>
          </div>
        )}

        <div className="stats-grid">
          {stats.map((s, i) => (
            <div key={i} className="stat-card">
              <div className="stat-icon" dangerouslySetInnerHTML={{ __html: iconSVG[s.icon] }} />
              <div className="stat-info">
                <span className="stat-label">{s.label}</span>
                <span className="stat-value">{s.value}</span>
                <span className="stat-change">{s.change}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="dashboard-grid">
          <div className="card trips-card">
            <div className="card-header"><h3>Recent Trips</h3><span className="card-count">{recentTrips.length} trips</span></div>
            <div className="card-body">
              {recentTrips.length === 0 ? (
                <div className="empty-state"><p>{isGuest ? 'Sign in to view trips' : 'No trips found'}</p></div>
              ) : (
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead><tr><th>ID</th><th>Route</th><th>Status</th><th>Distance</th></tr></thead>
                    <tbody>
                      {recentTrips.map(t => (
                        <tr key={t.id}>
                          <td className="trip-id">#{t.id}</td>
                          <td><span className="route-text">{t.route_origin} - {t.route_destination}</span></td>
                          <td><span className={'status-badge status-' + (t.status === 'in-progress' ? 'active' : t.status)}>{t.status}</span></td>
                          <td>{t.distance_km ? t.distance_km + ' km' : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="card alerts-card">
            <div className="card-header"><h3>Alerts</h3><span className="card-count">{alerts.length} alerts</span></div>
            <div className="card-body">
              <div className="alerts-list">
                {alerts.map((a, i) => (
                  <div key={i} className={'alert alert-' + a.type}>
                    <div className="alert-icon">
                      {a.type === 'error' ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                      ) : a.type === 'warning' ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                      )}
                    </div>
                    <span className="alert-message">{a.message}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card actions-card">
            <div className="card-header"><h3>Quick Actions</h3></div>
            <div className="card-body">
              <div className="actions-grid">
                {[
                  { icon: '<rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>', label: 'Add Vehicle' },
                  { icon: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>', label: 'New Trip' },
                  { icon: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>', label: 'Add Driver' },
                  { icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>', label: 'Generate Report' },
                ].map((btn, i) => (
                  <button key={i} className="action-btn" onClick={() => {}}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" dangerouslySetInnerHTML={{ __html: btn.icon }} />
                    <span>{btn.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="dashboard-footer">
        <p>FleetMaster Pro v1.0.0 - Real-time Fleet Management</p>
      </footer>
    </div>
  )
}
