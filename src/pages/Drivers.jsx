import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDrivers, createDriver, updateDriver, deleteDriver } from '../services/api';

const STATUSES = ['All', 'available', 'on-trip', 'off-duty', 'suspended'];

export default function Drivers() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('manage-drivers');

  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({
    name: '',
    licenseNumber: '',
    licenseCategory: 'Class B',
    licenseExpiry: '',
    contact: '',
  });

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const loadDrivers = useCallback(async () => {
    try {
      const filters = {};
      if (statusFilter !== 'All') filters.status = statusFilter;
      if (search) filters.search = search;
      const data = await getDrivers(filters);
      setDrivers(data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, showToast]);

  useEffect(() => {
    setLoading(true);
    const debounce = setTimeout(loadDrivers, 300);
    return () => clearTimeout(debounce);
  }, [loadDrivers]);

  const openCreateModal = () => {
    setEditingDriver(null);
    setForm({ name: '', licenseNumber: '', licenseCategory: 'Class B', licenseExpiry: '', contact: '' });
    setShowModal(true);
  };

  const openEditModal = (driver) => {
    setEditingDriver(driver);
    setForm({
      name: driver.name,
      licenseNumber: driver.licenseNumber,
      licenseCategory: driver.licenseCategory,
      licenseExpiry: driver.licenseExpiry,
      contact: driver.contact,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingDriver) {
        await updateDriver(editingDriver.id, form);
        showToast('Driver updated successfully');
      } else {
        await createDriver(form);
        showToast('Driver created successfully');
      }
      setShowModal(false);
      loadDrivers();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this driver?')) return;
    try {
      await deleteDriver(id);
      showToast('Driver deleted');
      loadDrivers();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const isLicenseExpired = (expiry) => new Date(expiry) < new Date();
  const getSafetyScoreColor = (score) => {
    if (score >= 90) return { color: '#10b981', bg: '#d1fae5' };
    if (score >= 75) return { color: '#f59e0b', bg: '#fef3c7' };
    return { color: '#ef4444', bg: '#fee2e2' };
  };

  const getStatusBadgeClass = (status) => {
    const map = {
      'available': 'available',
      'on-trip': 'on-trip',
      'off-duty': 'off-duty',
      'suspended': 'suspended',
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
          <h1>👤 Driver Management</h1>
          <p>Manage driver profiles, licenses, and compliance.</p>
        </div>
        {canManage && (
          <button className="btn btn-primary" onClick={openCreateModal}>
            + Add Driver
          </button>
        )}
      </div>

      <div className="filters-bar">
        <div className="search-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search drivers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
          ))}
        </select>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>License #</th>
              <th>Category</th>
              <th>License Expiry</th>
              <th>Contact</th>
              <th>Safety Score</th>
              <th>Status</th>
              {canManage && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={canManage ? 8 : 7} className="text-center text-muted" style={{ padding: 40 }}>
                  ⏳ Loading drivers...
                </td>
              </tr>
            ) : drivers.length === 0 ? (
              <tr>
                <td colSpan={canManage ? 8 : 7} className="text-center" style={{ padding: 40 }}>
                  <div className="empty-state">
                    <div className="empty-state-icon">👤</div>
                    <h3>No drivers found</h3>
                    <p>Try adjusting your filters or add a new driver.</p>
                  </div>
                </td>
              </tr>
            ) : (
              drivers.map((driver) => {
                const expired = isLicenseExpired(driver.licenseExpiry);
                const scoreStyle = getSafetyScoreColor(driver.safetyScore);
                return (
                  <tr key={driver.id}>
                    <td><strong>{driver.name}</strong></td>
                    <td>{driver.licenseNumber}</td>
                    <td>{driver.licenseCategory}</td>
                    <td>
                      <span style={{ color: expired ? '#ef4444' : '#10b981', fontWeight: 600 }}>
                        {driver.licenseExpiry}
                        {expired && ' ⚠️'}
                      </span>
                    </td>
                    <td>{driver.contact}</td>
                    <td>
                      <span style={{
                        background: scoreStyle.bg,
                        color: scoreStyle.color,
                        padding: '2px 10px',
                        borderRadius: 12,
                        fontWeight: 600,
                        fontSize: 13,
                      }}>
                        {driver.safetyScore}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusBadgeClass(driver.status)}`}>
                        {driver.status.replace('-', ' ')}
                      </span>
                    </td>
                    {canManage && (
                      <td>
                        <div className="flex gap-2">
                          <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(driver)} title="Edit">✏️</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(driver.id)} title="Delete" disabled={driver.status === 'on-trip'}>🗑️</button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingDriver ? '✏️ Edit Driver' : '👤 Add New Driver'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input type="text" className="form-control" name="name" value={form.name} onChange={handleChange} placeholder="e.g., John Doe" required />
                  </div>
                  <div className="form-group">
                    <label>Contact Number *</label>
                    <input type="text" className="form-control" name="contact" value={form.contact} onChange={handleChange} placeholder="e.g., +1-555-0100" required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>License Number *</label>
                    <input type="text" className="form-control" name="licenseNumber" value={form.licenseNumber} onChange={handleChange} placeholder="e.g., DL-48291" required />
                  </div>
                  <div className="form-group">
                    <label>License Category</label>
                    <select className="form-control" name="licenseCategory" value={form.licenseCategory} onChange={handleChange}>
                      <option value="Class A">Class A</option>
                      <option value="Class B">Class B</option>
                      <option value="Class C">Class C</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>License Expiry Date *</label>
                  <input type="date" className="form-control" name="licenseExpiry" value={form.licenseExpiry} onChange={handleChange} required />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editingDriver ? 'Update Driver' : 'Add Driver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
