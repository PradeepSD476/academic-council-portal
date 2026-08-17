import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/toast';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';

function FloatingInput({ label, id, icon, error, type = 'text', value, onChange, ...props }) {
  return (
    <div>
      <div className={`relative bg-surface-container-low rounded-2xl px-5 py-3 border-2 transition-all duration-300 ${
        error ? 'border-error' : 'border-transparent focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/20'
      }`}>
        <label
          className={`block text-[11px] uppercase tracking-wider font-semibold mb-1 ${error ? 'text-error' : 'text-outline'}`}
          htmlFor={id}
        >
          {label}
        </label>
        <div className="flex items-center">
          <input
            id={id}
            type={type}
            value={value}
            onChange={onChange}
            className="block w-full bg-transparent border-none p-0 text-on-surface text-[16px] focus:ring-0 focus:outline-none placeholder:text-outline-variant"
            {...props}
          />
          {icon && <span className="material-symbols-outlined text-[20px] text-outline ml-2 flex-shrink-0">{icon}</span>}
        </div>
      </div>
      {error && <span className="text-xs font-medium text-error ml-1 mt-1 block">{error}</span>}
    </div>
  );
}

function FloatingPasswordInput({ label, id, error, value, onChange, ...props }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <div className={`relative bg-surface-container-lowest rounded-2xl px-5 py-3 border-2 transition-all duration-300 shadow-sm ${
        error ? 'border-error' : 'border-primary focus-within:ring-4 focus-within:ring-primary/20'
      }`}>
        <label
          className={`block text-[11px] uppercase tracking-wider font-semibold mb-1 ${error ? 'text-error' : 'text-primary'}`}
          htmlFor={id}
        >
          {label}
        </label>
        <div className="flex items-center">
          <input
            id={id}
            type={show ? 'text' : 'password'}
            value={value}
            onChange={onChange}
            className="block w-full bg-transparent border-none p-0 text-on-surface text-[16px] focus:ring-0 focus:outline-none placeholder:text-outline-variant"
            {...props}
          />
          <button
            type="button"
            onClick={() => setShow(v => !v)}
            className="text-outline hover:text-primary transition-colors ml-2 flex-shrink-0"
          >
            <span className="material-symbols-outlined text-[20px]">
              {show ? 'visibility_off' : 'visibility'}
            </span>
          </button>
        </div>
      </div>
      {error && <span className="text-xs font-medium text-error ml-1 mt-1 block">{error}</span>}
    </div>
  );
}

export default function ForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const { sendResetPasswordOtp, resetPassword } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const onSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (!email) return toast({ title: 'Email required', description: 'Please enter your email.', variant: 'error' });
    
    setLoading(true);
    try {
      await sendResetPasswordOtp(email);
      setStep(2);
      setCooldown(60);
      toast({ title: 'OTP Sent', description: 'Check your email for the password reset OTP.', variant: 'success' });
    } catch (err) {
      toast({ title: 'Failed', description: err, variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const onResetPassword = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) return toast({ title: 'Invalid OTP', description: 'Please enter a 6-digit OTP.', variant: 'error' });
    if (newPassword.length < 6) return toast({ title: 'Weak Password', description: 'Password must be at least 6 characters.', variant: 'error' });

    setLoading(true);
    try {
      await resetPassword(email, otp, newPassword);
      toast({ title: 'Password Reset', description: 'Your password has been successfully reset. You can now login.', variant: 'success' });
      navigate('/login');
    } catch (err) {
      toast({ title: 'Reset Failed', description: err, variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.35, ease: 'easeInOut' }}
      className="flex flex-col w-full min-h-screen bg-surface overflow-hidden font-body-md text-on-surface antialiased items-center justify-center"
    >
      <div className="absolute top-6 left-8 lg:left-16">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center shadow-sm group-hover:bg-primary/20 transition-colors">
            <span className="text-primary font-black text-[10px] tracking-wider">SMP</span>
          </div>
          <div>
            <span className="font-bold text-on-surface text-sm block tracking-tight">IIT Patna</span>
            <span className="text-[11px] text-on-surface-variant">Student Mentorship Program</span>
          </div>
        </Link>
      </div>

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: 'easeOut' }} className="max-w-md w-full px-8 z-10">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tighter text-on-surface mb-4 leading-[1.1]">
            Reset Password<span className="text-primary">.</span>
          </h1>
          <p className="text-sm text-on-surface-variant">
            Remembered your password?{' '}
            <Link to="/login" className="font-bold text-primary hover:text-primary-container transition-colors duration-200">Log In</Link>
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={onSendOtp} className="space-y-6">
            <FloatingInput
              label="Academic Email" id="email" icon="mail" type="email"
              placeholder="jane.doe@iitpatna.ac.in" value={email} onChange={e => setEmail(e.target.value)}
            />
            <div className="pt-2">
              <motion.button type="submit" disabled={loading} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
                className="w-full flex justify-center items-center gap-2 py-4 px-8 border border-transparent rounded-full shadow-[0_8px_30px_rgba(0,50,125,0.3)] text-on-primary bg-primary hover:bg-primary-container focus:outline-none text-lg font-bold transition-colors duration-300 disabled:opacity-60"
              >
                {loading ? 'Sending OTP...' : 'Send Reset OTP'}
              </motion.button>
            </div>
          </form>
        ) : (
          <form onSubmit={onResetPassword} className="space-y-6">
            <FloatingInput
              label="6-Digit OTP" id="otp" icon="password" type="text"
              placeholder="123456" value={otp} onChange={e => setOtp(e.target.value)}
            />
            <FloatingPasswordInput
              label="New Password" id="newPassword"
              placeholder="••••••••" value={newPassword} onChange={e => setNewPassword(e.target.value)}
            />
            <div className="pt-2">
              <motion.button type="submit" disabled={loading} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
                className="w-full flex justify-center items-center gap-2 py-4 px-8 border border-transparent rounded-full shadow-[0_8px_30px_rgba(0,50,125,0.3)] text-on-primary bg-primary hover:bg-primary-container focus:outline-none text-lg font-bold transition-colors duration-300 disabled:opacity-60"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </motion.button>
            </div>
            <div className="flex items-center justify-between mt-4">
              <button type="button" onClick={() => setStep(1)} className="text-xs font-semibold text-primary hover:text-primary-container transition-colors">
                &larr; Back to email
              </button>
              <button
                type="button"
                disabled={cooldown > 0 || loading}
                onClick={onSendOtp}
                className="text-xs font-semibold text-primary hover:text-primary-container disabled:text-outline transition-colors"
              >
                {cooldown > 0 ? `Resend OTP in ${cooldown}s` : 'Resend OTP'}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
}
