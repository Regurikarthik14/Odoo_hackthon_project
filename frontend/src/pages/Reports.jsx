import { useState, useEffect } from 'react';
import { reportService, vehicleService } from '../services';
import LoadingSpinner from '../components/LoadingSpinner';
import './Reports.css';

export default function Reports() {
  const [summary, setSummary] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [sumRes, vehRes] = await Promise.all([
          reportService.getSummary(),
          vehicleService.getAll()
        ]);
        setSummary(sumRes.data);
        setVehicles(vehRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const loadSummary = async (vehicleId) => {
    setLoading(true);
    try {
      const params = vehicleId ? { vehicle_id: vehicleId } : {};
      const res = await reportService.getSummary(params);
      setSummary(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVehicleFilter = (val) => {
    setSelectedVehicle(val);
    loadSummary(val);
  };

  if (!summary) return <LoadingSpinner fullScreen text="Loading reports..." />;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">📈 Reports & Analytics</h1>
          <p className="page-subtitle">Fuel efficiency, operational costs, and ROI analysis</p>
        </div>
      </div>

      <div className="filter-bar">
        <select className="filter-select" value={selectedVehicle}
          onChange={(e) => handleVehicleFilter(e.target.value)}>
          <option value="">All Vehicles</option>
          {vehicles.map(v => (
            <option key={v.id} value={v.id}>{v.registration_number} - {v.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <LoadingSpinner text="Generating report..." />
      ) : (
        <>
          <div className="report-grid">
            <div className="report-card">
              <div className="report-card-icon">⛽</div>
              <div className="report-card-value">{summary.fuel_efficiency} km/L</div>
              <div className="report-card-label">Fuel Efficiency</div>
              <div className="report-card-detail">
                {summary.total_fuel_consumed} L consumed · {summary.total_distance_traveled} km traveled
              </div>
            </div>
            <div className="report-card">
              <div className="report-card-icon">💰</div>
              <div className="report-card-value">${summary.total_fuel_cost?.toLocaleString()}</div>
              <div className="report-card-label">Fuel Cost</div>
            </div>
            <div className="report-card">
              <div className="report-card-icon">🔧</div>
              <div className="report-card-value">${summary.total_maintenance_cost?.toLocaleString()}</div>
              <div className="report-card-label">Maintenance Cost</div>
            </div>
            <div className="report-card">
              <div className="report-card-icon">📊</div>
              <div className="report-card-value">{summary.fleet_utilization}%</div>
              <div className="report-card-label">Fleet Utilization</div>
            </div>
            <div className="report-card report-card-wide">
              <div className="report-card-icon">💵</div>
              <div className="report-card-value">${summary.total_operational_cost?.toLocaleString()}</div>
              <div className="report-card-label">Total Operational Cost</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <a href={reportService.exportCSV('vehicles')} className="btn-primary" style={{ textDecoration: 'none' }}
              download>📥 Export Vehicles CSV</a>
            <a href={reportService.exportCSV('trips')} className="btn-primary" style={{ textDecoration: 'none', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}
              download>📥 Export Trips CSV</a>
            <a href={reportService.exportCSV('expenses')} className="btn-primary" style={{ textDecoration: 'none', background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
              download>📥 Export Expenses CSV</a>
          </div>

          {summary.per_vehicle?.length > 0 && (
            <>
              <h2 className="section-title">🚚 Per-Vehicle Analysis</h2>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Vehicle</th>
                      <th>Fuel Cost</th>
                      <th>Maintenance Cost</th>
                      <th>Total Cost</th>
                      <th>Trips</th>
                      <th>Est. Revenue</th>
                      <th>ROI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.per_vehicle.map((v) => (
                      <tr key={v.vehicle_id}>
                        <td><strong>{v.registration}</strong><br /><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{v.name}</span></td>
                        <td>${v.total_fuel_cost.toLocaleString()}</td>
                        <td>${v.total_maintenance_cost.toLocaleString()}</td>
                        <td>${v.total_operational_cost.toLocaleString()}</td>
                        <td>{v.completed_trips}</td>
                        <td>${v.estimated_revenue.toLocaleString()}</td>
                        <td>
                          <span className={`roi-badge ${v.roi_percentage >= 0 ? 'positive' : 'negative'}`}>
                            {v.roi_percentage >= 0 ? '↑' : '↓'} {Math.abs(v.roi_percentage)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
