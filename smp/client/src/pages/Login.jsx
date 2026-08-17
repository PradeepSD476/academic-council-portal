import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/toast';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

function PasswordInput({ label, error, id, ...props }) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold ml-1" htmlFor={id}>{label}</label>
      <div className="relative group">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          className={`w-full bg-surface-container-lowest border-2 rounded-full py-4 pl-6 pr-12 text-on-surface font-body-md placeholder:text-outline-variant focus:outline-none focus:ring-4 transition-all duration-300 ${
            error
              ? 'border-error focus:ring-error/20'
              : 'border-primary focus:border-primary focus:ring-primary/20 shadow-[0_0_0_4px_rgba(0,50,125,0.08)]'
          }`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow(v => !v)}
          className="absolute right-5 top-1/2 -translate-y-1/2 text-primary hover:text-primary-container transition-colors"
        >
          {show
            ? <span className="material-symbols-outlined text-[20px]">visibility_off</span>
            : <span className="material-symbols-outlined text-[20px]">visibility</span>
          }
        </button>
      </div>
      {error && <span className="text-xs font-medium text-error ml-1">{error}</span>}
    </div>
  );
}

function EmailInput({ label, error, id, ...props }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold ml-1" htmlFor={id}>{label}</label>
      <div className="relative group">
        <input
          id={id}
          type="email"
          className={`w-full bg-surface-container-low border-2 rounded-full py-4 pl-6 pr-12 text-on-surface font-body-md placeholder:text-outline-variant focus:outline-none focus:ring-4 transition-all duration-300 ${
            error
              ? 'border-error focus:ring-error/20'
              : 'border-transparent focus:border-primary focus:ring-primary/20'
          }`}
          {...props}
        />
        <span className="material-symbols-outlined absolute right-5 top-1/2 -translate-y-1/2 text-outline-variant group-focus-within:text-primary transition-colors text-[20px]">mail</span>
      </div>
      {error && <span className="text-xs font-medium text-error ml-1">{error}</span>}
    </div>
  );
}

export default function Login() {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
      toast({ title: 'Welcome back!', description: 'Successfully logged in.', variant: 'success' });
    } catch (err) {
      toast({ title: 'Login Failed', description: err, variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.35, ease: 'easeInOut' }}
      className="flex flex-col w-full lg:flex-row min-h-screen bg-surface overflow-hidden font-body-md text-on-surface antialiased"
    >
      {/* Left Side: Form */}
      <div className="w-full lg:w-1/2 flex flex-col p-8 lg:p-16 bg-surface relative z-10">
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
          className="w-full max-w-[480px] mx-auto my-auto py-12"
        >
          {/* Title */}
          <div className="mb-12">
            <h1 className="text-5xl lg:text-[64px] font-bold tracking-tighter text-on-surface mb-4 leading-[1.1]">
              Welcome back<span className="text-primary">.</span>
            </h1>
            <p className="text-body-lg text-on-surface-variant">
              Log in to your account to continue your mentorship journey.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
            <EmailInput
              label="Email"
              id="email"
              placeholder="name@iitpatna.ac.in"
              error={errors.email?.message}
              {...register('email')}
            />
            <div>
              <PasswordInput
                label="Password"
                id="password"
                placeholder="••••••••"
                error={errors.password?.message}
                {...register('password')}
              />
              <div className="text-right mt-2">
                <Link to="/forgot-password" className="text-xs font-semibold text-primary hover:text-primary-container transition-colors">
                  Forgot Password?
                </Link>
              </div>
            </div>

            <div className="flex flex-col gap-4 mt-2">
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="w-full flex justify-center items-center gap-2 py-4 px-8 rounded-full bg-primary text-on-primary font-bold text-lg shadow-[0_8px_30px_rgba(0,50,125,0.3)] hover:bg-primary-container focus:outline-none focus:ring-4 focus:ring-primary/20 transition-colors duration-300 disabled:opacity-60 disabled:pointer-events-none"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Signing in...
                  </>
                ) : (
                  <>
                    Log In
                    <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                  </>
                )}
              </motion.button>
              <p className="text-center text-on-surface-variant text-sm">
                Don't have an account?{' '}
                <Link to="/signup" className="font-bold text-primary hover:text-primary-container transition-colors">
                  Register now
                </Link>
              </p>
            </div>
          </form>
        </motion.div>

        {/* Footer */}
        <div className="mt-auto">
          <p className="text-xs text-outline text-center lg:text-left">
            © 2026 IIT Patna · Student Mentorship Program
          </p>
        </div>
      </div>

      {/* Right Side: Graphic */}
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
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-container to-tertiary">
          {/* Glow Effects */}
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-white/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-10 left-20 w-[500px] h-[500px] bg-white/5 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-tertiary-fixed/10 rounded-full blur-[150px] pointer-events-none" />

          {/* Glassmorphic Accents */}
          <div className="absolute z-10 top-1/4 right-[15%] w-[280px] h-[380px] bg-white/10 backdrop-blur-xl border border-white/20 rounded-[40px] rotate-6 shadow-2xl pointer-events-none" />
          <div className="absolute z-10 bottom-1/4 right-[25%] w-[220px] h-[220px] bg-primary-fixed/20 backdrop-blur-md border border-white/10 rounded-full -rotate-12 shadow-xl pointer-events-none" />
          <div className="absolute z-10 top-[60%] right-[10%] w-[130px] h-[130px] bg-white/5 backdrop-blur-2xl border border-white/30 rounded-[30px] rotate-45 shadow-2xl pointer-events-none" />

          {/* Grid Overlay */}
          <div
            className="absolute inset-0 z-0 opacity-[0.03]"
            style={{ backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}
          />

          {/* Text Content */}
          <div className="absolute bottom-20 right-20 text-on-primary text-right z-10 max-w-sm">
            <h2 className="text-4xl lg:text-5xl font-bold tracking-tight mb-4 leading-tight">
              Your mentorship<br />journey begins.
            </h2>
            <p className="text-lg text-primary-fixed/90 leading-relaxed">
              Connect with senior students who've navigated the same path at IIT Patna.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
