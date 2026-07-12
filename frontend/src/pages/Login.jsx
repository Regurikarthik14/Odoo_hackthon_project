import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import './Login.css';

const ROLES = [
  { value: 'fleet_manager', label: 'Fleet Manager', icon: '👔', desc: 'Full fleet management access' },
  { value: 'driver', label: 'Driver', icon: '🚛', desc: 'Manage trips and deliveries' },
  { value: 'safety_officer', label: 'Safety Officer', icon: '🛡️', desc: 'Driver & compliance oversight' },
  { value: 'financial_analyst', label: 'Financial Analyst', icon: '📊', desc: 'Reports & expense tracking' },
];

export default function Login() {
  const [activeTab, setActiveTab] = useState('login');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Login state
  const [loginMethod, setLoginMethod] = useState('email');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginMobile, setLoginMobile] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register state
  const [regName, setRegName] = useState('');
  const [regRole, setRegRole] = useState('driver');
  const [regEmail, setRegEmail] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regMethod, setRegMethod] = useState('email');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);

  // Availability checks
  const [emailAvailable, setEmailAvailable] = useState(true);
  const [mobileAvailable, setMobileAvailable] = useState(true);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [checkingMobile, setCheckingMobile] = useState(false);

  const otpRefs = useRef([]);
  const timerRef = useRef(null);

  const { login, loginWithMobile, register, checkAvailability, sendOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();

  // OTP Timer
  useEffect(() => {
    if (otpTimer > 0) {
      timerRef.current = setInterval(() => {
        setOtpTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [otpTimer]);

  // Real-time email availability check
  useEffect(() => {
    if (!regEmail || regMethod !== 'email') {
      setEmailAvailable(true);
      return;
    }
    const timer = setTimeout(async () => {
      setCheckingEmail(true);
      try {
        const available = await checkAvailability('email', regEmail);
        setEmailAvailable(available);
      } catch {
        setEmailAvailable(true);
      } finally {
        setCheckingEmail(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [regEmail, regMethod]);

  // Real-time mobile availability check
  useEffect(() => {
    if (!regMobile || regMethod !== 'mobile' || regMobile.length < 10) {
      setMobileAvailable(true);
      return;
    }
    const timer = setTimeout(async () => {
      setCheckingMobile(true);
      try {
        const available = await checkAvailability('mobile', regMobile);
        setMobileAvailable(available);
      } catch {
        setMobileAvailable(true);
      } finally {
        setCheckingMobile(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [regMobile, regMethod]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      if (loginMethod === 'email') {
        await login(loginEmail.trim(), loginPassword);
      } else {
        // Use loginWithMobile which sends mobile + password
        await loginWithMobile(loginMobile.trim(), loginPassword);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    setError('');
    setSuccess('');
    if (regMobile.length < 10) {
      setError('Please enter a valid mobile number');
      return;
    }
    if (!mobileAvailable) {
      setError('This mobile number is already registered');
      return;
    }
    setLoading(true);
    try {
      await sendOtp(regMobile);
      setOtpSent(true);
      setOtpTimer(300);
      setSuccess(`OTP sent to ${regMobile}`);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-advance to next field
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all 6 digits entered
    if (value && index === 5 && newOtp.every((d) => d)) {
      handleVerifyOtp(newOtp.join(''));
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (otpCode) => {
    setError('');
    const code = otpCode || otp.join('');
    if (code.length !== 6) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      const verified = await verifyOtp(regMobile, code);
      if (verified) {
        setOtpVerified(true);
        setSuccess('OTP verified successfully!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!regName.trim()) {
      setError('Full name is required');
      return;
    }

    if (regMethod === 'email' && !regEmail.trim()) {
      setError('Email address is required');
      return;
    }

    if (regMethod === 'mobile' && regMobile.length < 10) {
      setError('Valid mobile number is required');
      return;
    }

    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (regMethod === 'mobile' && !otpVerified) {
      setError('Please verify your mobile number with OTP');
      return;
    }

    setLoading(true);
    try {
      const userData = {
        name: regName.trim(),
        role: regRole,
        password: regPassword,
      };

      if (regMethod === 'email') {
        userData.email = regEmail.trim().toLowerCase();
      } else {
        userData.mobile = regMobile;
        userData.otp = otp.join('');
      }

      await register(userData);
      setSuccess('Registration successful! Redirecting...');
      setTimeout(() => navigate('/dashboard'), 1000);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const switchToLogin = () => {
    setActiveTab('login');
    setError('');
    setSuccess('');
    resetRegistration();
  };

  const switchToRegister = () => {
    setActiveTab('register');
    setError('');
    setSuccess('');
  };

  const resetRegistration = () => {
    setRegName('');
    setRegRole('driver');
    setRegEmail('');
    setRegMobile('');
    setRegPassword('');
    setRegConfirmPassword('');
    setRegMethod('email');
    setOtp(['', '', '', '', '', '']);
    setOtpSent(false);
    setOtpVerified(false);
    setOtpTimer(0);
    setEmailAvailable(true);
    setMobileAvailable(true);
  };

  const switchRegMethod = (method) => {
    setRegMethod(method);
    setOtp(['', '', '', '', '', '']);
    setOtpSent(false);
    setOtpVerified(false);
    setOtpTimer(0);
    setError('');
    setSuccess('');
  };

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="login-page">
      <div className="login-bg"></div>
      <div className="login-particles">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${10 + Math.random() * 20}s`,
              width: `${2 + Math.random() * 4}px`,
              height: `${2 + Math.random() * 4}px`,
            }}
          />
        ))}
      </div>
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo-wrapper">
              <div className="login-logo-icon">🚛</div>
            </div>
            <h1 className="login-title">ODDO Fleet</h1>
            <p className="login-subtitle">Enterprise Fleet Management System</p>
          </div>

          {/* Tab Switcher */}
          <div className="auth-tabs">
            <button
              className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`}
              onClick={switchToLogin}
            >
              <span className="tab-icon">🔑</span>
              <span>Sign In</span>
            </button>
            <button
              className={`auth-tab ${activeTab === 'register' ? 'active' : ''}`}
              onClick={switchToRegister}
            >
              <span className="tab-icon">📝</span>
              <span>Register</span>
            </button>
          </div>

          {/* Messages */}
          {error && (
            <div className="login-message error">
              <span className="message-icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="login-message success">
              <span className="message-icon">✅</span>
              <span>{success}</span>
            </div>
          )}

          {/* Login Form */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="auth-form">
              {/* Login Method Tabs */}
              <div className="reg-method-tabs">
                <button
                  type="button"
                  className={`reg-method-tab ${loginMethod === 'email' ? 'active' : ''}`}
                  onClick={() => setLoginMethod('email')}
                >
                  📧 Email
                </button>
                <button
                  type="button"
                  className={`reg-method-tab ${loginMethod === 'mobile' ? 'active' : ''}`}
                  onClick={() => setLoginMethod('mobile')}
                >
                  📱 Mobile
                </button>
              </div>

              {loginMethod === 'email' ? (
                <div className="form-group">
                  <label>
                    <span className="label-icon">📧</span> Email
                  </label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="Enter your email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              ) : (
                <div className="form-group">
                  <label>
                    <span className="label-icon">📱</span> Mobile Number
                  </label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="Enter your mobile number"
                    value={loginMobile}
                    onChange={(e) => setLoginMobile(e.target.value.replace(/\D/g, ''))}
                    required
                    autoFocus
                  />
                </div>
              )}

              <div className="form-group">
                <label>
                  <span className="label-icon">🔒</span> Password
                </label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Enter your password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
              </div>

              {/* Role Quick Select for Login */}
              <div className="login-role-hint">
                <span className="login-role-hint-label">Logging in as?</span>
                <div className="login-role-chips">
                  {ROLES.map((role) => (
                    <span
                      key={role.value}
                      className="login-role-chip"
                      title={role.desc}
                    >
                      {role.icon} {role.label}
                    </span>
                  ))}
                </div>
              </div>

              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? <LoadingSpinner /> : 'Sign In'}
              </button>
            </form>
          )}

          {/* Register Form */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="auth-form">
              {/* Full Name */}
              <div className="form-group">
                <label>
                  <span className="label-icon">👤</span> Full Name
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter your full name"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              {/* Role Selection */}
              <div className="form-group">
                <label>
                  <span className="label-icon">🎯</span> Select Your Role
                </label>
                <div className="role-grid">
                  {ROLES.map((role) => (
                    <button
                      key={role.value}
                      type="button"
                      className={`role-card ${regRole === role.value ? 'active' : ''}`}
                      onClick={() => setRegRole(role.value)}
                    >
                      <span className="role-icon">{role.icon}</span>
                      <span className="role-label">{role.label}</span>
                      <span className="role-desc">{role.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Registration Method Tabs */}
              <div className="reg-method-tabs">
                <button
                  type="button"
                  className={`reg-method-tab ${regMethod === 'email' ? 'active' : ''}`}
                  onClick={() => switchRegMethod('email')}
                >
                  📧 Email
                </button>
                <button
                  type="button"
                  className={`reg-method-tab ${regMethod === 'mobile' ? 'active' : ''}`}
                  onClick={() => switchRegMethod('mobile')}
                >
                  📱 Mobile
                </button>
              </div>

              {/* Email Registration */}
              {regMethod === 'email' && (
                <div className="form-group">
                  <label>
                    <span className="label-icon">📧</span> Email Address
                  </label>
                  <div className="input-with-status">
                    <input
                      type="email"
                      className={`form-input ${!emailAvailable ? 'input-error' : regEmail && emailAvailable ? 'input-success' : ''}`}
                      placeholder="Enter your email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      required
                    />
                    <div className="input-status-icon">
                      {checkingEmail ? (
                        <span className="status-spinner" />
                      ) : regEmail && !emailAvailable ? (
                        <span className="status-icon error" title="Email already registered">✕</span>
                      ) : regEmail && emailAvailable ? (
                        <span className="status-icon success" title="Email available">✓</span>
                      ) : null}
                    </div>
                  </div>
                  {regEmail && !emailAvailable && (
                    <span className="field-error">This email is already registered</span>
                  )}
                  {regEmail && emailAvailable && !checkingEmail && (
                    <span className="field-success">Email is available</span>
                  )}
                </div>
              )}

              {/* Mobile Registration */}
              {regMethod === 'mobile' && (
                <>
                  <div className="form-group">
                    <label>
                      <span className="label-icon">📱</span> Mobile Number
                    </label>
                    <div className="input-with-status">
                      <input
                        type="tel"
                        className={`form-input ${!mobileAvailable ? 'input-error' : regMobile.length >= 10 && mobileAvailable ? 'input-success' : ''}`}
                        placeholder="Enter your mobile number"
                        value={regMobile}
                        onChange={(e) => setRegMobile(e.target.value.replace(/\D/g, ''))}
                        required
                      />
                      <div className="input-status-icon">
                        {checkingMobile ? (
                          <span className="status-spinner" />
                        ) : regMobile.length >= 10 && !mobileAvailable ? (
                          <span className="status-icon error" title="Mobile already registered">✕</span>
                        ) : regMobile.length >= 10 && mobileAvailable ? (
                          <span className="status-icon success" title="Mobile available">✓</span>
                        ) : null}
                      </div>
                    </div>
                    {regMobile.length >= 10 && !mobileAvailable && (
                      <span className="field-error">This number is already registered</span>
                    )}
                  </div>

                  {/* OTP Section */}
                  {mobileAvailable && regMobile.length >= 10 && !otpVerified && (
                    <div className="otp-section">
                      {!otpSent ? (
                        <button
                          type="button"
                          className="send-otp-btn"
                          onClick={handleSendOtp}
                          disabled={loading}
                        >
                          {loading ? <LoadingSpinner /> : '📨 Send OTP'}
                        </button>
                      ) : (
                        <div className="otp-verify-area">
                          <label className="otp-label">
                            Enter 6-digit OTP sent to {regMobile}
                          </label>
                          <div className="otp-inputs">
                            {otp.map((digit, index) => (
                              <input
                                key={index}
                                ref={(el) => (otpRefs.current[index] = el)}
                                type="text"
                                className="otp-input"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleOtpChange(index, e.target.value)}
                                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                autoFocus={index === 0}
                                inputMode="numeric"
                              />
                            ))}
                          </div>
                          <div className="otp-actions">
                            {otpTimer > 0 ? (
                              <span className="otp-timer">⏱️ {formatTimer(otpTimer)}</span>
                            ) : (
                              <button
                                type="button"
                                className="resend-otp-btn"
                                onClick={handleSendOtp}
                                disabled={loading}
                              >
                                Resend OTP
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {otpVerified && (
                    <div className="otp-verified-badge">
                      ✅ Mobile verified successfully
                    </div>
                  )}
                </>
              )}

              {/* Password */}
              <div className="form-group">
                <label>
                  <span className="label-icon">🔒</span> Password
                </label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="At least 6 characters"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                  minLength={6}
                />
                {regPassword && regPassword.length < 6 && (
                  <span className="field-error">Password must be at least 6 characters</span>
                )}
                {regPassword && regPassword.length >= 6 && (
                  <span className="field-success">Password strength: {regPassword.length < 8 ? 'Good' : regPassword.length < 12 ? 'Strong' : 'Very Strong'} 🔐</span>
                )}
              </div>

              {/* Confirm Password */}
              <div className="form-group">
                <label>
                  <span className="label-icon">🔐</span> Confirm Password
                </label>
                <input
                  type="password"
                  className={`form-input ${regConfirmPassword && regPassword !== regConfirmPassword ? 'input-error' : regConfirmPassword && regPassword === regConfirmPassword ? 'input-success' : ''}`}
                  placeholder="Confirm your password"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  required
                />
                {regConfirmPassword && regPassword !== regConfirmPassword && (
                  <span className="field-error">Passwords do not match</span>
                )}
                {regConfirmPassword && regPassword === regConfirmPassword && (
                  <span className="field-success">Passwords match ✓</span>
                )}
              </div>

              <button
                type="submit"
                className="login-btn register-btn"
                disabled={loading || (regMethod === 'mobile' && !otpVerified)}
              >
                {loading ? <LoadingSpinner /> : 'Create Account 🚀'}
              </button>
            </form>
          )}

          {activeTab === 'register' && (
            <div className="register-footer">
              <p>
                Already have an account?{' '}
                <button type="button" className="link-btn" onClick={switchToLogin}>
                  Sign In
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
