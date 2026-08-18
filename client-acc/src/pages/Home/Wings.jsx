import React from "react";
import { Link } from "react-router-dom";
import { FiLayers, FiArrowRight } from "react-icons/fi";
import { motion } from "framer-motion";

const Wings = () => {
  return (
    <div className="relative z-20 -mt-10 sm:-mt-14 max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-white rounded-2xl border border-slate-200/90 shadow-xl shadow-slate-950/10 p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-5 transition-all duration-200"
      >
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
            <FiLayers className="text-xl" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-950 leading-snug">
              Discover the 5 Operational Wings of the Council
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Academic Mentorship · Career Development · Research · Finance · Media &amp; PR
            </p>
          </div>
        </div>

        <Link
          to="/wings"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-blue-600 text-white font-bold text-xs shadow-xs hover:shadow transition-all duration-200 whitespace-nowrap shrink-0 cursor-pointer group"
        >
          <span>Explore Wings</span>
          <FiArrowRight className="text-xs group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </motion.div>
    </div>
  );
};

export default Wings;

