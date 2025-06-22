import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../lib/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await apiService.getCurrentUser();
      setUser(response.user);
    } catch (error) {
      console.log('Not authenticated');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await apiService.login(email, password);
      setUser(response.user);
      return response;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails on server, clear local state
      setUser(null);
    }
  };

  const register = async (name, email, password, role = 'End-User') => {
    try {
      setError(null);
      const response = await apiService.register(name, email, password, role);
      return response;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    register,
    checkAuthStatus,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'Admin',
    isAgent: user?.role === 'Agent' || user?.role?.startsWith('L'),
    isEndUser: user?.role === 'End-User',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

