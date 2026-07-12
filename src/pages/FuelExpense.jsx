import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getFuelLogs, createFuelLog, getExpenses, createExpense, getVehicles } from '../services/api';

const EXPENSE_TYPES = ['Toll', 'Parking', 'Maintenance', 'Insurance', 'Cleaning', 'Other'];

export default function FuelExpense() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('manage-fuel-expenses');

  const [fuelLogs, setFuelLogs] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('fuel');
  const [showFuelModal, setShowFuelModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const [fuelForm, setFuelForm] = useState({ vehicleId: '', liters: '', cost: '' });
  const [expenseForm, setExpenseForm] = useState({ vehicleId: '', type: 'Toll', description: '', amount: '' });

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [fuelData, expensesData, vehiclesData] = await Promise.all([
        getFuelLogs(),
        getExpenses(),
        getVehicles(),
      ]);
      setFuelLogs(fuelData);
      setExpenses(expensesData);
      setVehicles(vehiclesData);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [loadData]);

  const handleFuelSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createFuelLog({
        ...fuelForm,
        liters: Number(fuelForm.liters),
        cost: Number(fuelForm.cost),
        vehicleId: Number(fuelForm.vehicleId),
      });
      showToast('Fuel log added');
      setShowFuelModal(false);
      setFuelForm({ vehicleId: '', liters: '', cost: '' });
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createExpense({
        ...expenseForm,
        amount: Number(expenseForm.amount),
        vehicleId: Number(expenseForm.vehicleId),
      });
      showToast('Expense recorded');
      setShowExpenseModal(false);
      setExpenseForm({ vehicleId: '', type: 'Toll', description: '', amount: '' });
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const totalFuelCost = fuelLogs.reduce((s, f) => s + f.cost, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

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
          <h1>⛽ Fuel & Expenses</h1>
          <p>Track fuel consumption and operational expenses.</p>
        </div>
        <div className="flex gap-2">
          {canManage && (
            <>
              <button className="btn btn-primary btn-sm" onClick={() => setShowFuelModal(true)}>+ Add Fuel</button>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowExpenseModal(true)}>+ Add Expense</button>
            </>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <div className="kpi-card blue">
          <div className="kpi-header">
            <div className="kpi-icon blue">⛽</div>
          </div>
          <div className="kpi-value">${totalFuelCost.toLocaleString()}</div>
          <div className="kpi-label">Total Fuel Cost</div>
          <div className="kpi-change positive">{fuelLogs.length} entries</div>
        </div>
        <div className="kpi-card yellow">
          <div className="kpi-header">
            <div className="kpi-icon yellow">💰</div>
          </div>
          <div className="kpi-value">${totalExpenses.toLocaleString()}</div>
          <div className="kpi-label">Total Other Expenses</div>
          <div className="kpi-change positive">{expenses.length} entries</div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-header">
            <div className="kpi-icon green">📊</div>
          </div>
          <div className="kpi-value">${(totalFuelCost + totalExpenses).toLocaleString()}</div>
          <div className="kpi-label">Total Operational Cost</div>
          <div className="kpi-change positive">All time</div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2" style={{ marginBottom: 20 }}>
        <button
          className={`btn ${activeTab === 'fuel' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setActiveTab('fuel')}
        >
          ⛽ Fuel Logs
        </button>
        <button
          className={`btn ${activeTab === 'expenses' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setActiveTab('expenses')}
        >
          💰 Other Expenses
        </button>
      </div>

      {/* Fuel Logs Table */}
      {activeTab === 'fuel' && (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Liters</th>
                <th>Cost</th>
                <th>Price/Liter</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center text-muted" style={{ padding: 40 }}>⏳ Loading...</td></tr>
              ) : fuelLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center" style={{ padding: 40 }}>
                    <div className="empty-state">
                      <div className="empty-state-icon">⛽</div>
                      <h3>No fuel logs</h3>
                      <p>Record your first fuel entry.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                fuelLogs.map((log) => (
                  <tr key={log.id}>
                    <td><strong>{log.vehicleReg}</strong> - {log.vehicleName}</td>
                    <td>{log.liters} L</td>
                    <td>${log.cost}</td>
                    <td>${(log.cost / log.liters).toFixed(2)}/L</td>
                    <td className="text-muted">{log.date}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Expenses Table */}
      {activeTab === 'expenses' && (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Type</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center text-muted" style={{ padding: 40 }}>⏳ Loading...</td></tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center" style={{ padding: 40 }}>
                    <div className="empty-state">
                      <div className="empty-state-icon">💰</div>
                      <h3>No expenses recorded</h3>
                      <p>Add your first expense entry.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                expenses.map((exp) => (
                  <tr key={exp.id}>
                    <td><strong>{exp.vehicleName}</strong></td>
                    <td>{exp.type}</td>
                    <td style={{ maxWidth: 200 }} className="truncate">{exp.description}</td>
                    <td>${exp.amount}</td>
                    <td className="text-muted">{exp.date}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Fuel Modal */}
      {showFuelModal && (
        <div className="modal-overlay" onClick={() => setShowFuelModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>⛽ Add Fuel Log</h2>
              <button className="modal-close" onClick={() => setShowFuelModal(false)}>✕</button>
            </div>
            <form onSubmit={handleFuelSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Vehicle</label>
                  <select className="form-control" value={fuelForm.vehicleId} onChange={(e) => setFuelForm({ ...fuelForm, vehicleId: e.target.value })} required>
                    <option value="">Select vehicle...</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>{v.regNumber} - {v.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Liters *</label>
                    <input type="number" className="form-control" value={fuelForm.liters} onChange={(e) => setFuelForm({ ...fuelForm, liters: e.target.value })} placeholder="e.g., 50" required min="1" step="0.1" />
                  </div>
                  <div className="form-group">
                    <label>Cost ($) *</label>
                    <input type="number" className="form-control" value={fuelForm.cost} onChange={(e) => setFuelForm({ ...fuelForm, cost: e.target.value })} placeholder="e.g., 175" required min="1" step="0.01" />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowFuelModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Add Fuel Log'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expense Modal */}
      {showExpenseModal && (
        <div className="modal-overlay" onClick={() => setShowExpenseModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>💰 Add Expense</h2>
              <button className="modal-close" onClick={() => setShowExpenseModal(false)}>✕</button>
            </div>
            <form onSubmit={handleExpenseSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Vehicle</label>
                    <select className="form-control" value={expenseForm.vehicleId} onChange={(e) => setExpenseForm({ ...expenseForm, vehicleId: e.target.value })} required>
                      <option value="">Select vehicle...</option>
                      {vehicles.map((v) => (
                        <option key={v.id} value={v.id}>{v.regNumber} - {v.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Expense Type</label>
                    <select className="form-control" value={expenseForm.type} onChange={(e) => setExpenseForm({ ...expenseForm, type: e.target.value })}>
                      {EXPENSE_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <input type="text" className="form-control" value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })} placeholder="e.g., Highway toll I-95" />
                </div>
                <div className="form-group">
                  <label>Amount ($) *</label>
                  <input type="number" className="form-control" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} placeholder="e.g., 45" required min="1" step="0.01" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowExpenseModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Add Expense'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
