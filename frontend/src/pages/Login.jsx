import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import './Login.css';

const DEMO_ACCOUNTS = [
  { email: 'admin@oddo.com', password: 'Admin123!', label: 'Fleet Manager', role: 'fleet_manager' },
  { email: 'driver@oddo.com', password: 'Driver123!', label: 'Driver', role: 'driver' },
  { email: 'safety@oddo.com', password: 'Safety123!', label: 'Safety Officer', role: 'safety_officer' },
  { email: 'finance@oddo.com', password: 'Finance123!', label: 'Financial Analyst', role: 'financial_analyst' },
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail, demoPassword) => {
    setError('');
    setLoading(true);
    setEmail(demoEmail);
    setPassword(demoPassword);
    try {
      await login(demoEmail, demoPassword);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg"></div>
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo">🚛</div>
            <h1 className="login-title">ODDO Fleet</h1>
            <p className="login-subtitle">Enterprise Fleet Management System</p>
          </div>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                className="form-input"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? <LoadingSpinner /> : 'Sign In'}
            </button>
          </form>

          <div className="demo-accounts">
            <h4>Demo Accounts</h4>
            <div className="demo-grid">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.email}
                  className="demo-btn"
                  onClick={() => handleDemoLogin(account.email, account.password)}
                  disabled={loading}
                >
                  {account.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
