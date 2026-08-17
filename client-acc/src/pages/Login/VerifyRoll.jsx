import React, { useState, useContext, useEffect } from "react";
import { Hash, ShieldCheck, ArrowRight, Sparkles } from "lucide-react";
import AuthContext from "../../context/auth/authContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";

function VerifyRoll() {
  const [roll, setRoll] = useState("");
  const authContext = useContext(AuthContext);
  const navigate = useNavigate();
  const { user, loading } = authContext;

  useEffect(() => {
    if (!loading && !user) {
      toast.error("Please login first!");
      navigate("/login");
      return;
    }

    if (!loading && user?.rollNo) {
      if (user?.role !== "FACULTY") {
        navigate("/dashboard/courses");
      } else {
        navigate("/admin/dashboard");
      }
    }
  }, [user, loading, navigate]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!authContext.user) {
      toast.error("Please login first!");
      navigate("/login");
      return;
    }

    if (!roll.trim()) {
      toast.error("Roll number is required!");
      return;
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/v1/profile`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ rollNumber: roll.trim().toUpperCase() }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Verification failed!");
        return;
      }

      toast.success("Roll Verified Successfully!");
      navigate("/dashboard/courses");
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong!");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-28 pb-16 relative overflow-hidden bg-[var(--color-canvas)]">
      {/* Ambient Aurora Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-[var(--color-secondary)]/35 via-[var(--color-primary-accent)]/25 to-transparent rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-gradient-to-bl from-[var(--color-secondary-soft)]/30 via-[var(--color-primary-blue)]/20 to-transparent rounded-full blur-[100px] pointer-events-none" />

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
          <ShieldCheck className="w-9 h-9 text-white drop-shadow-md" />
        </motion.div>

        {/* Pill Tag */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100/90 border border-sky-300/80 text-[var(--color-primary)] text-[11px] font-black uppercase tracking-wider mt-5 shadow-xs">
          <Sparkles size={12} className="text-[var(--color-secondary)]" />
          <span>Profile Verification</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-[var(--color-primary)] mt-3 tracking-tight">
          Verify Identity
        </h2>
        <p className="text-slate-600 text-xs sm:text-sm mt-1 font-normal">
          Enter your IIT Patna roll number to initialize your student courses &amp; resources
        </p>

        <form onSubmit={handleVerify} className="mt-8 space-y-4 text-left">
          <div>
            <label className="text-xs font-bold text-[var(--color-primary)] block mb-1.5 tracking-wide">
              Roll Number
            </label>
            <div className="flex items-center bg-white/95 border-2 border-slate-200/90 rounded-2xl px-4 py-3 focus-within:border-[var(--color-secondary)] focus-within:ring-4 focus-within:ring-[var(--color-secondary)]/15 transition-all shadow-xs">
              <Hash size={18} className="text-slate-400 shrink-0" />
              <input
                type="text"
                value={roll}
                onChange={(e) => setRoll(e.target.value)}
                placeholder="e.g. 2101CS01"
                required
                className="text-[var(--color-primary)] placeholder-slate-400 text-sm font-bold tracking-wider uppercase w-full px-3 focus:outline-none bg-transparent"
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full flex justify-center items-center gap-2.5 bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-primary-accent)] to-[var(--color-secondary)] hover:from-[var(--color-primary-accent)] hover:to-[var(--color-secondary-soft)] text-white py-3.5 rounded-full mt-4 text-sm font-black tracking-wide shadow-[0_10px_30px_var(--color-secondary-glow)] hover:shadow-[0_15px_40px_var(--color-secondary-glow)] transition-all cursor-pointer"
          >
            <span>Verify &amp; Continue</span>
            <ArrowRight size={16} />
          </motion.button>
        </form>

        <div className="mt-6 bg-sky-50/80 border border-sky-200/80 rounded-2xl p-4 text-left">
          <p className="text-slate-700 text-xs leading-relaxed">
            <strong className="text-[var(--color-primary)] font-bold">Note:</strong> Your roll number maps your department, academic branch, and course batch to personalize your student dashboard.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default VerifyRoll;
