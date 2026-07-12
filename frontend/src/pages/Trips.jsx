import { useState, useEffect } from 'react';
import { tripService, vehicleService, driverService } from '../services';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import './TablePage.css';

export default function Trips() {
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [completeData, setCompleteData] = useState(null);

  const [form, setForm] = useState({
    source: '', destination: '', cargo_weight: '',
    planned_distance: '', vehicle_id: '', driver_id: ''
  });

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      const [tripRes, vehRes, drvRes] = await Promise.all([
        tripService.getAll(),
        vehicleService.getAvailable(),
        driverService.getAvailable()
      ]);
      setTrips(tripRes.data);
      setVehicles(vehRes.data);
      setDrivers(drvRes.data);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setForm({ source: '', destination: '', cargo_weight: '', planned_distance: '', vehicle_id: '', driver_id: '' });
    setShowForm(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await tripService.create(form);
      toast.success('Trip created as draft');
      setShowForm(false);
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create trip');
    }
  };

  const handleDispatch = async (id) => {
    try {
      await tripService.dispatch(id);
      toast.success('Trip dispatched! Vehicle and driver are now On Trip');
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Dispatch failed');
    }
  };

  const handleComplete = async (id) => {
    const finalOdometer = prompt('Enter final odometer reading (km):');
    if (!finalOdometer) return;
    const fuelConsumed = prompt('Enter fuel consumed (liters):');
    if (!fuelConsumed) return;

    try {
      await tripService.complete(id, { final_odometer: parseFloat(finalOdometer), fuel_consumed: parseFloat(fuelConsumed) });
      toast.success('Trip completed! Vehicle and driver are now Available');
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to complete trip');
    }
  };

  const handleCancel = async (id) => {
    if (!confirm('Cancel this trip?')) return;
    try {
      await tripService.cancel(id);
      toast.success('Trip cancelled');
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Cancel failed');
    }
  };

  if (loading) return <LoadingSpinner fullScreen text="Loading trips..." />;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">🗺️ Trip Management</h1>
          <p className="page-subtitle">Create, dispatch, and manage trips</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>+ Create Trip</button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Create New Trip</h2>
            <form onSubmit={handleCreate} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Source *</label>
                  <input className="form-input" value={form.source}
                    onChange={(e) => setForm(f => ({ ...f, source: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label>Destination *</label>
                  <input className="form-input" value={form.destination}
                    onChange={(e) => setForm(f => ({ ...f, destination: e.target.value }))} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Cargo Weight (kg) *</label>
                  <input type="number" className="form-input" value={form.cargo_weight}
                    onChange={(e) => setForm(f => ({ ...f, cargo_weight: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label>Planned Distance (km)</label>
                  <input type="number" className="form-input" value={form.planned_distance}
                    onChange={(e) => setForm(f => ({ ...f, planned_distance: e.target.value }))} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Available Vehicle *</label>
                  <select className="form-input" value={form.vehicle_id}
                    onChange={(e) => setForm(f => ({ ...f, vehicle_id: e.target.value }))} required>
                    <option value="">Select vehicle...</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.registration_number} - {v.name} ({v.max_load_capacity} kg cap)
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Available Driver *</label>
                  <select className="form-input" value={form.driver_id}
                    onChange={(e) => setForm(f => ({ ...f, driver_id: e.target.value }))} required>
                    <option value="">Select driver...</option>
                    {drivers.map(d => (
                      <option key={d.id} value={d.id}>{d.name} - Lic: {d.license_number}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Create Draft</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Route</th>
              <th>Cargo</th>
              <th>Vehicle</th>
              <th>Driver</th>
              <th>Status</th>
              <th>Fuel</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {trips.length === 0 ? (
              <tr><td colSpan={8} className="empty-state">No trips yet</td></tr>
            ) : trips.map((trip) => (
              <tr key={trip.id}>
                <td>#{trip.id}</td>
                <td>
                  <strong>{trip.source}</strong> → <strong>{trip.destination}</strong>
                  <div className="activity-meta">{trip.planned_distance} km planned</div>
                </td>
                <td>{trip.cargo_weight} kg</td>
                <td>{trip.vehicle_reg || 'N/A'}</td>
                <td>{trip.driver_name || 'N/A'}</td>
                <td><span className={`status-badge status-${trip.status}`}>{trip.status}</span></td>
                <td>{trip.fuel_consumed ? `${trip.fuel_consumed} L` : '—'}</td>
                <td>
                  <div className="action-btns">
                    {trip.status === 'draft' && (
                      <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                        onClick={() => handleDispatch(trip.id)}>🚀 Dispatch</button>
                    )}
                    {trip.status === 'dispatched' && (
                      <>
                        <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                          onClick={() => handleComplete(trip.id)}>✅ Complete</button>
                        <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                          onClick={() => handleCancel(trip.id)}>❌ Cancel</button>
                      </>
                    )}
                    {(trip.status === 'draft' || trip.status === 'dispatched') && (
                      <button className="btn-icon" onClick={() => handleCancel(trip.id)} title="Cancel">🗑️</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
