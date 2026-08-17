import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const Wings = () => {
  return (
    <div className="py-6">
      {/* Header Section */}
      <div className="text-slate-900 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-block"
        >
          <Link
            to="/wings"
            className="inline-flex items-center gap-3 text-sm md:text-base font-black uppercase tracking-wider text-[var(--color-primary)] border-2 border-[var(--color-secondary)]/50 bg-gradient-to-r from-white/95 via-sky-50/40 to-blue-50/50 hover:bg-white hover:border-[var(--color-primary-accent)] backdrop-blur-xl px-8 py-3.5 rounded-full shadow-[0_10px_30px_var(--color-secondary-glow)] hover:shadow-[0_12px_40px_var(--color-secondary-glow)] hover:text-[var(--color-primary-accent)] transition-all duration-300 group cursor-pointer"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-secondary)] shadow-[0_0_8px_var(--color-secondary)] animate-pulse" />
            <span>Core Structure of the ACC Team</span>
            <span className="text-[var(--color-secondary)] font-black group-hover:translate-x-1.5 transition-transform">→</span>
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default Wings;
