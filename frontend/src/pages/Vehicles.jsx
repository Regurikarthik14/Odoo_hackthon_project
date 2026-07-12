import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getVehicles, createVehicle, updateVehicle, deleteVehicle } from '../services/api';

const VEHICLE_TYPES = ['All', 'Truck', 'Van', 'Trailer', 'SUV'];
const STATUSES = ['All', 'available', 'on-trip', 'in-shop', 'retired'];
const REGIONS = ['All', 'North', 'South', 'East', 'West'];

export default function Vehicles() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('manage-vehicles');

  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [regionFilter, setRegionFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({
    regNumber: '',
    name: '',
    type: 'Van',
    maxCapacity: '',
    acquisitionCost: '',
    year: new Date().getFullYear(),
    region: 'North',
  });

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const loadVehicles = useCallback(async () => {
    try {
      const filters = {};
      if (typeFilter !== 'All') filters.type = typeFilter;
      if (statusFilter !== 'All') filters.status = statusFilter;
      if (regionFilter !== 'All') filters.region = regionFilter;
      if (search) filters.search = search;
      const data = await getVehicles(filters);
      setVehicles(data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter, regionFilter, search, showToast]);

  useEffect(() => {
    setLoading(true);
    const debounce = setTimeout(loadVehicles, 300);
    return () => clearTimeout(debounce);
  }, [loadVehicles]);

  const openCreateModal = () => {
    setEditingVehicle(null);
    setForm({
      regNumber: '',
      name: '',
      type: 'Van',
      maxCapacity: '',
      acquisitionCost: '',
      year: new Date().getFullYear(),
      region: 'North',
    });
    setShowModal(true);
  };

  const openEditModal = (vehicle) => {
    setEditingVehicle(vehicle);
    setForm({
      regNumber: vehicle.regNumber,
      name: vehicle.name,
      type: vehicle.type,
      maxCapacity: vehicle.maxCapacity,
      acquisitionCost: vehicle.acquisitionCost,
      year: vehicle.year,
      region: vehicle.region,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingVehicle) {
        await updateVehicle(editingVehicle.id, form);
        showToast('Vehicle updated successfully');
      } else {
        await createVehicle(form);
        showToast('Vehicle created successfully');
      }
      setShowModal(false);
      loadVehicles();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this vehicle?')) return;
    try {
      await deleteVehicle(id);
      showToast('Vehicle deleted');
      loadVehicles();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const getStatusBadgeClass = (status) => {
    const map = {
      'available': 'available',
      'on-trip': 'on-trip',
      'in-shop': 'in-shop',
      'retired': 'retired',
    };
    return map[status] || 'available';
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
          <h1>🚛 Vehicle Registry</h1>
          <p>Manage your fleet vehicles, capacities, and statuses.</p>
        </div>
        {canManage && (
          <button className="btn btn-primary" onClick={openCreateModal}>
            + Add Vehicle
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search vehicles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="filter-select"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          {VEHICLE_TYPES.map((t) => (
            <option key={t} value={t}>{t === 'All' ? 'All Types' : t}</option>
          ))}
        </select>
        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
          ))}
        </select>
        <select
          className="filter-select"
          value={regionFilter}
          onChange={(e) => setRegionFilter(e.target.value)}
        >
          {REGIONS.map((r) => (
            <option key={r} value={r}>{r === 'All' ? 'All Regions' : r}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Reg. Number</th>
              <th>Name / Model</th>
              <th>Type</th>
              <th>Max Capacity</th>
              <th>Odometer</th>
              <th>Acq. Cost</th>
              <th>Region</th>
              <th>Status</th>
              {canManage && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={canManage ? 9 : 8} className="text-center text-muted" style={{ padding: 40 }}>
                  ⏳ Loading vehicles...
                </td>
              </tr>
            ) : vehicles.length === 0 ? (
              <tr>
                <td colSpan={canManage ? 9 : 8} className="text-center" style={{ padding: 40 }}>
                  <div className="empty-state">
                    <div className="empty-state-icon">🚛</div>
                    <h3>No vehicles found</h3>
                    <p>Try adjusting your filters or add a new vehicle.</p>
                  </div>
                </td>
              </tr>
            ) : (
              vehicles.map((vehicle) => (
                <tr key={vehicle.id}>
                  <td><strong>{vehicle.regNumber}</strong></td>
                  <td>{vehicle.name}</td>
                  <td>{vehicle.type}</td>
                  <td>{vehicle.maxCapacity?.toLocaleString()} kg</td>
                  <td>{vehicle.odometer?.toLocaleString()} km</td>
                  <td>${vehicle.acquisitionCost?.toLocaleString()}</td>
                  <td>{vehicle.region}</td>
                  <td>
                    <span className={`status-badge ${getStatusBadgeClass(vehicle.status)}`}>
                      {vehicle.status.replace('-', ' ')}
                    </span>
                  </td>
                  {canManage && (
                    <td>
                      <div className="flex gap-2">
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => openEditModal(vehicle)}
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(vehicle.id)}
                          title="Delete"
                          disabled={vehicle.status === 'on-trip'}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingVehicle ? '✏️ Edit Vehicle' : '🚛 Add New Vehicle'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Registration Number *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="regNumber"
                      value={form.regNumber}
                      onChange={handleChange}
                      placeholder="e.g., TRK-010"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Vehicle Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="e.g., Volvo FH16"
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Type *</label>
                    <select className="form-control" name="type" value={form.type} onChange={handleChange}>
                      <option value="Truck">Truck</option>
                      <option value="Van">Van</option>
                      <option value="Trailer">Trailer</option>
                      <option value="SUV">SUV</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Region *</label>
                    <select className="form-control" name="region" value={form.region} onChange={handleChange}>
                      <option value="North">North</option>
                      <option value="South">South</option>
                      <option value="East">East</option>
                      <option value="West">West</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Max Capacity (kg) *</label>
                    <input
                      type="number"
                      className="form-control"
                      name="maxCapacity"
                      value={form.maxCapacity}
                      onChange={handleChange}
                      placeholder="e.g., 25000"
                      required
                      min="1"
                    />
                  </div>
                  <div className="form-group">
                    <label>Acquisition Cost ($) *</label>
                    <input
                      type="number"
                      className="form-control"
                      name="acquisitionCost"
                      value={form.acquisitionCost}
                      onChange={handleChange}
                      placeholder="e.g., 180000"
                      required
                      min="1"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Year</label>
                  <input
                    type="number"
                    className="form-control"
                    name="year"
                    value={form.year}
                    onChange={handleChange}
                    min="2000"
                    max={new Date().getFullYear() + 1}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editingVehicle ? 'Update Vehicle' : 'Add Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
