import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function LoadingSpinner() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-zinc-950 text-zinc-50 gap-4 font-[Plus_Jakarta_Sans]">
      <div className="w-16 h-16 rounded-2xl border border-white/10 bg-white/[0.02] flex items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-4 border-white/10 border-t-oxford-primary" />
      </div>
      <p className="text-sm text-zinc-500 font-medium tracking-widest animate-pulse uppercase">
        Verifying Session...
      </p>
    </div>
  );
}

export function PublicGuard() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingSpinner />;
  if (user) {
    if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    if (user.hasSubmittedQuestionnaire || user.smpRole === 'MENTOR' || user.smpRole === 'CO_MENTOR') {
      return <Navigate to="/waiting-room" replace />;
    }
    return <Navigate to="/onboarding" replace />;
  }
  return <Outlet />;
}

export function AuthGuard() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function AdminGuard() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'ADMIN') return <Navigate to="/waiting-room" replace />;
  return <Outlet />;
}

export function MentorGuard() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  if (user.smpRole !== 'MENTOR' && user.smpRole !== 'CO_MENTOR') return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

export function OnboardingGuard() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  if (user.hasSubmittedQuestionnaire || user.smpRole === 'MENTOR' || user.smpRole === 'CO_MENTOR') {
    return <Navigate to="/waiting-room" replace />;
  }
  return <Outlet />;
}

export function WaitingGuard() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  if (!user.hasSubmittedQuestionnaire && user.smpRole !== 'MENTOR' && user.smpRole !== 'CO_MENTOR') {
    return <Navigate to="/onboarding" replace />;
  }
  return <Outlet />;
}
