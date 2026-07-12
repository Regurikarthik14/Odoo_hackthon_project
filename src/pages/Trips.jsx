import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTrips, createTrip, updateTripStatus, getVehicles, getDrivers } from '../services/api';

const STATUSES = ['All', 'draft', 'dispatched', 'completed', 'cancelled'];

export default function Trips() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('manage-trips');

  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({
    source: '',
    destination: '',
    vehicleId: '',
    driverId: '',
    cargoWeight: '',
    plannedDistance: '',
  });

  const [completeForm, setCompleteForm] = useState({
    odometerEnd: '',
    fuelConsumed: '',
  });

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const loadData = useCallback(async () => {
    try {
      const filters = {};
      if (statusFilter !== 'All') filters.status = statusFilter;
      const [tripsData, vehiclesData, driversData] = await Promise.all([
        getTrips(filters),
        getVehicles(),
        getDrivers(),
      ]);
      setTrips(tripsData);
      setVehicles(vehiclesData);
      setDrivers(driversData);
      setAvailableVehicles(vehiclesData.filter(v => v.status === 'available'));
      setAvailableDrivers(driversData.filter(d => d.status === 'available'));
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, showToast]);

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [loadData]);

  const openCreateModal = async () => {
    // Refresh available vehicles and drivers
    try {
      const [v, d] = await Promise.all([
        getVehicles({ status: 'available' }),
        getDrivers({ status: 'available' }),
      ]);
      setAvailableVehicles(v);
      setAvailableDrivers(d);
    } catch {}
    setForm({ source: '', destination: '', vehicleId: '', driverId: '', cargoWeight: '', plannedDistance: '' });
    setShowModal(true);
  };

  const handleCreateTrip = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createTrip({
        ...form,
        cargoWeight: Number(form.cargoWeight),
        plannedDistance: Number(form.plannedDistance),
        vehicleId: Number(form.vehicleId),
        driverId: Number(form.driverId),
      });
      showToast('Trip dispatched successfully! 🚀');
      setShowModal(false);
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteTrip = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateTripStatus(showCompleteModal, 'completed', {
        odometerEnd: Number(completeForm.odometerEnd),
        fuelConsumed: Number(completeForm.fuelConsumed),
      });
      showToast('Trip completed successfully! ✅');
      setShowCompleteModal(null);
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelTrip = async (tripId) => {
    if (!window.confirm('Are you sure you want to cancel this trip?')) return;
    try {
      await updateTripStatus(tripId, 'cancelled');
      showToast('Trip cancelled');
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Calculate if cargo exceeds capacity
  const selectedVehicle = availableVehicles.find(v => v.id === Number(form.vehicleId));
  const cargoExceedsCapacity = selectedVehicle && Number(form.cargoWeight) > selectedVehicle.maxCapacity;

  const getStatusBadgeClass = (status) => {
    const map = { 'draft': 'draft', 'dispatched': 'dispatched', 'completed': 'completed', 'cancelled': 'cancelled' };
    return map[status] || 'draft';
  };

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
          <h1>🗺️ Trip Management</h1>
          <p>Create, dispatch, and monitor fleet trips.</p>
        </div>
        {canManage && (
          <button className="btn btn-primary" onClick={openCreateModal}>
            + New Trip
          </button>
        )}
      </div>

      <div className="filters-bar">
        <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s.replace(/\b\w/g, l => l.toUpperCase())}</option>
          ))}
        </select>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Route</th>
              <th>Vehicle</th>
              <th>Driver</th>
              <th>Cargo (kg)</th>
              <th>Distance</th>
              <th>Status</th>
              <th>Date</th>
              {canManage && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={canManage ? 8 : 7} className="text-center text-muted" style={{ padding: 40 }}>⏳ Loading trips...</td>
              </tr>
            ) : trips.length === 0 ? (
              <tr>
                <td colSpan={canManage ? 8 : 7} className="text-center" style={{ padding: 40 }}>
                  <div className="empty-state">
                    <div className="empty-state-icon">🗺️</div>
                    <h3>No trips found</h3>
                    <p>Create a new trip to get started.</p>
                  </div>
                </td>
              </tr>
            ) : (
              trips.map((trip) => (
                <tr key={trip.id}>
                  <td><strong>{trip.source}</strong> → {trip.destination}</td>
                  <td>{trip.vehicleReg}</td>
                  <td>{trip.driverName}</td>
                  <td>{trip.cargoWeight?.toLocaleString()}</td>
                  <td>{trip.plannedDistance} km</td>
                  <td>
                    <span className={`status-badge ${getStatusBadgeClass(trip.status)}`}>
                      {trip.status}
                    </span>
                  </td>
                  <td className="text-muted">{trip.startDate || '-'}</td>
                  {canManage && (
                    <td>
                      <div className="flex gap-2">
                        {trip.status === 'dispatched' && (
                          <>
                            <button className="btn btn-success btn-sm" onClick={() => { setShowCompleteModal(trip.id); setCompleteForm({ odometerEnd: '', fuelConsumed: '' }); }} title="Complete">✅</button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleCancelTrip(trip.id)} title="Cancel">❌</button>
                          </>
                        )}
                        {trip.status === 'draft' && (
                          <button className="btn btn-danger btn-sm" onClick={() => handleCancelTrip(trip.id)} title="Cancel">🗑️</button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Trip Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <h2>🚀 Dispatch New Trip</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateTrip}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Source *</label>
                    <input type="text" className="form-control" name="source" value={form.source} onChange={handleChange} placeholder="e.g., New York, NY" required />
                  </div>
                  <div className="form-group">
                    <label>Destination *</label>
                    <input type="text" className="form-control" name="destination" value={form.destination} onChange={handleChange} placeholder="e.g., Boston, MA" required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Available Vehicle *</label>
                    <select className="form-control" name="vehicleId" value={form.vehicleId} onChange={handleChange} required>
                      <option value="">Select vehicle...</option>
                      {availableVehicles.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.regNumber} - {v.name} (Capacity: {v.maxCapacity} kg)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Available Driver *</label>
                    <select className="form-control" name="driverId" value={form.driverId} onChange={handleChange} required>
                      <option value="">Select driver...</option>
                      {availableDrivers.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} (License: {d.licenseCategory})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Cargo Weight (kg) *</label>
                    <input type="number" className="form-control" name="cargoWeight" value={form.cargoWeight} onChange={handleChange} placeholder="e.g., 450" required min="1" />
                    {cargoExceedsCapacity && (
                      <small style={{ color: '#ef4444', marginTop: 4, display: 'block' }}>
                        ⚠️ Cargo exceeds vehicle capacity ({selectedVehicle.maxCapacity} kg)!
                      </small>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Planned Distance (km) *</label>
                    <input type="number" className="form-control" name="plannedDistance" value={form.plannedDistance} onChange={handleChange} placeholder="e.g., 215" required min="1" />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving || cargoExceedsCapacity}>
                  {saving ? 'Dispatching...' : '🚀 Dispatch Trip'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Trip Modal */}
      {showCompleteModal && (
        <div className="modal-overlay" onClick={() => setShowCompleteModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>✅ Complete Trip</h2>
              <button className="modal-close" onClick={() => setShowCompleteModal(null)}>✕</button>
            </div>
            <form onSubmit={handleCompleteTrip}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Final Odometer Reading (km) *</label>
                    <input
                      type="number"
                      className="form-control"
                      value={completeForm.odometerEnd}
                      onChange={(e) => setCompleteForm({ ...completeForm, odometerEnd: e.target.value })}
                      placeholder="e.g., 89500"
                      required
                      min="1"
                    />
                  </div>
                  <div className="form-group">
                    <label>Fuel Consumed (liters) *</label>
                    <input
                      type="number"
                      className="form-control"
                      value={completeForm.fuelConsumed}
                      onChange={(e) => setCompleteForm({ ...completeForm, fuelConsumed: e.target.value })}
                      placeholder="e.g., 65"
                      required
                      min="1"
                      step="0.1"
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCompleteModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-success" disabled={saving}>
                  {saving ? 'Saving...' : '✅ Complete Trip'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
