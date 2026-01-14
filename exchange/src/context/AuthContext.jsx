import React, { createContext, useContext, useState, useEffect } from 'react';
import { exchangeAdminApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing admin session
    const adminToken = localStorage.getItem('adminToken');
    const adminData = localStorage.getItem('adminData');
    if (adminToken && adminData) {
      setAdmin(JSON.parse(adminData));
    }

    // Check for existing user session
    const userToken = localStorage.getItem('userToken');
    const userData = localStorage.getItem('userData');
    if (userToken && userData) {
      setUser(JSON.parse(userData));
    }

    setLoading(false);
  }, []);

  const loginAdmin = async (email, password) => {
    const response = await exchangeAdminApi.login(email, password);
    const { token, admin: adminData } = response.data;

    localStorage.setItem('adminToken', token);
    localStorage.setItem('adminData', JSON.stringify(adminData));
    setAdmin(adminData);

    return adminData;
  };

  const logoutAdmin = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    setAdmin(null);
  };

  // For demo: simple user login (in real app this would use proper auth)
  const loginUser = (userData, token) => {
    localStorage.setItem('userToken', token);
    localStorage.setItem('userData', JSON.stringify(userData));
    setUser(userData);
  };

  const logoutUser = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userData');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      admin,
      user,
      loading,
      loginAdmin,
      logoutAdmin,
      loginUser,
      logoutUser
    }}>
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
