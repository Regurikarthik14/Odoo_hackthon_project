import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getReportsData } from '../services/api';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from 'recharts';

export default function Reports() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeReport, setActiveReport] = useState('efficiency');
  const [toast, setToast] = useState(null);
  const tableRef = useRef(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const reportsData = await getReportsData();
        setData(reportsData);
      } catch (err) {
        showToast('Failed to load reports', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [showToast]);

  const exportToCSV = (filename, rows, headers) => {
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => headers.map((h) => `"${row[h] ?? ''}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${filename}.csv`);
  };

  if (loading) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📊</div>
        <h3>Loading Reports...</h3>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📊</div>
        <h3>No report data available</h3>
        <p>Complete some trips and record expenses to see analytics.</p>
      </div>
    );
  }

  const reports = [
    { id: 'efficiency', label: 'Fuel Efficiency', icon: '⛽' },
    { id: 'costs', label: 'Operational Costs', icon: '💰' },
    { id: 'roi', label: 'Vehicle ROI', icon: '📈' },
    { id: 'summary', label: 'Fleet Summary', icon: '📋' },
  ];

  return (
    <div>
      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type}`}>
            {toast.type === 'success' ? '✅' : '❌'} {toast.message}
          </div>
        </div>
      )}

      <div className="page-header">
        <div>
          <h1>📈 Reports & Analytics</h1>
          <p>Fleet performance metrics, costs, and operational efficiency.</p>
        </div>
        <div className="flex gap-2">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              let rows, headers, filename;
              if (activeReport === 'efficiency') {
                headers = ['Vehicle', 'Reg Number', 'Distance (km)', 'Fuel (L)', 'Efficiency (km/L)'];
                rows = data.fuelEfficiency.map(f => [f.vehicleName, f.regNumber, f.distance, f.fuelConsumed, f.efficiency]);
                filename = 'fuel-efficiency';
              } else if (activeReport === 'costs') {
                headers = ['Vehicle', 'Reg Number', 'Fuel Cost', 'Maintenance Cost', 'Other Expenses', 'Total Cost'];
                rows = data.operationalCosts.map(c => [c.vehicleName, c.regNumber, c.fuelCost, c.maintenanceCost, c.otherExpenses, c.totalCost]);
                filename = 'operational-costs';
              } else if (activeReport === 'roi') {
                headers = ['Vehicle', 'Reg Number', 'Revenue', 'Total Cost', 'Acquisition Cost', 'ROI (%)'];
                rows = data.vehicleROI.map(r => [r.vehicleName, r.regNumber, r.revenue, r.totalCost, r.acquisitionCost, r.roi]);
                filename = 'vehicle-roi';
              } else {
                headers = ['Metric', 'Value'];
                rows = [
                  ['Total Vehicles', data.totalVehicles],
                  ['Fleet Utilization', `${data.utilizationRate}%`],
                  ['Completed Trips', data.fuelEfficiency.length],
                ];
                filename = 'fleet-summary';
              }
              exportToCSV(filename, rows, headers);
            }}
          >
            📥 CSV
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              const doc = new jsPDF('landscape', 'mm', 'a4');
              const pageWidth = doc.internal.pageSize.getWidth();

              // Header with title and gradient-like style
              doc.setFillColor(220, 38, 38);
              doc.rect(0, 0, pageWidth, 30, 'F');
              doc.setFillColor(249, 115, 22);
              doc.rect(0, 28, pageWidth, 2, 'F');

              doc.setTextColor(255, 255, 255);
              doc.setFontSize(16);
              doc.setFont('helvetica', 'bold');
              doc.text('FleetMaster Pro - Fleet Report', pageWidth / 2, 18, { align: 'center' });

              doc.setTextColor(100, 116, 139);
              doc.setFontSize(9);
              doc.setFont('helvetica', 'normal');
              doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 38);

              if (activeReport === 'efficiency') {
                doc.setTextColor(220, 38, 38);
                doc.setFontSize(13);
                doc.setFont('helvetica', 'bold');
                doc.text('Fuel Efficiency Report', 14, 48);

                doc.autoTable({
                  startY: 54,
                  head: [['Vehicle', 'Reg Number', 'Distance (km)', 'Fuel (L)', 'Efficiency (km/L)']],
                  body: data.fuelEfficiency.map(f => [f.vehicleName, f.regNumber, f.distance?.toLocaleString(), f.fuelConsumed, f.efficiency]),
                  theme: 'grid',
                  headStyles: { fillColor: [220, 38, 38], fontSize: 9, halign: 'center' },
                  bodyStyles: { fontSize: 8 },
                  alternateRowStyles: { fillColor: [255, 240, 240] },
                });
              } else if (activeReport === 'costs') {
                doc.setTextColor(220, 38, 38);
                doc.setFontSize(13);
                doc.setFont('helvetica', 'bold');
                doc.text('Operational Costs Report', 14, 48);

                doc.autoTable({
                  startY: 54,
                  head: [['Vehicle', 'Reg Number', 'Fuel Cost', 'Maintenance Cost', 'Other Expenses', 'Total Cost']],
                  body: data.operationalCosts.map(c => [c.vehicleName, c.regNumber, `$${c.fuelCost}`, `$${c.maintenanceCost}`, `$${c.otherExpenses}`, `$${c.totalCost}`]),
                  theme: 'grid',
                  headStyles: { fillColor: [220, 38, 38], fontSize: 9, halign: 'center' },
                  bodyStyles: { fontSize: 8 },
                  alternateRowStyles: { fillColor: [255, 240, 240] },
                });
              } else if (activeReport === 'roi') {
                doc.setTextColor(220, 38, 38);
                doc.setFontSize(13);
                doc.setFont('helvetica', 'bold');
                doc.text('Vehicle ROI Report', 14, 48);

                doc.autoTable({
                  startY: 54,
                  head: [['Vehicle', 'Reg Number', 'Revenue', 'Total Cost', 'Acquisition Cost', 'ROI (%)']],
                  body: data.vehicleROI.map(r => [r.vehicleName, r.regNumber, `$${r.revenue}`, `$${r.totalCost}`, `$${r.acquisitionCost}`, `${r.roi}%`]),
                  theme: 'grid',
                  headStyles: { fillColor: [220, 38, 38], fontSize: 9, halign: 'center' },
                  bodyStyles: { fontSize: 8 },
                  alternateRowStyles: { fillColor: [255, 240, 240] },
                });
              } else {
                doc.setTextColor(220, 38, 38);
                doc.setFontSize(13);
                doc.setFont('helvetica', 'bold');
                doc.text('Fleet Summary Report', 14, 48);

                doc.autoTable({
                  startY: 54,
                  head: [['Metric', 'Value']],
                  body: [
                    ['Total Vehicles', String(data.totalVehicles)],
                    ['Fleet Utilization', `${data.utilizationRate}%`],
                    ['Completed Trips', String(data.fuelEfficiency.length)],
                  ],
                  theme: 'grid',
                  headStyles: { fillColor: [220, 38, 38], fontSize: 9, halign: 'center' },
                  bodyStyles: { fontSize: 8 },
                  alternateRowStyles: { fillColor: [255, 240, 240] },
                });
              }

              // Footer
              const pageCount = doc.internal.getNumberOfPages();
              for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setTextColor(148, 163, 184);
                doc.setFontSize(7);
                doc.text(
                  `Page ${i} of ${pageCount} | FleetMaster Pro © ${new Date().getFullYear()}`,
                  pageWidth / 2,
                  doc.internal.pageSize.getHeight() - 8,
                  { align: 'center' }
                );
              }

              // Save
              const pdfFilename = `fleetmaster-${activeReport}-${new Date().toISOString().split('T')[0]}.pdf`;
              doc.save(pdfFilename);
              showToast(`📄 Exported ${pdfFilename}`);
            }}
          >
            📄 PDF
          </button>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="flex gap-2" style={{ marginBottom: 24, flexWrap: 'wrap' }}>
        {reports.map((r) => (
          <button
            key={r.id}
            className={`btn ${activeReport === r.id ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveReport(r.id)}
          >
            {r.icon} {r.label}
          </button>
        ))}
      </div>

      {/* Fuel Efficiency Report */}
      {activeReport === 'efficiency' && (
        <div className="card">
          <div className="card-header">
            <h3>⛽ Fuel Efficiency (km/L)</h3>
            <span className="text-muted" style={{ fontSize: 13 }}>Per completed trip</span>
          </div>
          <div className="card-body">
            {data.fuelEfficiency.length > 0 ? (
              <>
                <div className="chart-container" style={{ height: 350 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.fuelEfficiency} margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="vehicleName" stroke="#94a3b8" fontSize={12} />
                      <YAxis stroke="#94a3b8" fontSize={12} label={{ value: 'km/L', angle: -90, position: 'insideLeft', style: { fill: '#94a3b8' } }} />
                      <Tooltip
                        contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8 }}
                      />
                      <Bar dataKey="efficiency" fill="#10b981" radius={[6, 6, 0, 0]} name="km/L" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="table-container" style={{ marginTop: 24, border: '1px solid #e2e8f0' }}>
                  <table ref={tableRef}>
                    <thead>
                      <tr>
                        <th>Vehicle</th>
                        <th>Reg Number</th>
                        <th>Distance (km)</th>
                        <th>Fuel (L)</th>
                        <th>Efficiency (km/L)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.fuelEfficiency.map((f, idx) => (
                        <tr key={idx}>
                          <td><strong>{f.vehicleName}</strong></td>
                          <td>{f.regNumber}</td>
                          <td>{f.distance?.toLocaleString()}</td>
                          <td>{f.fuelConsumed}</td>
                          <td><strong>{f.efficiency}</strong> km/L</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">⛽</div>
                <h3>No completed trips with fuel data</h3>
                <p>Complete trips and record fuel consumption to see efficiency metrics.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Operational Costs Report */}
      {activeReport === 'costs' && (
        <div className="card">
          <div className="card-header">
            <h3>💰 Operational Costs by Vehicle</h3>
            <span className="text-muted" style={{ fontSize: 13 }}>Fuel + Maintenance + Other</span>
          </div>
          <div className="card-body">
            <div className="chart-container" style={{ height: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.operationalCosts} margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="vehicleName" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} label={{ value: 'Cost ($)', angle: -90, position: 'insideLeft', style: { fill: '#94a3b8' } }} />
                  <Tooltip
                    contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8 }}
                  />
                  <Legend />
                  <Bar dataKey="fuelCost" fill="#2563eb" radius={[4, 4, 0, 0]} name="Fuel Cost" stackId="a" />
                  <Bar dataKey="maintenanceCost" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Maintenance Cost" stackId="a" />
                  <Bar dataKey="otherExpenses" fill="#94a3b8" radius={[4, 4, 0, 0]} name="Other Expenses" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="table-container" style={{ marginTop: 24, border: '1px solid #e2e8f0' }}>
              <table>
                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>Fuel Cost</th>
                    <th>Maintenance Cost</th>
                    <th>Other Expenses</th>
                    <th>Total Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {data.operationalCosts.map((c, idx) => (
                    <tr key={idx}>
                      <td><strong>{c.vehicleName}</strong> ({c.regNumber})</td>
                      <td>${c.fuelCost.toLocaleString()}</td>
                      <td>${c.maintenanceCost.toLocaleString()}</td>
                      <td>${c.otherExpenses.toLocaleString()}</td>
                      <td><strong>${c.totalCost.toLocaleString()}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Vehicle ROI Report */}
      {activeReport === 'roi' && (
        <div className="card">
          <div className="card-header">
            <h3>📈 Vehicle ROI</h3>
            <span className="text-muted" style={{ fontSize: 13 }}>Return on Investment</span>
          </div>
          <div className="card-body">
            <div className="chart-container" style={{ height: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.vehicleROI} margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="vehicleName" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} label={{ value: 'ROI (%)', angle: -90, position: 'insideLeft', style: { fill: '#94a3b8' } }} />
                  <Tooltip
                    contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8 }}
                    formatter={(value) => [`${value}%`, 'ROI']}
                  />
                  <Bar dataKey="roi" fill="#8b5cf6" radius={[6, 6, 0, 0]} name="ROI %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="table-container" style={{ marginTop: 24, border: '1px solid #e2e8f0' }}>
              <table>
                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>Revenue</th>
                    <th>Total Cost</th>
                    <th>Acquisition Cost</th>
                    <th>ROI (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.vehicleROI.map((r, idx) => (
                    <tr key={idx}>
                      <td><strong>{r.vehicleName}</strong> ({r.regNumber})</td>
                      <td>${r.revenue.toLocaleString()}</td>
                      <td>${r.totalCost.toLocaleString()}</td>
                      <td>${r.acquisitionCost.toLocaleString()}</td>
                      <td>
                        <span style={{ color: r.roi >= 0 ? '#10b981' : '#ef4444', fontWeight: 700 }}>
                          {r.roi}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Fleet Summary Report */}
      {activeReport === 'summary' && (
        <div className="grid-3">
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center', padding: 32 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🚛</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: '#2563eb' }}>{data.totalVehicles}</div>
              <div className="text-muted" style={{ fontWeight: 500 }}>Total Vehicles</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center', padding: 32 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: '#10b981' }}>{data.utilizationRate}%</div>
              <div className="text-muted" style={{ fontWeight: 500 }}>Fleet Utilization</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center', padding: 32 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: '#f59e0b' }}>{data.fuelEfficiency.length}</div>
              <div className="text-muted" style={{ fontWeight: 500 }}>Completed Trips</div>
            </div>
          </div>

          {/* Monthly Fuel Trend */}
          {data.monthlyFuel.length > 0 && (
            <div className="card" style={{ gridColumn: '1 / -1' }}>
              <div className="card-header">
                <h3>📈 Monthly Fuel Consumption</h3>
              </div>
              <div className="card-body">
                <div className="chart-container" style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.monthlyFuel} margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                      <YAxis stroke="#94a3b8" fontSize={12} label={{ value: 'Liters', angle: -90, position: 'insideLeft', style: { fill: '#94a3b8' } }} />
                      <Tooltip
                        contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8 }}
                      />
                      <Line type="monotone" dataKey="liters" stroke="#2563eb" strokeWidth={3} dot={{ fill: '#2563eb', strokeWidth: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Formula Documentation */}
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <div className="card-header">
              <h3>📐 Formula Reference</h3>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <div style={{ background: '#f8fafc', padding: 20, borderRadius: 10 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Fleet Utilization</h4>
                  <p style={{ fontSize: 13, color: '#475569' }}>
                    <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>
                      Active Vehicles ÷ Total Vehicles × 100
                    </code>
                  </p>
                </div>
                <div style={{ background: '#f8fafc', padding: 20, borderRadius: 10 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Fuel Efficiency</h4>
                  <p style={{ fontSize: 13, color: '#475569' }}>
                    <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>
                      Distance Traveled ÷ Fuel Consumed
                    </code>
                  </p>
                </div>
                <div style={{ background: '#f8fafc', padding: 20, borderRadius: 10 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Operational Cost</h4>
                  <p style={{ fontSize: 13, color: '#475569' }}>
                    <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>
                      Fuel Cost + Maintenance Cost + Other Expenses
                    </code>
                  </p>
                </div>
                <div style={{ background: '#f8fafc', padding: 20, borderRadius: 10 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Vehicle ROI</h4>
                  <p style={{ fontSize: 13, color: '#475569' }}>
                    <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>
                      (Revenue − Operational Cost) ÷ Acquisition Cost × 100
                    </code>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
