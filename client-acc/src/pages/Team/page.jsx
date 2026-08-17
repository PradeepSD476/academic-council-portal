import React, { useState } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { FiPhone, FiMail, FiLinkedin } from "react-icons/fi";

import teamDetails from "./acc_team.jsx";

const cardVariants = {
  hidden: { opacity: 0, y: 25 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const PersonCard = ({ person }) => {
  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -8 }}
      className="group relative w-[280px] sm:w-[295px] p-4 sm:p-5 bg-gradient-to-b from-white/95 via-sky-50/25 to-blue-50/35 backdrop-blur-2xl border-2 border-[var(--color-secondary)]/40 hover:border-[var(--color-primary-accent)]/60 rounded-[2.2rem] flex flex-col items-center shadow-[0_16px_45px_rgba(11,30,63,0.08)] hover:shadow-[0_24px_60px_var(--color-secondary-glow)] transition-all duration-500 overflow-hidden"
    >
      {/* Permanent ambient background glow orbs — Azure & Deep Blue */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-[var(--color-secondary)]/30 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-[var(--color-primary-accent)]/20 rounded-full blur-2xl pointer-events-none" />

      {/* Inset Framed Portrait Section */}
      <div className="relative w-full aspect-[4/5] rounded-[1.6rem] overflow-hidden bg-slate-100 border-2 border-slate-200/90 shadow-xs flex items-center justify-center shrink-0">
        <img
          src={person.profile || "/user.png"}
          alt={person.name}
          onError={(e) => {
            e.currentTarget.src = "/user.png";
          }}
          className="w-full h-full object-cover object-top shrink-0 group-hover:scale-105 transition-transform duration-700"
        />
        {/* Soft bottom vignette gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />
        
        {/* Floating Role Pill Badge anchored at bottom of portrait */}
        <div className="absolute bottom-2.5 inset-x-0 flex justify-center z-10 px-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-primary-accent)] to-[var(--color-secondary)] text-white text-[10.5px] font-black uppercase tracking-wider shadow-md border border-white/20 backdrop-blur-md max-w-full truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-200 shadow-[0_0_6px_var(--color-secondary)] animate-pulse shrink-0" />
            <span className="truncate">{person.subtitle}</span>
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="pt-4 w-full flex-grow flex flex-col items-center text-center relative z-10">
        <h4 className="text-lg sm:text-[19px] font-black text-[var(--color-primary)] mb-1 tracking-tight group-hover:text-[var(--color-primary-accent)] transition-colors line-clamp-1">
          {person.name}
        </h4>

        {person.description && (
          <p className="text-slate-700 text-xs sm:text-[13px] leading-relaxed mb-4 font-normal line-clamp-2">
            {person.description}
          </p>
        )}

        {/* Floating Glass Social Dock */}
        <div className="mt-auto pt-1 w-full flex items-center justify-center">
          <div className="p-1 bg-white/95 backdrop-blur-md border border-sky-200/80 rounded-xl inline-flex items-center gap-2 shadow-xs">
            {person.linkedin && (
              <a
                href={person.linkedin.startsWith('http') ? person.linkedin : `https://www.linkedin.com/in/${person.linkedin}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-sky-50 hover:bg-[var(--color-primary)] text-[var(--color-primary)] hover:text-white flex items-center justify-center transition-all duration-300 shadow-xs hover:scale-110 active:scale-95 cursor-pointer border border-sky-200/60 hover:border-[var(--color-primary)]"
                title="LinkedIn"
              >
                <FiLinkedin size={14} />
              </a>
            )}
            {person.email && (
              <a
                href={`mailto:${person.email}`}
                className="w-8 h-8 rounded-lg bg-sky-50 hover:bg-[var(--color-primary)] text-[var(--color-primary)] hover:text-white flex items-center justify-center transition-all duration-300 shadow-xs hover:scale-110 active:scale-95 cursor-pointer border border-sky-200/60 hover:border-[var(--color-primary)]"
                title="Email"
              >
                <FiMail size={14} />
              </a>
            )}
            {person.phone && (
              <a
                href={`tel:${person.phone}`}
                className="w-8 h-8 rounded-lg bg-sky-50 hover:bg-[var(--color-primary)] text-[var(--color-primary)] hover:text-white flex items-center justify-center transition-all duration-300 shadow-xs hover:scale-110 active:scale-95 cursor-pointer border border-sky-200/60 hover:border-[var(--color-primary)]"
                title={person.phone}
              >
                <FiPhone size={14} />
              </a>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const AccTeam = () => {
  const currentData = teamDetails;
  const [selectedYear, setSelectedYear] = useState("2026");

  const rawWings = currentData[selectedYear] || [];
  const wings = rawWings.map(w => ({
    wingname: w.wingname || w.WingName,
    wingcolor: w.wingcolor || w.WingColor,
    wingpeople: w.wingpeople || w.WingPeople || []
  }));

  return (
    <div className="min-h-screen pt-36 pb-24 px-6 sm:px-12 md:px-16 lg:px-24 text-slate-900 relative overflow-hidden">
      {/* Ambient decorative light orbs — Terracotta & Blue */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-[#D96B43]/20 rounded-full blur-3xl pointer-events-none animate-float-slow" />
      <div className="absolute top-1/2 right-10 w-[30rem] h-[30rem] bg-[#133E87]/20 rounded-full blur-3xl pointer-events-none animate-float-slow" style={{ animationDelay: "-3s" }} />

      <section className="max-w-[1280px] mx-auto relative z-10">

        {/* Header */}
        <AnimatePresence mode="wait">
          <motion.section
            key={`header-${selectedYear}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4, ease: "circOut" }}
            className="text-center mb-20"
          >
            <div className="flex justify-center items-center gap-3 mb-4">
              <div className="w-[4px] h-8 bg-gradient-to-b from-[#D96B43] via-[#FED7AA] to-[#133E87] rounded-full shadow-[0_0_8px_#D96B43]" />
              <h2 className="text-4xl md:text-5xl font-black text-[#0B1E3F] uppercase tracking-tight">
                {currentData.title}
              </h2>
              <div className="w-[4px] h-8 bg-gradient-to-b from-[#D96B43] via-[#FED7AA] to-[#133E87] rounded-full shadow-[0_0_8px_#D96B43]" />
            </div>

            <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto mb-10 font-normal">
              {currentData.description}
            </p>

            <div className="inline-flex p-1.5 bg-white/80 backdrop-blur-xl rounded-full border border-slate-200/80 shadow-lg">
              {["2025", "2026"].map((year) => (
                <button
                  key={year}
                  type="button"
                  onClick={() => setSelectedYear(year)}
                  className={`px-8 py-2.5 rounded-full text-sm font-bold transition-all duration-300 cursor-pointer ${selectedYear === year
                    ? "bg-gradient-to-r from-[#0B1E3F] via-[#133E87] to-[#0284C7] text-white shadow-[0_4px_15px_rgba(2,132,199,0.35)]"
                    : "text-slate-600 hover:text-[#0B1E3F]"
                    }`}
                >
                  {year} Batch
                </button>
              ))}
            </div>
          </motion.section>
        </AnimatePresence>

        {/* Team Wings */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`wings-${selectedYear}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {wings.map((wing) => (
              <div key={wing.wingname} className="mb-24">
                {/* Modern Wing Divider Section */}
                <div className="relative flex items-center justify-center mb-14">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200/80" />
                  </div>
                  <div className="relative px-6">
                    <span className="inline-flex items-center gap-3 text-xl md:text-2xl font-extrabold text-[#0B1E3F] uppercase tracking-widest text-center px-8 py-3 bg-white/90 backdrop-blur-xl border border-slate-200/90 rounded-full shadow-[0_8px_30px_rgba(11,30,63,0.08)]">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] shadow-[0_0_8px_#10B981]" />
                      {wing.wingname}
                    </span>
                  </div>
                </div>

                <motion.div
                  className="flex flex-wrap justify-center gap-8 md:gap-10"
                  variants={containerVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.1 }}
                >
                  {wing.wingpeople.map((person, index) => (
                    <PersonCard
                      key={`${person.name}-${index}`}
                      person={person}
                    />
                  ))}
                </motion.div>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>

      </section>
    </div>
  );
};

export default AccTeam;