import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMaintenanceRecords, createMaintenanceRecord, closeMaintenanceRecord, deleteMaintenanceRecord, getVehicles } from '../services/api';

const STATUSES = ['All', 'active', 'closed'];
const MAINTENANCE_TYPES = ['Oil Change', 'Tire Replacement', 'Brake Service', 'Engine Repair', 'Transmission Service', 'AC Service', 'Electrical Repair', 'Body Work', 'Other'];

export default function Maintenance() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('manage-maintenance');

  const [records, setRecords] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({
    vehicleId: '',
    type: 'Oil Change',
    description: '',
    cost: '',
    mechanic: '',
  });

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const loadData = useCallback(async () => {
    try {
      const filters = {};
      if (statusFilter !== 'All') filters.status = statusFilter;
      const [recordsData, vehiclesData] = await Promise.all([
        getMaintenanceRecords(filters),
        getVehicles(),
      ]);
      setRecords(recordsData);
      setVehicles(vehiclesData.filter(v => v.status !== 'retired'));
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

  const openCreateModal = () => {
    setForm({ vehicleId: '', type: 'Oil Change', description: '', cost: '', mechanic: '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createMaintenanceRecord({
        ...form,
        cost: Number(form.cost),
        vehicleId: Number(form.vehicleId),
      });
      showToast('Maintenance record created. Vehicle set to In Shop.');
      setShowModal(false);
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = async (id) => {
    try {
      await closeMaintenanceRecord(id);
      showToast('Maintenance closed. Vehicle restored to Available.');
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this maintenance record?')) return;
    try {
      await deleteMaintenanceRecord(id);
      showToast('Record deleted');
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const getStatusBadgeClass = (status) => {
    return status === 'active' ? 'maintenance' : 'available';
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
          <h1>🔧 Maintenance</h1>
          <p>Track vehicle maintenance and service records.</p>
        </div>
        {canManage && (
          <button className="btn btn-primary" onClick={openCreateModal}>
            + Add Record
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
              <th>Vehicle</th>
              <th>Type</th>
              <th>Description</th>
              <th>Cost</th>
              <th>Date</th>
              <th>Mechanic</th>
              <th>Status</th>
              {canManage && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={canManage ? 8 : 7} className="text-center text-muted" style={{ padding: 40 }}>⏳ Loading maintenance records...</td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={canManage ? 8 : 7} className="text-center" style={{ padding: 40 }}>
                  <div className="empty-state">
                    <div className="empty-state-icon">🔧</div>
                    <h3>No maintenance records</h3>
                    <p>Create a maintenance record to track vehicle servicing.</p>
                  </div>
                </td>
              </tr>
            ) : (
              records.map((record) => (
                <tr key={record.id}>
                  <td><strong>{record.vehicleReg}</strong> - {record.vehicleName}</td>
                  <td>{record.type}</td>
                  <td style={{ maxWidth: 200 }} className="truncate">{record.description}</td>
                  <td>${record.cost?.toLocaleString()}</td>
                  <td className="text-muted">{record.date}</td>
                  <td>{record.mechanic}</td>
                  <td>
                    <span className={`status-badge ${getStatusBadgeClass(record.status)}`}>
                      {record.status}
                    </span>
                  </td>
                  {canManage && (
                    <td>
                      <div className="flex gap-2">
                        {record.status === 'active' && (
                          <button className="btn btn-success btn-sm" onClick={() => handleClose(record.id)} title="Close Maintenance">
                            ✅ Close
                          </button>
                        )}
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(record.id)} title="Delete">
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

      {/* Create Maintenance Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🔧 Add Maintenance Record</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Vehicle *</label>
                  <select className="form-control" name="vehicleId" value={form.vehicleId} onChange={handleChange} required>
                    <option value="">Select vehicle...</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.regNumber} - {v.name} (Status: {v.status})
                      </option>
                    ))}
                  </select>
                  <small className="text-muted" style={{ marginTop: 4, display: 'block' }}>
                    Vehicle will be set to "In Shop" automatically.
                  </small>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Maintenance Type *</label>
                    <select className="form-control" name="type" value={form.type} onChange={handleChange}>
                      {MAINTENANCE_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Cost ($) *</label>
                    <input type="number" className="form-control" name="cost" value={form.cost} onChange={handleChange} placeholder="e.g., 450" required min="1" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea className="form-control" name="description" value={form.description} onChange={handleChange} placeholder="Describe the maintenance work..." />
                </div>
                <div className="form-group">
                  <label>Mechanic / Shop</label>
                  <input type="text" className="form-control" name="mechanic" value={form.mechanic} onChange={handleChange} placeholder="e.g., AutoCare Center" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Create Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
