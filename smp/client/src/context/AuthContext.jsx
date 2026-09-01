import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';

const AuthContext = createContext(null);

// No bypass users anymore

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCurrentUser = async () => {

    try {
      const response = await api.get('/auth/me');
      setUser(response.data);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchCurrentUser(); }, []);

  const login = async (email, password) => {


    try {
      const response = await api.post('/auth/login', { email, password });
      setUser(response.data);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Login failed. Please check your credentials.';
    }
  };

  const sendSignupOtp = async (email) => {
    try {
      await api.post('/auth/signup/otp', { email });
    } catch (error) {
      throw error.response?.data?.message || 'Failed to send OTP. Please try again.';
    }
  };

  const signup = async (name, email, password, otp) => {
    try {
      const response = await api.post('/auth/signup', { name, email, password, otp });
      setUser(response.data);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Signup failed. Please try again.';
    }
  };

  const sendResetPasswordOtp = async (email) => {
    try {
      await api.post('/auth/password/forgot', { email });
    } catch (error) {
      throw error.response?.data?.message || 'Failed to send OTP.';
    }
  };

  const resetPassword = async (email, otp, newPassword) => {
    try {
      await api.post('/auth/password/reset', { email, otp, newPassword });
    } catch (error) {
      throw error.response?.data?.message || 'Password reset failed.';
    }
  };

  const logout = async () => {
    localStorage.removeItem('bypassUser');
    try { await api.post('/auth/logout'); } catch {}
    setUser(null);
  };

  const setHasSubmittedQuestionnaire = () =>
    setUser((prev) => (prev ? { ...prev, hasSubmittedQuestionnaire: true } : null));

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, sendSignupOtp, sendResetPasswordOtp, resetPassword, logout, refreshSession: fetchCurrentUser, setHasSubmittedQuestionnaire }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
