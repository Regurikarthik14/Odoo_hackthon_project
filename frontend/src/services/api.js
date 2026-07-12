const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('fleetmaster_token');
  }

  setToken(token) {
    this.token = token;
    if (token) localStorage.setItem('fleetmaster_token', token);
    else localStorage.removeItem('fleetmaster_token');
  }

  isAuthenticated() {
    return !!this.token;
  }

  async request(endpoint, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (this.token) headers['Authorization'] = 'Bearer ' + this.token;
    try {
      const res = await fetch(API_URL + endpoint, { ...options, headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      return data;
    } catch (err) {
      if (err.message.includes('Failed to fetch'))
        throw new Error('Cannot connect to server. Is the backend running?');
      throw err;
    }
  }

  async login(email, password) {
    const data = await this.request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    this.setToken(data.access_token);
    return data;
  }

  async register(data) {
    const res = await this.request('/auth/register', { method: 'POST', body: JSON.stringify(data) });
    this.setToken(res.access_token);
    return res;
  }

  logout() { this.setToken(null); }

  async getVehicles(status) {
    return this.request('/vehicles' + (status ? '?status=' + status : ''));
  }
  async createVehicle(data) { return this.request('/vehicles', { method: 'POST', body: JSON.stringify(data) }); }
  async getDrivers(status) {
    return this.request('/drivers' + (status ? '?status=' + status : ''));
  }
  async createDriver(data) { return this.request('/drivers', { method: 'POST', body: JSON.stringify(data) }); }
  async getTrips(filters = {}) {
    const p = new URLSearchParams();
    if (filters.status) p.set('status', filters.status);
    if (filters.vehicle_id) p.set('vehicle_id', filters.vehicle_id);
    if (filters.driver_id) p.set('driver_id', filters.driver_id);
    const qs = p.toString();
    return this.request('/trips' + (qs ? '?' + qs : ''));
  }
  async createTrip(data) { return this.request('/trips', { method: 'POST', body: JSON.stringify(data) }); }
  async updateTrip(id, data) { return this.request('/trips/' + id, { method: 'PUT', body: JSON.stringify(data) }); }
  async getKPI() { return this.request('/reports/kpi'); }
  async getAnalytics() { return this.request('/reports/analytics'); }
  async getMe() { return this.request('/auth/me'); }
}

export default new ApiService();
