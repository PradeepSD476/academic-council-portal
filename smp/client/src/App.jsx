import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/ui/toast';
import { PublicGuard, OnboardingGuard, WaitingGuard, AdminGuard, MentorGuard } from './components/Guard';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Onboarding from './pages/Onboarding';
import WaitingRoom from './pages/WaitingRoom';
import AdminDashboard from './pages/AdminDashboard';
import Dashboard from './pages/Dashboard';
import MentorDashboard from './pages/MentorDashboard';
import Landing from './pages/Landing';

// Inner component so useLocation works inside BrowserRouter
function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Routes */}
        <Route element={<PublicGuard />}>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Route>

        {/* Onboarding Flow Route */}
        <Route element={<OnboardingGuard />}>
          <Route path="/onboarding" element={<Onboarding />} />
        </Route>

        {/* Mentor Portal */}
        <Route element={<MentorGuard />}>
          <Route path="/mentor/dashboard" element={<MentorDashboard />} />
        </Route>

        {/* Student / Waiting Routes */}
        <Route element={<WaitingGuard />}>
          <Route path="/waiting-room" element={<WaitingRoom />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>

        {/* Admin Portal Route */}
        <Route element={<AdminGuard />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Route>

        {/* Catch-all Redirect */}
        <Route path="*" element={<Navigate to="/waiting-room" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter basename="/smp">
            <AnimatedRoutes />
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
