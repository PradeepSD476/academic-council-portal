import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { motion } from 'framer-motion';
import { Hourglass, LogOut, ChevronRight, Clock } from 'lucide-react';

export default function WaitingRoom() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dots, setDots] = useState('');

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await api.get('/user/status');
        if (res.data.isAllocationComplete) {
          if (user?.smpRole === 'MENTOR' || user?.smpRole === 'CO_MENTOR') {
            navigate('/mentor/dashboard');
          } else {
            navigate('/dashboard');
          }
        }
      } catch (err) {
        console.error('Error fetching status:', err);
      }
    };
    checkStatus();
  }, [navigate, user]);

  // Animated ellipsis for "Processing"
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(d => d.length >= 3 ? '' : d + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const steps = [
    { label: 'Profile Submitted', done: true },
    { label: 'Preferences Recorded', done: true },
    { label: 'Matching Groups', done: false, active: true },
    { label: 'Allocation Complete', done: false },
  ];

  return (
    <div className="min-h-screen lg:h-screen w-full bg-background text-on-background relative overflow-y-auto lg:overflow-hidden font-body-md transition-colors duration-300">
      {/* Ambient Background Gradients */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[70%] bg-blue-300/30 blur-[140px] rounded-full mix-blend-multiply"></div>
        <div className="absolute top-[-5%] right-[-10%] w-[60%] h-[70%] bg-amber-200/40 blur-[140px] rounded-full mix-blend-multiply"></div>
        <div className="absolute bottom-[10%] left-[20%] w-[50%] h-[50%] bg-indigo-200/20 blur-[140px] rounded-full mix-blend-multiply"></div>
      </div>

      <div className="relative z-10 min-h-screen lg:h-full w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-center lg:justify-between p-6 py-12 md:p-12 lg:p-20 gap-12 lg:gap-20">
        
        {/* Left Side: Hero / Information */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="flex-1 w-full flex flex-col justify-center max-w-xl"
        >
          {/* Icon */}
          <div className="relative flex items-center justify-center lg:justify-start mb-6 md:mb-8 w-20 h-20 mx-auto lg:mx-0">
             <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping opacity-40" />
             <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-indigo-500/20 border border-primary/30 flex items-center justify-center shadow-lg shadow-primary/20">
                <Hourglass className="w-8 h-8 text-primary animate-bounce-slow" />
             </div>
          </div>
          
          {/* Heading */}
          <div className="mb-8 md:mb-10 text-center lg:text-left">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-[#111827] mb-4 md:mb-6 tracking-tight leading-[1.1]">
              Profile <br className="hidden lg:block" />
              <span className="bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent drop-shadow-sm">Submitted!</span>
            </h1>
            <p className="text-on-surface-variant text-lg md:text-xl leading-relaxed max-w-md mx-auto lg:mx-0">
              You will be notified when the <span className="font-serif italic font-normal text-[#111827]">allocation process</span> is completed. Have patience!
            </p>
          </div>

          {/* User info chip and Logout */}
          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
            <div className="flex-1 max-w-[280px] w-full flex items-center justify-between bg-surface/80 backdrop-blur-md border border-outline-variant/30 rounded-2xl px-5 py-3 shadow-sm">
              <div className="text-left">
                <span className="text-[10px] font-bold uppercase tracking-widest text-secondary block">Registered As</span>
                <span className="text-sm font-bold text-on-surface mt-0.5 block">{user?.name || 'Student'}</span>
              </div>
              <div className="font-mono text-xs font-semibold text-secondary bg-surface-variant/50 px-3 py-1.5 rounded-lg border border-outline-variant/20">
                {user?.rollNumber || 'SMP-STUDENT'}
              </div>
            </div>

            <button
              onClick={logout}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 rounded-2xl border border-outline-variant/30 bg-surface/80 backdrop-blur-md text-secondary hover:text-on-surface hover:bg-surface-container text-sm font-semibold transition-all duration-300 shadow-sm active:scale-[0.98]"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </motion.div>

        {/* Right Side: Progress Steps */}
        <motion.div 
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
          className="w-full lg:flex-1 max-w-lg"
        >
          <div className="bg-surface/80 backdrop-blur-xl border border-outline-variant/20 rounded-[2.5rem] p-6 md:p-10 shadow-xl shadow-primary/5">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#111827]">Allocation Status</h3>
              <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Processing
              </div>
            </div>
            
            <div className="space-y-4">
              {steps.map((step, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-4 rounded-2xl px-5 py-4 transition-all duration-300 shadow-sm ${
                    step.active
                      ? 'bg-primary-container/20 border border-primary/20'
                      : step.done
                      ? 'bg-emerald-500/10 border border-emerald-500/20'
                      : 'bg-surface-container-low border border-outline-variant/20'
                  }`}
                >
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                      step.done
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                        : step.active
                        ? 'bg-primary text-white shadow-md shadow-primary/20'
                        : 'bg-surface-variant text-secondary'
                    }`}
                  >
                    {step.done ? '✓' : step.active ? '•' : i + 1}
                  </div>
                  <span
                    className={`text-base font-semibold flex-1 ${
                      step.done ? 'text-emerald-600' : step.active ? 'text-primary' : 'text-secondary'
                    }`}
                  >
                    {step.label}
                    {step.active && <span className="text-primary tracking-widest">{dots}</span>}
                  </span>
                  {step.active && <Clock className="w-5 h-5 text-primary animate-spin" style={{ animationDuration: '3s' }} />}
                  {step.done && <ChevronRight className="w-5 h-5 text-emerald-500" />}
                </div>
              ))}
            </div>

            <p className="text-center text-xs font-medium text-secondary mt-8">
              This page will auto-update when your group is assigned.
            </p>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
