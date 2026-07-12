import { useState, useEffect } from 'react';
import { reportService, vehicleService } from '../services';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell
} from 'recharts';
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

  // Chart data
  const costBreakdownData = summary ? [
    { name: 'Fuel Cost', value: summary.total_fuel_cost || 0, color: COLORS.orange },
    { name: 'Maintenance', value: summary.total_maintenance_cost || 0, color: COLORS.blue },
    { name: 'Other Expenses', value: summary.total_other_expenses || 0, color: COLORS.purple },
  ].filter(d => d.value > 0) : [];

  const vehicleCostData = summary?.per_vehicle ? summary.per_vehicle.map(v => ({
    name: v.registration,
    'Fuel Cost': v.total_fuel_cost,
    'Maintenance Cost': v.total_maintenance_cost,
    'Operational Cost': v.total_operational_cost,
  })) : [];

  const vehicleROIData = summary?.per_vehicle ? summary.per_vehicle.map(v => ({
    name: v.registration,
    'ROI %': v.roi_percentage,
    'Est. Revenue': v.estimated_revenue,
    'Total Cost': v.total_operational_cost,
  })) : [];

  const formatValue = (name, value) => {
    if (typeof value !== 'number') return value;
    if (name.includes('%')) {
      return `${value.toFixed(1)}%`;
    }
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip">
          <p className="chart-tooltip-label">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="chart-tooltip-value" style={{ color: entry.color }}>
              {entry.name}: {formatValue(entry.name, entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
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

          {/* Cost Analytics Charts - show when we have data */}
          {costBreakdownData.length > 0 && (
            <div className="charts-section">
              <h2 className="section-title">💰 Cost Analytics</h2>
              <div className="charts-grid">
                <div className="chart-card">
                  <h3 className="chart-title">Cost Breakdown</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={costBreakdownData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={105}
                        paddingAngle={4}
                        dataKey="value"
                        animationBegin={0}
                        animationDuration={1200}
                      >
                        {costBreakdownData.map((entry, index) => (
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

                {/* Per-Vehicle Cost Comparison BarChart */}
                {vehicleCostData.length > 0 && (
                  <div className="chart-card">
                    <h3 className="chart-title">Per-Vehicle Cost Comparison</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={vehicleCostData} barGap={4}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                        <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                          verticalAlign="top"
                          height={36}
                          formatter={(value) => <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{value}</span>}
                        />
                        <Bar dataKey="Fuel Cost" fill={COLORS.orange} radius={[4, 4, 0, 0]} animationDuration={800} />
                        <Bar dataKey="Maintenance Cost" fill={COLORS.blue} radius={[4, 4, 0, 0]} animationDuration={1000} />
                        <Bar dataKey="Operational Cost" fill={COLORS.purple} radius={[4, 4, 0, 0]} animationDuration={1200} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* ROI Analysis BarChart */}
                {vehicleROIData.length > 0 && (
                  <div className="chart-card">
                    <h3 className="chart-title">📊 ROI & Revenue Analysis</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={vehicleROIData} barGap={4}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                        <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="left" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                          verticalAlign="top"
                          height={36}
                          formatter={(value) => <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{value}</span>}
                        />
                        <Bar yAxisId="left" dataKey="Est. Revenue" fill={COLORS.green} radius={[4, 4, 0, 0]} animationDuration={800} />
                        <Bar yAxisId="left" dataKey="Total Cost" fill={COLORS.red} radius={[4, 4, 0, 0]} animationDuration={1000} />
                        <Bar yAxisId="right" dataKey="ROI %" fill={COLORS.orange} radius={[4, 4, 0, 0]} animationDuration={1200} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          )}

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
