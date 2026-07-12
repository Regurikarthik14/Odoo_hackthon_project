import api from '../api/axios';

export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/me'),
  getUsers: () => api.get('/auth/users'),
};

export const vehicleService = {
  getAll: (params) => api.get('/vehicles', { params }),
  getAvailable: () => api.get('/vehicles/available'),
  getById: (id) => api.get(`/vehicles/${id}`),
  create: (data) => api.post('/vehicles', data),
  update: (id, data) => api.put(`/vehicles/${id}`, data),
  delete: (id) => api.delete(`/vehicles/${id}`),
};

export const driverService = {
  getAll: (params) => api.get('/drivers', { params }),
  getAvailable: () => api.get('/drivers/available'),
  getById: (id) => api.get(`/drivers/${id}`),
  create: (data) => api.post('/drivers', data),
  update: (id, data) => api.put(`/drivers/${id}`, data),
  delete: (id) => api.delete(`/drivers/${id}`),
};

export const tripService = {
  getAll: (params) => api.get('/trips', { params }),
  getActive: () => api.get('/trips/active'),
  getById: (id) => api.get(`/trips/${id}`),
  create: (data) => api.post('/trips', data),
  update: (id, data) => api.put(`/trips/${id}`, data),
  dispatch: (id) => api.put(`/trips/${id}/dispatch`),
  complete: (id, data) => api.put(`/trips/${id}/complete`, data),
  cancel: (id) => api.put(`/trips/${id}/cancel`),
};

export const maintenanceService = {
  getAll: (params) => api.get('/maintenance', { params }),
  getActive: () => api.get('/maintenance/active'),
  getById: (id) => api.get(`/maintenance/${id}`),
  create: (data) => api.post('/maintenance', data),
  update: (id, data) => api.put(`/maintenance/${id}`, data),
  close: (id) => api.put(`/maintenance/${id}/close`),
  delete: (id) => api.delete(`/maintenance/${id}`),
};

export const expenseService = {
  getFuelLogs: (params) => api.get('/expenses/fuel', { params }),
  addFuelLog: (data) => api.post('/expenses/fuel', data),
  deleteFuelLog: (id) => api.delete(`/expenses/fuel/${id}`),
  getOtherExpenses: (params) => api.get('/expenses/other', { params }),
  addExpense: (data) => api.post('/expenses/other', data),
  deleteExpense: (id) => api.delete(`/expenses/other/${id}`),
};

export const dashboardService = {
  getKPIs: (params) => api.get('/dashboard/kpis', { params }),
  getRecentActivity: () => api.get('/dashboard/recent-activity'),
};

export const reportService = {
  getSummary: (params) => api.get('/reports/summary', { params }),
  exportCSV: (type) => `/api/reports/export/csv?type=${type}`,
};
