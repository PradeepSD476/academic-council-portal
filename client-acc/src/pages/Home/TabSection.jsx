import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const tabData = {
  academics: {
    title: "Academics",
    tagline: "Structured Curriculum & Peer Guidance",
    text: "Our Academic Wing provides guidance on course selection, academic planning, and study strategies to help students achieve excellence in their coursework. From peer mentoring to subject-specific workshops, we ensure that every student receives the right academic support at the right time.",
    image: "/academics-tab.webp",
    metrics: ["1-on-1 Mentorship", "Curriculum Roadmaps", "Exam Prep Series"],
  },
  workshops: {
    title: "Workshops",
    tagline: "Hands-on Technical & Career Bootcamps",
    text: "We conduct hands-on workshops and expert sessions designed to enhance students’ technical, analytical, and communication skills. These sessions bridge the gap between academic learning and practical implementation, preparing students for professional success.",
    image: "/workshop-tab.JPEG",
    metrics: ["Hands-on Coding Labs", "Industry Masterclasses", "Skill Sprints"],
  },
  research: {
    title: "Research & Internships",
    tagline: "Incubating High-Impact Publications & Grants",
    text: "Our Research & Internship Wing assists students in exploring research opportunities, internships, and collaborations. From proposal drafting to publication support, we aim to nurture a strong research culture at IIT Patna.",
    image: "/research-tab.jpeg",
    metrics: ["Global Research Grants", "Paper Reviews", "Internship Drives"],
  },
};

const TabSection = () => {
  const [activeTab, setActiveTab] = useState("academics");

  return (
    <div className="py-14 relative overflow-hidden">
      {/* Background ambient blur — Mint & Cyan */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[20rem] bg-[#6FE8C4]/10 rounded-full blur-3xl pointer-events-none" />

      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="max-w-[1280px] mx-auto px-6 md:px-16 relative z-10"
      >
        {/* Floating Capsule Tabs */}
        <div className="flex justify-center mb-12">
          <div className="p-2 bg-gradient-to-r from-white/95 via-slate-50/90 to-sky-50/70 backdrop-blur-2xl border-2 border-slate-200/90 rounded-full inline-flex gap-2 shadow-[0_8px_30px_rgba(11,30,63,0.08)] max-w-full overflow-x-auto scrollbar-hide">
            {Object.keys(tabData).map((key) => {
              const isActive = activeTab === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`relative whitespace-nowrap px-7 py-3 rounded-full text-sm sm:text-base font-extrabold transition-all duration-300 cursor-pointer ${
                    isActive
                      ? "text-white bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-primary-accent)] to-[var(--color-secondary)] shadow-[0_8px_25px_var(--color-secondary-glow)] scale-105"
                      : "text-slate-700 hover:text-[var(--color-primary)] hover:bg-white/80"
                  }`}
                >
                  <span>{tabData[key].title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Focus Area Bento Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="bg-gradient-to-br from-white/95 via-blue-50/40 to-sky-50/50 backdrop-blur-2xl border-2 border-[var(--color-primary-accent)]/25 hover:border-[var(--color-secondary)]/50 rounded-[2.5rem] p-8 sm:p-12 md:p-14 shadow-[0_16px_45px_rgba(19,62,135,0.12)] hover:shadow-[0_24px_60px_var(--color-secondary-glow)] transition-all duration-500 flex flex-col md:flex-row items-center justify-between gap-12 relative overflow-hidden group"
          >
            {/* Ambient permanent glow inside tab bento — Azure & Deep Blue */}
            <div className="absolute -top-16 -right-16 w-80 h-80 bg-gradient-to-bl from-[var(--color-primary-accent)]/30 via-[var(--color-secondary)]/35 to-transparent rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform duration-700" />
            <div className="absolute -bottom-16 -left-16 w-80 h-80 bg-gradient-to-tr from-[var(--color-secondary)]/30 via-[var(--color-primary-accent)]/25 to-transparent rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform duration-700" />

            <div className="md:w-1/2 space-y-6 text-center md:text-left relative z-10">
              <div className="flex items-center gap-3 justify-center md:justify-start">
                <span className="text-xs uppercase tracking-widest text-[var(--color-primary)] font-extrabold bg-gradient-to-r from-blue-100 to-sky-100 backdrop-blur-md px-4 py-1.5 rounded-full border border-[var(--color-primary-accent)]/20 shadow-xs">
                  ✦ {tabData[activeTab].tagline}
                </span>
              </div>

              <h3 className="text-3xl sm:text-5xl font-black text-[var(--color-primary)] tracking-tight leading-tight">
                {tabData[activeTab].title}
              </h3>

              <p className="text-slate-700 text-base sm:text-lg leading-relaxed font-normal">
                {tabData[activeTab].text}
              </p>

              {/* Metric feature pills */}
              <div className="pt-2 flex flex-wrap gap-2.5 justify-center md:justify-start">
                {tabData[activeTab].metrics.map((item, idx) => (
                  <span
                    key={idx}
                    className="px-4 py-2 rounded-full bg-white/90 hover:bg-white backdrop-blur-md border border-sky-200 hover:border-sky-400 text-xs sm:text-sm font-bold text-slate-800 shadow-xs transition-all flex items-center gap-2 cursor-default"
                  >
                    <span className="w-2 h-2 rounded-full bg-[var(--color-secondary)] shadow-[0_0_6px_var(--color-secondary)]" />
                    <span>{item}</span>
                  </span>
                ))}
              </div>
            </div>

            <div className="md:w-1/2 flex justify-center relative z-10">
              <div className="relative p-3 sm:p-4 rounded-[2rem] bg-gradient-to-tr from-[var(--color-secondary)]/30 via-white/60 to-[var(--color-primary-accent)]/25 border-2 border-slate-200/90 max-w-lg w-full flex justify-center shadow-2xl backdrop-blur-xl group/img hover:scale-[1.02] transition-transform duration-500">
                <img
                  src={tabData[activeTab].image}
                  alt={tabData[activeTab].title}
                  className="w-full max-h-[320px] object-cover rounded-2xl transition-all duration-500 shadow-md"
                />
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.section>
    </div>
  );
};

export default TabSection;
