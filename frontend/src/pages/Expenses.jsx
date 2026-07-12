import { useState, useEffect } from 'react';
import { expenseService, vehicleService } from '../services';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import './TablePage.css';

export default function Expenses() {
  const [fuelLogs, setFuelLogs] = useState([]);
  const [otherExpenses, setOtherExpenses] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('fuel');
  const [showFuelForm, setShowFuelForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);

  const [fuelForm, setFuelForm] = useState({ vehicle_id: '', liters: '', cost: '', date: '', notes: '' });
  const [expForm, setExpForm] = useState({ vehicle_id: '', expense_type: 'toll', amount: '', date: '', description: '' });

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      const [fuelRes, expRes, vehRes] = await Promise.all([
        expenseService.getFuelLogs(),
        expenseService.getOtherExpenses(),
        vehicleService.getAll()
      ]);
      setFuelLogs(fuelRes.data);
      setOtherExpenses(expRes.data);
      setVehicles(vehRes.data);
    } catch (err) {
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFuel = async (e) => {
    e.preventDefault();
    try {
      await expenseService.addFuelLog(fuelForm);
      toast.success('Fuel log added');
      setShowFuelForm(false);
      setFuelForm({ vehicle_id: '', liters: '', cost: '', date: '', notes: '' });
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      await expenseService.addExpense(expForm);
      toast.success('Expense added');
      setShowExpenseForm(false);
      setExpForm({ vehicle_id: '', expense_type: 'toll', amount: '', date: '', description: '' });
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  const handleDeleteFuel = async (id) => {
    if (!confirm('Delete this fuel log?')) return;
    try { await expenseService.deleteFuelLog(id); toast.success('Deleted'); loadAll(); }
    catch { toast.error('Delete failed'); }
  };

  const handleDeleteExpense = async (id) => {
    if (!confirm('Delete this expense?')) return;
    try { await expenseService.deleteExpense(id); toast.success('Deleted'); loadAll(); }
    catch { toast.error('Delete failed'); }
  };

  if (loading) return <LoadingSpinner fullScreen text="Loading expenses..." />;

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">💰 Fuel & Expenses</h1>
          <p className="page-subtitle">Track fuel consumption and operational costs</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <button className={activeTab === 'fuel' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setActiveTab('fuel')}>⛽ Fuel Logs</button>
        <button className={activeTab === 'expenses' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setActiveTab('expenses')}>💵 Other Expenses</button>
      </div>

      {activeTab === 'fuel' ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <button className="btn-primary" onClick={() => setShowFuelForm(true)}>+ Add Fuel Log</button>
          </div>

          {showFuelForm && (
            <div className="modal-overlay" onClick={() => setShowFuelForm(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2 className="modal-title">Add Fuel Log</h2>
                <form onSubmit={handleAddFuel} className="modal-form">
                  <div className="form-group" style={{ width: '100%' }}>
                    <label>Vehicle *</label>
                    <select className="form-input" value={fuelForm.vehicle_id}
                      onChange={(e) => setFuelForm(f => ({ ...f, vehicle_id: e.target.value }))} required>
                      <option value="">Select vehicle...</option>
                      {vehicles.map(v => (
                        <option key={v.id} value={v.id}>{v.registration_number} - {v.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Liters *</label>
                      <input type="number" step="0.01" className="form-input" value={fuelForm.liters}
                        onChange={(e) => setFuelForm(f => ({ ...f, liters: e.target.value }))} required />
                    </div>
                    <div className="form-group">
                      <label>Cost ($) *</label>
                      <input type="number" step="0.01" className="form-input" value={fuelForm.cost}
                        onChange={(e) => setFuelForm(f => ({ ...f, cost: e.target.value }))} required />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Date</label>
                      <input type="date" className="form-input" value={fuelForm.date}
                        onChange={(e) => setFuelForm(f => ({ ...f, date: e.target.value }))} max={today} />
                    </div>
                    <div className="form-group">
                      <label>Notes</label>
                      <input className="form-input" value={fuelForm.notes}
                        onChange={(e) => setFuelForm(f => ({ ...f, notes: e.target.value }))} />
                    </div>
                  </div>
                  <div className="form-actions">
                    <button type="button" className="btn-secondary" onClick={() => setShowFuelForm(false)}>Cancel</button>
                    <button type="submit" className="btn-primary">Add Log</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Liters</th>
                  <th>Cost</th>
                  <th>Date</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {fuelLogs.length === 0 ? (
                  <tr><td colSpan={6} className="empty-state">No fuel logs recorded</td></tr>
                ) : fuelLogs.map(l => (
                  <tr key={l.id}>
                    <td><strong>{l.vehicle_reg}</strong></td>
                    <td>{l.liters} L</td>
                    <td>${l.cost?.toFixed(2)}</td>
                    <td>{l.date?.split('T')[0] || '—'}</td>
                    <td>{l.notes || '—'}</td>
                    <td><button className="btn-icon" onClick={() => handleDeleteFuel(l.id)}>🗑️</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <button className="btn-primary" onClick={() => setShowExpenseForm(true)}>+ Add Expense</button>
          </div>

          {showExpenseForm && (
            <div className="modal-overlay" onClick={() => setShowExpenseForm(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2 className="modal-title">Add Other Expense</h2>
                <form onSubmit={handleAddExpense} className="modal-form">
                  <div className="form-group" style={{ width: '100%' }}>
                    <label>Vehicle *</label>
                    <select className="form-input" value={expForm.vehicle_id}
                      onChange={(e) => setExpForm(f => ({ ...f, vehicle_id: e.target.value }))} required>
                      <option value="">Select vehicle...</option>
                      {vehicles.map(v => (
                        <option key={v.id} value={v.id}>{v.registration_number} - {v.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Type</label>
                      <select className="form-input" value={expForm.expense_type}
                        onChange={(e) => setExpForm(f => ({ ...f, expense_type: e.target.value }))}>
                        <option value="toll">Toll</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="parking">Parking</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Amount ($) *</label>
                      <input type="number" step="0.01" className="form-input" value={expForm.amount}
                        onChange={(e) => setExpForm(f => ({ ...f, amount: e.target.value }))} required />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Date</label>
                      <input type="date" className="form-input" value={expForm.date}
                        onChange={(e) => setExpForm(f => ({ ...f, date: e.target.value }))} max={today} />
                    </div>
                    <div className="form-group">
                      <label>Description</label>
                      <input className="form-input" value={expForm.description}
                        onChange={(e) => setExpForm(f => ({ ...f, description: e.target.value }))} />
                    </div>
                  </div>
                  <div className="form-actions">
                    <button type="button" className="btn-secondary" onClick={() => setShowExpenseForm(false)}>Cancel</button>
                    <button type="submit" className="btn-primary">Add Expense</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {otherExpenses.length === 0 ? (
                  <tr><td colSpan={6} className="empty-state">No other expenses recorded</td></tr>
                ) : otherExpenses.map(e => (
                  <tr key={e.id}>
                    <td><strong>{e.vehicle_reg}</strong></td>
                    <td><span className={`status-badge`}>{e.expense_type}</span></td>
                    <td>${e.amount?.toFixed(2)}</td>
                    <td>{e.date?.split('T')[0] || '—'}</td>
                    <td>{e.description || '—'}</td>
                    <td><button className="btn-icon" onClick={() => handleDeleteExpense(e.id)}>🗑️</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
