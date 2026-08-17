import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FaBook, 
  FaBriefcase, 
  FaFlask, 
  FaGraduationCap, 
  FaBullhorn 
} from 'react-icons/fa';

const wingsData = [
  { id: 1, name: "Academic Mentorship", link: "/wing/academic-mentorship", icon: FaBook, desc: "Resource libraries, peer mentorship & academic policy guidance." },
  { id: 2, name: "Career Development", link: "/wing/career-development", icon: FaBriefcase, desc: "Placement & internship prep, resume reviews & alumni connect." },
  { id: 3, name: "Research Wing", link: "/wing/research", icon: FaFlask, desc: "Research scholar initiatives, symposiums & publication support." },
  { id: 4, name: "Finance Wing", link: "/wing/finance", icon: FaGraduationCap, desc: "Sponsorships, budgeting & financial governance for council programs." },
  { id: 5, name: "Web, Media & Publicity", link: "/wing/pr", icon: FaBullhorn, desc: "Digital portal development, media coverage & public outreach." },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  },
};

const Wings = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pt-36 pb-24 px-6 sm:px-12 md:px-16 lg:px-24 text-slate-900 relative overflow-hidden">
      {/* Ambient background light orbs — Terracotta & Blue */}
      <div className="absolute top-24 left-1/4 w-[32rem] h-[32rem] bg-[#D96B43]/20 rounded-full blur-3xl pointer-events-none animate-float-slow" />
      <div className="absolute bottom-20 right-1/4 w-[28rem] h-[28rem] bg-[#133E87]/20 rounded-full blur-3xl pointer-events-none animate-float-slow" style={{ animationDelay: "-4s" }} />

      <div className="max-w-[1280px] mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <div className="flex justify-center items-center gap-3 mb-4">
            <div className="w-[4px] h-8 bg-gradient-to-b from-[#D96B43] via-[#FED7AA] to-[#133E87] rounded-full shadow-[0_0_8px_#D96B43]" />
            <h1 className="text-4xl md:text-5xl font-black text-[#0B1E3F] uppercase tracking-tight">
              Council Wings
            </h1>
            <div className="w-[4px] h-8 bg-gradient-to-b from-[#D96B43] via-[#FED7AA] to-[#133E87] rounded-full shadow-[0_0_8px_#D96B43]" />
          </div>
          <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto font-normal">
            Explore the specialized wings under the Academic &amp; Career Council, each dedicated to supporting your growth in a specific domain.
          </p>
        </motion.div>

        {/* Wings Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-wrap justify-center gap-8 max-w-[1200px] mx-auto"
        >
          {wingsData.map((item) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.id}
                onClick={() => navigate(item.link)}
                variants={cardVariants}
                whileHover={{ y: -8 }}
                className="group relative w-full sm:w-[320px] md:w-[350px] p-8 bg-gradient-to-b from-white/95 via-sky-50/25 to-blue-50/35 backdrop-blur-2xl border-2 border-[var(--color-secondary)]/40 hover:border-[var(--color-primary-accent)]/60 rounded-[2.5rem] overflow-hidden shadow-[0_16px_45px_rgba(11,30,63,0.08)] hover:shadow-[0_24px_60px_var(--color-secondary-glow)] transition-all duration-500 flex flex-col items-center text-center cursor-pointer"
              >
                {/* Glow aura inside card — Azure & Deep Blue (Permanent) */}
                <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-secondary)]/15 via-[var(--color-primary-accent)]/10 to-transparent pointer-events-none" />

                <div className="w-20 h-20 rounded-[1.6rem] bg-gradient-to-br from-sky-100 to-blue-100 border-2 border-sky-200 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-gradient-to-br group-hover:from-[var(--color-primary)] group-hover:via-[var(--color-primary-accent)] group-hover:to-[var(--color-secondary)] transition-all duration-500 shadow-sm backdrop-blur-md relative z-10">
                  <Icon className="text-3xl text-[var(--color-primary)] group-hover:text-white transition-colors duration-300" />
                </div>

                <h2 className="text-2xl font-black text-[var(--color-primary)] mb-3 tracking-tight group-hover:text-[var(--color-primary-accent)] transition-colors relative z-10">
                  {item.name}
                </h2>

                <p className="text-slate-700 text-sm leading-relaxed mb-8 font-normal relative z-10">
                  {item.desc}
                </p>

                <div 
                  className="mt-auto px-7 py-3 rounded-full bg-white/90 border border-sky-200 text-[var(--color-primary)] font-black text-sm group-hover:bg-gradient-to-r group-hover:from-[var(--color-primary)] group-hover:via-[var(--color-primary-accent)] group-hover:to-[var(--color-secondary)] group-hover:text-white group-hover:border-transparent transition-all duration-500 shadow-xs backdrop-blur-md flex items-center gap-2 group-hover:gap-3 relative z-10"
                >
                  <span>Explore Wing</span>
                  <span className="font-black transition-transform duration-300 group-hover:translate-x-1">→</span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
};

export default Wings;
