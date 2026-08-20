import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/toast';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  rollNumber: z
    .string()
    .trim()
    .toUpperCase()
    .regex(
      /^[0-9]{2}(01|02|03)[A-Za-z]{2}[0-9]{2}$/,
      'Must be an 8-character B.Tech or Dual-Degree roll number (e.g. 2401AI36)'
    ),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Please enter a valid email address')
    .refine(
      (val) => val.endsWith('@iitp.ac.in'),
      { message: 'Must be an official @iitp.ac.in email address' }
    ),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// Floating label input (register style from Stitch)
function FloatingInput({ label, id, icon, error, type = 'text', inputRef, ...props }) {
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
            ref={inputRef}
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

// Password variant with toggle
function FloatingPasswordInput({ label, id, error, inputRef, ...props }) {
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
            ref={inputRef}
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

export default function Register() {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(null);
  const [otp, setOtp] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const { signup, sendSignupOtp } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(signupSchema) });

  const onSendOtp = async (data) => {
    setLoading(true);
    try {
      await sendSignupOtp({ email: data.email, rollNumber: data.rollNumber });
      setFormData(data);
      setStep(2);
      setCooldown(60);
      toast({ title: 'OTP Sent', description: 'Check your email for the verification code.', variant: 'success' });
    } catch (err) {
      toast({ title: 'Failed', description: err, variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0 || !formData) return;
    setLoading(true);
    try {
      await sendSignupOtp({ email: formData.email, rollNumber: formData.rollNumber });
      setCooldown(60);
      toast({ title: 'OTP Resent', description: 'Check your email for the new verification code.', variant: 'success' });
    } catch (err) {
      toast({ title: 'Failed', description: err, variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const onVerifyAndRegister = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      return toast({ title: 'Invalid OTP', description: 'Please enter a 6-digit OTP.', variant: 'error' });
    }
    setLoading(true);
    try {
      await signup(formData.name, formData.email, formData.rollNumber, formData.password, otp);
      toast({ title: 'Account Created!', description: 'Welcome to the Mentorship Program!', variant: 'success' });
    } catch (err) {
      toast({ title: 'Signup Failed', description: err, variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.35, ease: 'easeInOut' }}
      className="flex flex-col w-full lg:flex-row min-h-screen bg-surface overflow-hidden font-body-md text-on-surface antialiased"
    >
      {/* Left Side: Form */}
      <div className="flex-1 flex flex-col justify-center px-8 py-12 lg:px-24 xl:px-32 relative bg-surface z-10 lg:w-1/2">
        {/* Branding — navbar height */}
        <div className="absolute top-6 left-8 lg:left-16">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center shadow-sm group-hover:bg-primary/20 transition-colors">
              <span className="text-primary font-black text-[10px] tracking-wider"><img src="./logo.png" alt="logo" /></span>
            </div>
            <div>
              <span className="font-bold text-on-surface text-sm block tracking-tight">IIT Patna</span>
              <span className="text-[11px] text-on-surface-variant">Student Mentorship Program</span>
            </div>
          </Link>
        </div>

        {/* Form Container */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="max-w-md w-full mt-16 lg:mt-0 z-10"
        >
          {/* Title */}
          <div className="mb-10 text-left">
            <h1 className="text-5xl lg:text-[64px] font-bold tracking-tighter text-on-surface mb-4 leading-[1.1]">
              Create new account<span className="text-primary">.</span>
            </h1>
            <p className="text-lg text-on-surface-variant">
              Already a member?{' '}
              <Link to="/login" className="font-bold text-primary hover:text-primary-container transition-colors duration-200">
                Log In
              </Link>
            </p>
          </div>

          {/* Form */}
          {step === 1 ? (
            <form onSubmit={handleSubmit(onSendOtp)} className="space-y-6">
              {/* Name & Roll Number Row */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <FloatingInput
                    label="Full Name"
                    id="fullName"
                    icon="person_outline"
                    placeholder="Jane Doe"
                    error={errors.name?.message}
                    {...register('name')}
                  />
                </div>
                <div className="flex-1">
                  <FloatingInput
                    label="Roll Number"
                    id="rollNumber"
                    icon="badge"
                    placeholder="24BCS1001"
                    error={errors.rollNumber?.message}
                    {...register('rollNumber')}
                  />
                </div>
              </div>

              {/* Email */}
              <FloatingInput
                label="Academic Email"
                id="email"
                icon="mail"
                type="email"
                placeholder="jane.doe@iitpatna.ac.in"
                error={errors.email?.message}
                {...register('email')}
              />

              {/* Password */}
              <FloatingPasswordInput
                label="Password"
                id="password"
                placeholder="••••••••"
                error={errors.password?.message}
                {...register('password')}
              />

              {/* Submit */}
              <div className="pt-6">
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="w-full flex justify-center items-center gap-2 py-4 px-8 border border-transparent rounded-full shadow-[0_8px_30px_rgba(0,50,125,0.3)] text-on-primary bg-primary hover:bg-primary-container focus:outline-none focus:ring-4 focus:ring-primary/20 text-lg font-bold transition-colors duration-300 disabled:opacity-60 disabled:pointer-events-none"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      Verify Email
                      <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                    </>
                  )}
                </motion.button>
              </div>

              <p className="text-center text-xs text-outline mt-4">
                By registering, you agree to the IIT Patna SMP terms of use.
              </p>
            </form>
          ) : (
            <motion.form 
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              onSubmit={onVerifyAndRegister} className="space-y-6"
            >
              <FloatingInput
                label="6-Digit OTP"
                id="otp"
                icon="password"
                type="text"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />

              <div className="pt-6">
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="w-full flex justify-center items-center gap-2 py-4 px-8 border border-transparent rounded-full shadow-[0_8px_30px_rgba(0,50,125,0.3)] text-on-primary bg-primary hover:bg-primary-container focus:outline-none focus:ring-4 focus:ring-primary/20 text-lg font-bold transition-colors duration-300 disabled:opacity-60 disabled:pointer-events-none"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Verifying...
                    </>
                  ) : (
                    <>
                      Complete Registration
                      <span className="material-symbols-outlined text-[20px]">check_circle</span>
                    </>
                  )}
                </motion.button>
              </div>

              <div className="flex items-center justify-between mt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs font-semibold text-primary hover:text-primary-container transition-colors"
                >
                  &larr; Back to edit details
                </button>
                <button
                  type="button"
                  disabled={cooldown > 0 || loading}
                  onClick={handleResendOtp}
                  className="text-xs font-semibold text-primary hover:text-primary-container disabled:text-outline transition-colors"
                >
                  {cooldown > 0 ? `Resend OTP in ${cooldown}s` : 'Resend OTP'}
                </button>
              </div>
            </motion.form>
          )}
        </motion.div>

        {/* Decorative blob */}
        <div className="absolute bottom-1/4 left-10 w-48 h-48 bg-primary-fixed rounded-full mix-blend-multiply filter blur-[60px] opacity-10 pointer-events-none" />
      </div>

      {/* Right Side: Wavy SVG Mask (same as Login) */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden bg-surface">
        {/* SVG Wavy Mask Overlay */}
        <svg
          className="absolute left-0 top-0 h-full w-[250px] -translate-x-[1px] z-20 text-surface"
          fill="currentColor"
          preserveAspectRatio="none"
          viewBox="0 0 100 1000"
        >
          <path d="M0,0 L100,0 C60,200 140,400 80,600 C20,800 100,1000 0,1000 Z" />
        </svg>

        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-[#005569] to-[#001946]">
          {/* Glow Effects */}
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-white/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-10 left-20 w-[500px] h-[500px] bg-white/5 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#4cd6ff]/10 rounded-full blur-[150px] pointer-events-none" />

          {/* Glassmorphic Accents */}
          <div className="absolute z-10 top-1/4 right-[15%] w-[280px] h-[380px] bg-white/10 backdrop-blur-xl border border-white/20 rounded-[40px] rotate-6 shadow-2xl pointer-events-none" />
          <div className="absolute z-10 bottom-1/4 right-[25%] w-[220px] h-[220px] bg-[#b1c5ff]/20 backdrop-blur-md border border-white/10 rounded-full -rotate-12 shadow-xl pointer-events-none" />
          <motion.div
            animate={{ y: [0, -14, 0], rotate: [45, 50, 45] }}
            transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute z-10 top-[60%] right-[10%] w-[130px] h-[130px] bg-white/5 backdrop-blur-2xl border border-white/30 rounded-[30px] shadow-2xl pointer-events-none"
          />

          {/* Grid Overlay */}
          <div
            className="absolute inset-0 z-0 opacity-[0.03]"
            style={{ backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}
          />

          {/* Text Content */}
          <div className="absolute bottom-20 right-20 text-on-primary text-right z-10 max-w-sm">
            <h2 className="text-4xl lg:text-5xl font-bold tracking-tight mb-4 leading-tight">
              Elevate Your<br />Potential
            </h2>
            <p className="text-lg text-[#b1c5ff]/90 leading-relaxed">
              Join 200+ students already growing with mentors who've been in your shoes at IIT Patna.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
