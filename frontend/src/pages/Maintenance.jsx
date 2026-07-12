import { useState, useEffect } from 'react';
import { maintenanceService, vehicleService } from '../services';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './TablePage.css';

export default function Maintenance() {
  const [records, setRecords] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const { hasRole } = useAuth();
  const canEdit = hasRole('fleet_manager');

  const [form, setForm] = useState({
    vehicle_id: '', description: '', maintenance_type: 'Other', cost: '', notes: ''
  });

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      const [maintRes, vehRes] = await Promise.all([
        maintenanceService.getAll(),
        vehicleService.getAll()
      ]);
      setRecords(maintRes.data);
      setVehicles(vehRes.data);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setForm({ vehicle_id: '', description: '', maintenance_type: 'Oil Change', cost: '', notes: '' });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await maintenanceService.create(form);
      toast.success('Maintenance record created. Vehicle status → In Shop');
      setShowForm(false);
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create record');
    }
  };

  const handleClose = async (id) => {
    if (!confirm('Close this maintenance record? Vehicle will be set to Available.')) return;
    try {
      await maintenanceService.close(id);
      toast.success('Maintenance closed. Vehicle restored to Available');
      loadAll();
    } catch (err) {
      toast.error('Failed to close maintenance');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this maintenance record?')) return;
    try {
      await maintenanceService.delete(id);
      toast.success('Record deleted');
      loadAll();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  if (loading) return <LoadingSpinner fullScreen text="Loading maintenance records..." />;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">🔧 Maintenance</h1>
          <p className="page-subtitle">Track vehicle maintenance and repairs</p>
        </div>
        {canEdit && <button className="btn-primary" onClick={openCreate}>+ Add Record</button>}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Create Maintenance Record</h2>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group" style={{ width: '100%' }}>
                <label>Vehicle *</label>
                <select className="form-input" value={form.vehicle_id}
                  onChange={(e) => setForm(f => ({ ...f, vehicle_id: e.target.value }))} required>
                  <option value="">Select vehicle...</option>
                  {vehicles.filter(v => v.status !== 'retired').map(v => (
                    <option key={v.id} value={v.id}>
                      {v.registration_number} - {v.name} [{v.status}]
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Maintenance Type</label>
                  <select className="form-input" value={form.maintenance_type}
                    onChange={(e) => setForm(f => ({ ...f, maintenance_type: e.target.value }))}>
                    <option value="Oil Change">Oil Change</option>
                    <option value="Brake Service">Brake Service</option>
                    <option value="Tire Replacement">Tire Replacement</option>
                    <option value="Engine Repair">Engine Repair</option>
                    <option value="Transmission">Transmission</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Cost ($)</label>
                  <input type="number" className="form-input" value={form.cost}
                    onChange={(e) => setForm(f => ({ ...f, cost: e.target.value }))} />
                </div>
              </div>
              <div className="form-group" style={{ width: '100%' }}>
                <label>Description *</label>
                <textarea className="form-input" rows="3" value={form.description}
                  onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} required
                  style={{ resize: 'vertical' }} />
              </div>
              <div className="form-group" style={{ width: '100%' }}>
                <label>Notes</label>
                <textarea className="form-input" rows="2" value={form.notes}
                  onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                  style={{ resize: 'vertical' }} />
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Create</button>
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
              <th>Description</th>
              <th>Cost</th>
              <th>Status</th>
              <th>Start Date</th>
              <th>End Date</th>
              {canEdit && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr><td colSpan={canEdit ? 8 : 7} className="empty-state">No maintenance records</td></tr>
            ) : records.map((r) => (
              <tr key={r.id}>
                <td><strong>{r.vehicle_reg}</strong><br /><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.vehicle_name}</span></td>
                <td>{r.maintenance_type}</td>
                <td>{r.description}</td>
                <td>${r.cost?.toFixed(2)}</td>
                <td><span className={`status-badge status-${r.status}`}>{r.status}</span></td>
                <td>{r.start_date?.split('T')[0] || '—'}</td>
                <td>{r.end_date?.split('T')[0] || '—'}</td>
                {canEdit && (
                  <td>
                    <div className="action-btns">
                      {r.status === 'active' && (
                        <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                          onClick={() => handleClose(r.id)}>✓ Close</button>
                      )}
                      <button className="btn-icon" onClick={() => handleDelete(r.id)} title="Delete">🗑️</button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
