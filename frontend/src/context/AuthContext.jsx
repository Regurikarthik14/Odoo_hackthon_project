import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('oddo_token');
    const savedUser = localStorage.getItem('oddo_user');
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('oddo_token');
        localStorage.removeItem('oddo_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, user: userData } = res.data;
    localStorage.setItem('oddo_token', token);
    localStorage.setItem('oddo_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const loginWithMobile = async (mobile, password) => {
    const res = await api.post('/auth/login', { mobile, password });
    const { token, user: userData } = res.data;
    localStorage.setItem('oddo_token', token);
    localStorage.setItem('oddo_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const checkAvailability = async (field, value) => {
    const res = await api.post('/auth/check-availability', { field, value });
    return res.data.available;
  };

  const sendOtp = async (mobile) => {
    const res = await api.post('/auth/send-otp', { mobile });
    return res.data;
  };

  const verifyOtp = async (mobile, otp) => {
    const res = await api.post('/auth/verify-otp', { mobile, otp });
    return res.data.verified;
  };

  const register = async (userData) => {
    const res = await api.post('/auth/register', userData);
    const { token, user: userData_ } = res.data;
    localStorage.setItem('oddo_token', token);
    localStorage.setItem('oddo_user', JSON.stringify(userData_));
    setUser(userData_);
    return userData_;
  };

  const logout = () => {
    localStorage.removeItem('oddo_token');
    localStorage.removeItem('oddo_user');
    setUser(null);
  };

  const hasRole = (...roles) => {
    return user && roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithMobile, register, checkAvailability, sendOtp, verifyOtp, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
