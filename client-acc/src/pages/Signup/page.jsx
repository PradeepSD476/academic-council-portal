import React, { useContext, useState } from "react";
import AuthContext from "../../context/auth/authContext";
import { Mail, Lock, User, UserPlus, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

function SignUp() {
  const { register, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  const handleSendOTP = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.endsWith("@iitp.ac.in")) {
      toast.error("Only @iitp.ac.in email addresses are allowed.");
      return;
    }
    setOtpLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/v1/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          type: "EMAIL_VERIFICATION",
        }),
      });

      const data = await res.json();

      if (!data.success) {
        toast.error(data.message || data.error || "Failed to send OTP. Please try again.");
      } else {
        setOtpSent(true);
        setEmail(cleanEmail);
        toast.success("OTP sent to your email.");
      }
    } catch (err) {
      toast.error("Network error — please check your connection and try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!otpSent || !otp) {
      toast.error("Please verify your email using OTP");
      return;
    }

    register(displayName, email.trim().toLowerCase(), password, confirmPassword, otp);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-28 pb-16 relative overflow-hidden bg-[var(--color-canvas)]">
      {/* Ambient Aurora Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-[var(--color-secondary)]/35 via-[var(--color-primary-accent)]/25 to-transparent rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-gradient-to-bl from-[var(--color-secondary-soft)]/30 via-[var(--color-primary-blue)]/20 to-transparent rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-gradient-to-b from-white/95 via-sky-50/30 to-blue-50/40 backdrop-blur-2xl border-2 border-[var(--color-secondary)]/40 hover:border-[var(--color-primary-accent)]/60 rounded-[2.5rem] shadow-[0_20px_60px_rgba(11,30,63,0.08)] hover:shadow-[0_28px_75px_var(--color-secondary-glow)] p-8 sm:p-10 text-center relative z-10 transition-all duration-500"
      >
        {/* Glow Aura */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-[var(--color-secondary)]/25 rounded-full blur-3xl pointer-events-none" />

        {/* Logo Badge */}
        <motion.div
          whileHover={{ scale: 1.08, rotate: 3 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
          className="w-18 h-18 mx-auto bg-gradient-to-br from-[var(--color-primary)] via-[var(--color-primary-accent)] to-[var(--color-secondary)] rounded-2xl flex items-center justify-center shadow-[0_10px_30px_var(--color-secondary-glow)] border border-white/30"
        >
          <UserPlus className="w-9 h-9 text-white drop-shadow-md" />
        </motion.div>

        {/* Pill Tag */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100/90 border border-sky-300/80 text-[var(--color-primary)] text-[11px] font-black uppercase tracking-wider mt-5 shadow-xs">
          <Sparkles size={12} className="text-[var(--color-secondary)]" />
          <span>Student Registration</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-[var(--color-primary)] mt-3 tracking-tight">
          Create Account
        </h2>
        <p className="text-slate-600 text-xs sm:text-sm mt-1 font-normal">
          Join the IIT Patna Academic Council portal
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4 text-left">
          {/* Full Name */}
          <div>
            <label className="text-xs font-bold text-[var(--color-primary)] block mb-1.5 tracking-wide">
              Full Name
            </label>
            <div className="flex items-center bg-white/95 border-2 border-slate-200/90 rounded-2xl px-4 py-3 focus-within:border-[var(--color-secondary)] focus-within:ring-4 focus-within:ring-[var(--color-secondary)]/15 transition-all shadow-xs">
              <User size={18} className="text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="John Doe"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="text-[var(--color-primary)] placeholder-slate-400 text-sm font-medium w-full px-3 focus:outline-none bg-transparent"
              />
            </div>
          </div>

          {/* Email + OTP */}
          <div>
            <label className="text-xs font-bold text-[var(--color-primary)] block mb-1.5 tracking-wide">
              Institute Email
            </label>
            <div className="flex items-center bg-white/95 border-2 border-slate-200/90 rounded-2xl px-4 py-2.5 focus-within:border-[var(--color-secondary)] focus-within:ring-4 focus-within:ring-[var(--color-secondary)]/15 transition-all shadow-xs">
              <Mail size={18} className="text-slate-400 shrink-0" />
              <input
                type="email"
                placeholder="student@iitp.ac.in"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setOtp("");
                  setOtpSent(false);
                }}
                required
                className="text-[var(--color-primary)] placeholder-slate-400 text-sm font-medium w-full px-3 focus:outline-none bg-transparent"
              />
              <button
                type="button"
                onClick={handleSendOTP}
                disabled={!email || otpSent || otpLoading}
                className="shrink-0 ml-2 px-3 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] text-white hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs cursor-pointer"
              >
                {otpLoading ? "Sending..." : otpSent ? "OTP Sent ✓" : "Send OTP"}
              </button>
            </div>
          </div>

          {/* OTP Input */}
          {otpSent && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="overflow-hidden"
            >
              <label className="text-xs font-bold text-[var(--color-primary)] block mb-1.5 tracking-wide">
                Enter 6-Digit OTP
              </label>
              <div className="flex items-center bg-white/95 border-2 border-[var(--color-secondary)] rounded-2xl px-4 py-3 focus-within:ring-4 focus-within:ring-[var(--color-secondary)]/20 transition-all shadow-xs">
                <CheckCircle2 size={18} className="text-[var(--color-secondary)] shrink-0" />
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit code"
                  required
                  className="text-[var(--color-primary)] placeholder-slate-400 text-sm font-bold tracking-widest w-full px-3 focus:outline-none bg-transparent"
                />
              </div>
            </motion.div>
          )}

          {/* Password */}
          <div>
            <label className="text-xs font-bold text-[var(--color-primary)] block mb-1.5 tracking-wide">
              Password
            </label>
            <div className="flex items-center bg-white/95 border-2 border-slate-200/90 rounded-2xl px-4 py-3 focus-within:border-[var(--color-secondary)] focus-within:ring-4 focus-within:ring-[var(--color-secondary)]/15 transition-all shadow-xs">
              <Lock size={18} className="text-slate-400 shrink-0" />
              <input
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="text-[var(--color-primary)] placeholder-slate-400 text-sm font-medium w-full px-3 focus:outline-none bg-transparent"
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="text-xs font-bold text-[var(--color-primary)] block mb-1.5 tracking-wide">
              Confirm Password
            </label>
            <div className="flex items-center bg-white/95 border-2 border-slate-200/90 rounded-2xl px-4 py-3 focus-within:border-[var(--color-secondary)] focus-within:ring-4 focus-within:ring-[var(--color-secondary)]/15 transition-all shadow-xs">
              <Lock size={18} className="text-slate-400 shrink-0" />
              <input
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
              <span>Creating Account...</span>
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight size={16} />
              </>
            )}
          </motion.button>
        </form>

        <p className="mt-6 text-xs sm:text-sm text-slate-600 font-medium">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-[var(--color-secondary)] hover:text-[var(--color-primary-accent)] font-extrabold cursor-pointer transition-colors hover:underline"
          >
            Sign In
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

export default SignUp;
