import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiPhone, FiMail, FiLinkedin } from "react-icons/fi";
import teamDetails from "./acc_team.jsx";

const cardVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const PersonCard = ({ person }) => {
  return (
    <motion.div
      variants={cardVariants}
      className="academic-card rounded-xl p-5 flex flex-col items-center text-center w-[270px] sm:w-[285px] hover:-translate-y-1 transition-all"
    >
      {/* Portrait */}
      <div className="relative w-full aspect-[4/5] rounded-lg overflow-hidden bg-slate-100 border border-slate-200 mb-4 flex items-center justify-center shrink-0">
        <img
          src={person.profile || "/user.png"}
          alt={person.name}
          onError={(e) => {
            e.currentTarget.src = "/user.png";
          }}
          className="w-full h-full object-cover object-top"
        />
        {person.subtitle && (
          <div className="absolute bottom-2 inset-x-2 flex justify-center">
            <span className="px-2.5 py-1 rounded bg-slate-900/90 text-white text-[11px] font-semibold truncate max-w-full shadow-xs">
              {person.subtitle}
            </span>
          </div>
        )}
      </div>

      {/* Name & Desc */}
      <h4 className="text-base font-bold text-slate-950 mb-1 line-clamp-1">
        {person.name}
      </h4>

      {person.description && (
        <p className="text-slate-500 text-xs leading-relaxed mb-4 line-clamp-2">
          {person.description}
        </p>
      )}

      {/* Contact Icons */}
      <div className="mt-auto pt-3 border-t border-slate-100 w-full flex items-center justify-center gap-2">
        {person.linkedin && (
          <a
            href={
              person.linkedin.startsWith("http")
                ? person.linkedin
                : `https://www.linkedin.com/in/${person.linkedin}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-md bg-slate-50 hover:bg-slate-900 hover:text-white text-slate-700 flex items-center justify-center border border-slate-200 transition-colors"
            title="LinkedIn"
          >
            <FiLinkedin size={14} />
          </a>
        )}
        {person.email && (
          <a
            href={`mailto:${person.email}`}
            className="w-8 h-8 rounded-md bg-slate-50 hover:bg-slate-900 hover:text-white text-slate-700 flex items-center justify-center border border-slate-200 transition-colors"
            title="Email"
          >
            <FiMail size={14} />
          </a>
        )}
        {person.phone && (
          <a
            href={`tel:${person.phone}`}
            className="w-8 h-8 rounded-md bg-slate-50 hover:bg-slate-900 hover:text-white text-slate-700 flex items-center justify-center border border-slate-200 transition-colors"
            title={person.phone}
          >
            <FiPhone size={14} />
          </a>
        )}
      </div>
    </motion.div>
  );
};

const AccTeam = () => {
  const currentData = teamDetails;
  const [selectedYear, setSelectedYear] = useState("2026");

  const rawWings = currentData[selectedYear] || [];
  const wings = rawWings.map((w) => ({
    wingname: w.wingname || w.WingName,
    wingcolor: w.wingcolor || w.WingColor,
    wingpeople: w.wingpeople || w.WingPeople || [],
  }));

  return (
    <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-12 text-slate-900 bg-[#F8FAFC]">
      <section className="max-w-[1280px] mx-auto">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="academic-badge mb-3">Council Directory</span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-950 tracking-tight">
            Council Representatives
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-3 leading-relaxed">
            {currentData.description ||
              "The elected and nominated student leadership governing academic mentorship, career operations, and student welfare."}
          </p>

          {/* Year Segment Switcher */}
          <div className="inline-flex p-1 bg-slate-100 rounded-lg border border-slate-200 mt-6">
            {["2025", "2026"].map((year) => (
              <button
                key={year}
                type="button"
                onClick={() => setSelectedYear(year)}
                className={`px-5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  selectedYear === year
                    ? "bg-white text-slate-950 shadow-xs border border-slate-200"
                    : "text-slate-600 hover:text-slate-950"
                }`}
              >
                {year} Council
              </button>
            ))}
          </div>
        </div>

        {/* Team Wings */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`wings-${selectedYear}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {wings.map((wing) => (
              <div key={wing.wingname} className="mb-16">
                {/* Wing Divider — Center Aligned */}
                <div className="flex items-center justify-center gap-4 mb-8">
                  <div className="h-px bg-slate-200 w-12 sm:w-24" />
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 whitespace-nowrap text-center">
                    {wing.wingname}
                  </h3>
                  <div className="h-px bg-slate-200 w-12 sm:w-24" />
                </div>

                <motion.div
                  className="flex flex-wrap justify-center gap-6"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
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