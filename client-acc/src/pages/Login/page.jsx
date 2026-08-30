import React, { useContext, useEffect, useState } from "react";
import AuthContext from "../../context/auth/authContext";
import { Mail, Lock, GraduationCap, ArrowRight, Sparkles } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { authApi } from "../../api/authApi";
import toast from "react-hot-toast";

const ForgotPasswordModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [loading, setLoading] = useState(false);

  // Reset state and lock body scroll when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep(1);
        setEmail("");
        setOtp("");
        setNewPassword("");
        setConfirmPassword("");
        setResetToken("");
      }, 300);
    } else {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return toast.error("Please enter your email.");
    setLoading(true);
    try {
      const res = await authApi.forgotPassword(cleanEmail);
      if (res.data.success) {
        setEmail(cleanEmail);
        toast.success("OTP sent to your email!");
        setStep(2);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (otp.length !== 6) return toast.error("Please enter a 6-digit OTP.");
    setLoading(true);
    try {
      const res = await authApi.verifyResetOtp(cleanEmail, otp);
      if (res.data.success) {
        setEmail(cleanEmail);
        toast.success("OTP verified!");
        setResetToken(res.data.resetToken);
        setStep(3);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return toast.error("Passwords do not match.");
    if (newPassword.length < 6) return toast.error("Password must be at least 6 characters.");
    setLoading(true);
    try {
      const res = await authApi.resetPassword(resetToken, newPassword, confirmPassword);
      if (res.data.success) {
        toast.success("Password reset successfully! You can now log in.");
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="w-full max-w-md bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl relative my-auto max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
            
            <h3 className="text-xl font-bold text-[var(--color-primary)] mb-2">
              {step === 1 && "Forgot Password"}
              {step === 2 && "Enter OTP"}
              {step === 3 && "Reset Password"}
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              {step === 1 && "Enter your registered institute email to receive an OTP."}
              {step === 2 && `We've sent a 6-digit code to ${email}.`}
              {step === 3 && "Enter your new password below."}
            </p>

            {step === 1 && (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-[var(--color-primary)] block mb-1.5">Institute Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@iitp.ac.in"
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[var(--color-secondary)] focus:ring-2 focus:ring-[var(--color-secondary)]/20 transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-accent)] text-white rounded-xl text-sm font-bold shadow-md transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {loading ? "Sending..." : "Send OTP"}
                </button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-[var(--color-primary)] block mb-1.5">6-Digit OTP</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-center tracking-[0.5em] font-bold focus:outline-none focus:border-[var(--color-secondary)] focus:ring-2 focus:ring-[var(--color-secondary)]/20 transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-accent)] text-white rounded-xl text-sm font-bold shadow-md transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {loading ? "Verifying..." : "Verify OTP"}
                </button>
              </form>
            )}

            {step === 3 && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-[var(--color-primary)] block mb-1.5">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[var(--color-secondary)] focus:ring-2 focus:ring-[var(--color-secondary)]/20 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[var(--color-primary)] block mb-1.5">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[var(--color-secondary)] focus:ring-2 focus:ring-[var(--color-secondary)]/20 transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-accent)] text-white rounded-xl text-sm font-bold shadow-md transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {loading ? "Resetting..." : "Reset Password"}
                </button>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

function SignIn() {
  const { user, login, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  useEffect(() => {
    if (user) {
      if (!user.rollNo && user?.role !== 'FACULTY') navigate("/login-with-roll");
      else {
        if (user?.role !== 'FACULTY') {
          navigate("/dashboard/courses");
        } else {
          navigate("/admin/dashboard");
        }
      }
    }
  }, [user, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    login(email.trim().toLowerCase(), password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-28 pb-16 relative overflow-hidden bg-[var(--color-canvas)]">
      {/* Dynamic Ambient Aurora Lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-[var(--color-secondary)]/35 via-[var(--color-primary-accent)]/25 to-transparent rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-gradient-to-bl from-[var(--color-secondary-soft)]/30 via-[var(--color-primary-blue)]/20 to-transparent rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-gradient-to-b from-white/95 via-sky-50/30 to-blue-50/40 backdrop-blur-2xl border-2 border-[var(--color-secondary)]/40 hover:border-[var(--color-primary-accent)]/60 rounded-[2.5rem] shadow-[0_20px_60px_rgba(11,30,63,0.08)] hover:shadow-[0_28px_75px_var(--color-secondary-glow)] p-8 sm:p-10 text-center relative z-10 transition-all duration-500"
      >
        {/* Glow Aura Inside Container */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-[var(--color-secondary)]/25 rounded-full blur-3xl pointer-events-none" />

        {/* Logo Badge */}
        <motion.div
          whileHover={{ scale: 1.08, rotate: 3 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
          className="w-18 h-18 mx-auto bg-gradient-to-br from-[var(--color-primary)] via-[var(--color-primary-accent)] to-[var(--color-secondary)] rounded-2xl flex items-center justify-center shadow-[0_10px_30px_var(--color-secondary-glow)] border border-white/30"
        >
          <GraduationCap className="w-9 h-9 text-white drop-shadow-md" />
        </motion.div>

        {/* Pill Tag */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100/90 border border-sky-300/80 text-[var(--color-primary)] text-[11px] font-black uppercase tracking-wider mt-5 shadow-xs">
          <Sparkles size={12} className="text-[var(--color-secondary)]" />
          <span>IIT Patna Academic Portal</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-[var(--color-primary)] mt-3 tracking-tight">
          Welcome Back
        </h2>
        <p className="text-slate-600 text-xs sm:text-sm mt-1 font-normal">
          Sign in with your IIT Patna credentials
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div className="text-left">
            <label className="text-xs font-bold text-[var(--color-primary)] block mb-1.5 tracking-wide">
              Institute Email
            </label>
            <div className="flex items-center bg-white/95 border-2 border-slate-200/90 rounded-2xl px-4 py-3 focus-within:border-[var(--color-secondary)] focus-within:ring-4 focus-within:ring-[var(--color-secondary)]/15 transition-all shadow-xs">
              <Mail size={18} className="text-slate-400 shrink-0" />
              <input
                type="email"
                placeholder="student@iitp.ac.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="text-[var(--color-primary)] placeholder-slate-400 text-sm font-medium w-full px-3 focus:outline-none bg-transparent"
              />
            </div>
          </div>

          <div className="text-left">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-[var(--color-primary)] block tracking-wide">
                Password
              </label>
              <button 
                type="button" 
                onClick={() => setShowForgotPassword(true)}
                className="text-xs font-bold text-[var(--color-secondary)] hover:text-[var(--color-primary-accent)] cursor-pointer transition-colors"
              >
                Forgot Password?
              </button>
            </div>
            <div className="flex items-center bg-white/95 border-2 border-slate-200/90 rounded-2xl px-4 py-3 focus-within:border-[var(--color-secondary)] focus-within:ring-4 focus-within:ring-[var(--color-secondary)]/15 transition-all shadow-xs">
              <Lock size={18} className="text-slate-400 shrink-0" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="text-[var(--color-primary)] placeholder-slate-400 text-sm font-medium w-full px-3 focus:outline-none bg-transparent"
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center gap-2.5 bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-primary-accent)] to-[var(--color-secondary)] hover:from-[var(--color-primary-accent)] hover:to-[var(--color-secondary-soft)] disabled:opacity-50 disabled:cursor-not-allowed text-white py-3.5 rounded-full mt-6 text-sm font-black tracking-wide shadow-[0_10px_30px_var(--color-secondary-glow)] hover:shadow-[0_15px_40px_var(--color-secondary-glow)] transition-all cursor-pointer"
          >
            {loading ? (
              <>
                <svg
                  className="w-4 h-4 animate-spin text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight size={16} />
              </>
            )}
          </motion.button>
        </form>

        <p className="mt-6 text-xs sm:text-sm text-slate-600 font-medium">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-[var(--color-secondary)] hover:text-[var(--color-primary-accent)] font-extrabold cursor-pointer transition-colors hover:underline"
          >
            Create Account
          </Link>
        </p>
      </motion.div>
      
      {/* Forgot Password Modal */}
      <ForgotPasswordModal 
        isOpen={showForgotPassword} 
        onClose={() => setShowForgotPassword(false)} 
      />
    </div>
  );
}

export default SignIn;
