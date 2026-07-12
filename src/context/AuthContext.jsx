import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

// Simulated users with RBAC
const MOCK_USERS = [
  {
    id: 1,
    email: 'fleet.manager@fleetmaster.com',
    password: 'admin123',
    name: 'Marcus Johnson',
    role: 'fleet-manager',
    avatar: 'MJ',
  },
  {
    id: 2,
    email: 'driver@fleetmaster.com',
    password: 'driver123',
    name: 'Alex Thompson',
    role: 'driver',
    avatar: 'AT',
  },
  {
    id: 3,
    email: 'safety@fleetmaster.com',
    password: 'safety123',
    name: 'Sarah Williams',
    role: 'safety-officer',
    avatar: 'SW',
  },
  {
    id: 4,
    email: 'finance@fleetmaster.com',
    password: 'finance123',
    name: 'David Chen',
    role: 'financial-analyst',
    avatar: 'DC',
  },
];

// Role-based permissions map
const ROLE_PERMISSIONS = {
  'fleet-manager': [
    'view-dashboard',
    'view-vehicles',
    'manage-vehicles',
    'view-drivers',
    'manage-drivers',
    'view-trips',
    'manage-trips',
    'view-maintenance',
    'manage-maintenance',
    'view-fuel-expenses',
    'view-reports',
  ],
  driver: [
    'view-dashboard',
    'view-vehicles',
    'view-drivers',
    'view-trips',
    'manage-trips',
  ],
  'safety-officer': [
    'view-dashboard',
    'view-vehicles',
    'view-drivers',
    'manage-drivers',
    'view-trips',
    'view-maintenance',
    'view-reports',
  ],
  'financial-analyst': [
    'view-dashboard',
    'view-vehicles',
    'view-trips',
    'view-maintenance',
    'view-fuel-expenses',
    'manage-fuel-expenses',
    'view-reports',
  ],
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored session
    const storedUser = sessionStorage.getItem('fleetmaster_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        sessionStorage.removeItem('fleetmaster_user');
      }
    }
    setLoading(false);
  }, []);

  const login = (email, password) => {
    const foundUser = MOCK_USERS.find(
      (u) => u.email === email && u.password === password
    );
    if (foundUser) {
      const userData = {
        id: foundUser.id,
        email: foundUser.email,
        name: foundUser.name,
        role: foundUser.role,
        avatar: foundUser.avatar,
        permissions: ROLE_PERMISSIONS[foundUser.role] || [],
      };
      setUser(userData);
      sessionStorage.setItem('fleetmaster_user', JSON.stringify(userData));
      return { success: true, user: userData };
    }
    return { success: false, error: 'Invalid email or password' };
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('fleetmaster_user');
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    return user.permissions.includes(permission);
  };

  const hasRole = (...roles) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, hasPermission, hasRole, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
