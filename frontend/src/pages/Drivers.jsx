import { useState, useEffect } from 'react';
import { driverService } from '../services';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './TablePage.css';

export default function Drivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editDriver, setEditDriver] = useState(null);
  const { hasRole } = useAuth();
  const canEdit = hasRole('fleet_manager', 'safety_officer');

  const [form, setForm] = useState({
    name: '', license_number: '', license_category: 'B',
    license_expiry_date: '', contact_number: '', safety_score: 100, status: 'available'
  });

  useEffect(() => { loadDrivers(); }, []);

  const loadDrivers = async () => {
    try {
      const res = await driverService.getAll();
      setDrivers(res.data);
    } catch (err) {
      toast.error('Failed to load drivers');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setForm({ name: '', license_number: '', license_category: 'B',
      license_expiry_date: '', contact_number: '', safety_score: 100, status: 'available' });
    setEditDriver(null);
    setShowForm(true);
  };

  const openEdit = (d) => {
    setForm({
      name: d.name, license_number: d.license_number, license_category: d.license_category,
      license_expiry_date: d.license_expiry_date?.split('T')[0] || '', contact_number: d.contact_number || '',
      safety_score: d.safety_score, status: d.status
    });
    setEditDriver(d);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editDriver) {
        await driverService.update(editDriver.id, form);
        toast.success('Driver updated');
      } else {
        await driverService.create(form);
        toast.success('Driver created');
      }
      setShowForm(false);
      loadDrivers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this driver?')) return;
    try {
      await driverService.delete(id);
      toast.success('Driver deleted');
      loadDrivers();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  if (loading) return <LoadingSpinner fullScreen text="Loading drivers..." />;

  const isExpired = (dateStr) => {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">👤 Driver Management</h1>
          <p className="page-subtitle">Manage drivers, licenses, and safety scores</p>
        </div>
        {canEdit && <button className="btn-primary" onClick={openCreate}>+ Add Driver</button>}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">{editDriver ? 'Edit Driver' : 'Add Driver'}</h2>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Name *</label>
                  <input className="form-input" value={form.name}
                    onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label>License Number *</label>
                  <input className="form-input" value={form.license_number}
                    onChange={(e) => setForm(f => ({ ...f, license_number: e.target.value }))} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>License Category</label>
                  <select className="form-input" value={form.license_category}
                    onChange={(e) => setForm(f => ({ ...f, license_category: e.target.value }))}>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>License Expiry *</label>
                  <input type="date" className="form-input" value={form.license_expiry_date}
                    onChange={(e) => setForm(f => ({ ...f, license_expiry_date: e.target.value }))} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Contact</label>
                  <input className="form-input" value={form.contact_number}
                    onChange={(e) => setForm(f => ({ ...f, contact_number: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Safety Score</label>
                  <input type="number" className="form-input" value={form.safety_score}
                    onChange={(e) => setForm(f => ({ ...f, safety_score: e.target.value }))} min="0" max="100" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Status</label>
                  <select className="form-input" value={form.status}
                    onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))}>
                    <option value="available">Available</option>
                    <option value="off_duty">Off Duty</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn-primary">{editDriver ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>License #</th>
              <th>Category</th>
              <th>Expiry</th>
              <th>Contact</th>
              <th>Safety Score</th>
              <th>Status</th>
              {canEdit && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {drivers.length === 0 ? (
              <tr><td colSpan={canEdit ? 8 : 7} className="empty-state">No drivers registered yet</td></tr>
            ) : drivers.map((d) => (
              <tr key={d.id} className={isExpired(d.license_expiry_date) ? 'row-warning' : ''}>
                <td><strong>{d.name}</strong></td>
                <td>{d.license_number}</td>
                <td>{d.license_category}</td>
                <td>
                  {d.license_expiry_date?.split('T')[0] || 'N/A'}
                  {isExpired(d.license_expiry_date) && <span className="expired-badge">Expired</span>}
                </td>
                <td>{d.contact_number || '—'}</td>
                <td>
                  <span className={`safety-score ${d.safety_score >= 90 ? 'high' : d.safety_score >= 70 ? 'mid' : 'low'}`}>
                    {d.safety_score}
                  </span>
                </td>
                <td><span className={`status-badge status-${d.status}`}>{d.status.replace('_', ' ')}</span></td>
                {canEdit && (
                  <td>
                    <div className="action-btns">
                      <button className="btn-icon" onClick={() => openEdit(d)} title="Edit">✏️</button>
                      <button className="btn-icon" onClick={() => handleDelete(d.id)} title="Delete">🗑️</button>
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
