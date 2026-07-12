import { useState, useEffect } from 'react';
import { vehicleService } from '../services';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './TablePage.css';

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editVehicle, setEditVehicle] = useState(null);
  const { hasRole } = useAuth();
  const isManager = hasRole('fleet_manager');
  const canEdit = isManager;

  const [form, setForm] = useState({
    registration_number: '', name: '', model: '', vehicle_type: 'truck',
    max_load_capacity: '', odometer: '', acquisition_cost: '', status: 'available', region: 'unknown'
  });

  useEffect(() => { loadVehicles(); }, []);

  const loadVehicles = async () => {
    try {
      const res = await vehicleService.getAll();
      setVehicles(res.data);
    } catch (err) {
      toast.error('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setForm({ registration_number: '', name: '', model: '', vehicle_type: 'truck',
      max_load_capacity: '', odometer: '', acquisition_cost: '', status: 'available', region: 'unknown' });
    setEditVehicle(null);
    setShowForm(true);
  };

  const openEdit = (v) => {
    setForm({ registration_number: v.registration_number, name: v.name, model: v.model || '',
      vehicle_type: v.vehicle_type, max_load_capacity: v.max_load_capacity,
      odometer: v.odometer, acquisition_cost: v.acquisition_cost, status: v.status, region: v.region });
    setEditVehicle(v);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editVehicle) {
        await vehicleService.update(editVehicle.id, form);
        toast.success('Vehicle updated');
      } else {
        await vehicleService.create(form);
        toast.success('Vehicle created');
      }
      setShowForm(false);
      loadVehicles();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this vehicle?')) return;
    try {
      await vehicleService.delete(id);
      toast.success('Vehicle deleted');
      loadVehicles();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  if (loading) return <LoadingSpinner fullScreen text="Loading vehicles..." />;

  const getStatusClass = (status) => {
    const map = { available: 'available', on_trip: 'on_trip', in_shop: 'in_shop', retired: 'suspended' };
    return `status-badge status-${map[status] || 'draft'}`;
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">🚛 Vehicle Registry</h1>
          <p className="page-subtitle">Manage your fleet vehicles</p>
        </div>
        {canEdit && <button className="btn-primary" onClick={openCreate}>+ Add Vehicle</button>}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">{editVehicle ? 'Edit Vehicle' : 'Add Vehicle'}</h2>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Registration Number *</label>
                  <input className="form-input" value={form.registration_number}
                    onChange={(e) => setForm(f => ({ ...f, registration_number: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label>Vehicle Name *</label>
                  <input className="form-input" value={form.name}
                    onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Model</label>
                  <input className="form-input" value={form.model}
                    onChange={(e) => setForm(f => ({ ...f, model: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Type</label>
                  <select className="form-input" value={form.vehicle_type}
                    onChange={(e) => setForm(f => ({ ...f, vehicle_type: e.target.value }))}>
                    <option value="truck">Truck</option>
                    <option value="van">Van</option>
                    <option value="bus">Bus</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Max Load (kg) *</label>
                  <input type="number" className="form-input" value={form.max_load_capacity}
                    onChange={(e) => setForm(f => ({ ...f, max_load_capacity: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label>Odometer (km)</label>
                  <input type="number" className="form-input" value={form.odometer}
                    onChange={(e) => setForm(f => ({ ...f, odometer: e.target.value }))} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Acquisition Cost ($)</label>
                  <input type="number" className="form-input" value={form.acquisition_cost}
                    onChange={(e) => setForm(f => ({ ...f, acquisition_cost: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Region</label>
                  <input className="form-input" value={form.region}
                    onChange={(e) => setForm(f => ({ ...f, region: e.target.value }))} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Status</label>
                  <select className="form-input" value={form.status}
                    onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))}>
                    <option value="available">Available</option>
                    <option value="on_trip">On Trip</option>
                    <option value="in_shop">In Shop</option>
                    <option value="retired">Retired</option>
                  </select>
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn-primary">{editVehicle ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Registration</th>
              <th>Name</th>
              <th>Type</th>
              <th>Max Load</th>
              <th>Odometer</th>
              <th>Cost</th>
              <th>Status</th>
              <th>Region</th>
              {canEdit && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {vehicles.length === 0 ? (
              <tr><td colSpan={canEdit ? 9 : 8} className="empty-state">No vehicles registered yet</td></tr>
            ) : vehicles.map((v) => (
              <tr key={v.id}>
                <td><strong>{v.registration_number}</strong></td>
                <td>{v.name}</td>
                <td>{v.vehicle_type}</td>
                <td>{v.max_load_capacity} kg</td>
                <td>{v.odometer?.toLocaleString()} km</td>
                <td>${v.acquisition_cost?.toLocaleString()}</td>
                <td><span className={getStatusClass(v.status)}>{v.status.replace('_', ' ')}</span></td>
                <td>{v.region}</td>
                {canEdit && (
                  <td>
                    <div className="action-btns">
                      <button className="btn-icon" onClick={() => openEdit(v)} title="Edit">✏️</button>
                      <button className="btn-icon" onClick={() => handleDelete(v.id)} title="Delete">🗑️</button>
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
