import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiBook,
  FiBriefcase,
  FiCompass,
  FiDollarSign,
  FiRadio,
  FiArrowRight,
} from "react-icons/fi";

const wingsData = [
  {
    id: 1,
    name: "Academic Mentorship Wing",
    link: "/wing/academic-mentorship",
    icon: FiBook,
    desc: "Curates course repositories, coordinates 1-on-1 peer mentoring, and assists students with institute academic regulations.",
    badge: "Academics",
  },
  {
    id: 2,
    name: "Career Development Wing",
    link: "/wing/career-development",
    icon: FiBriefcase,
    desc: "Organizes placement and internship preparation sessions, resume review drives, mock interviews, and alumni career panels.",
    badge: "Career & Placement",
  },
  {
    id: 3,
    name: "Research & Innovation Wing",
    link: "/wing/research",
    icon: FiCompass,
    desc: "Facilitates research scholar symposiums, undergraduate research opportunities, publication reviews, and faculty lab connects.",
    badge: "Research & Grants",
  },
  {
    id: 4,
    name: "Finance & Sponsorship Wing",
    link: "/wing/finance",
    icon: FiDollarSign,
    desc: "Manages council budgets, scholarship awareness programs, and industry sponsorship drives for flagship conclaves.",
    badge: "Financial Aid",
  },
  {
    id: 5,
    name: "Web, Media & Public Relations",
    link: "/wing/pr",
    icon: FiRadio,
    desc: "Maintains official digital platforms, coordinates broadcast communications, media coverage, and council branding.",
    badge: "Media & Tech",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" },
  },
};

const Wings = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-12 text-slate-900 bg-[#F8FAFC]">
      <div className="max-w-[1280px] mx-auto">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="academic-badge mb-3">Council Governance</span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-950 tracking-tight">
            Operational Wings
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-3 leading-relaxed">
            The Academic &amp; Career Council operates through five specialized wings, each responsible for delivering targeted academic, professional, and research support.
          </p>
        </div>

        {/* Wings Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {wingsData.map((item) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.id}
                onClick={() => navigate(item.link)}
                variants={cardVariants}
                className="academic-card rounded-xl p-6 sm:p-7 flex flex-col justify-between cursor-pointer hover:-translate-y-1 group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-11 h-11 rounded-lg bg-slate-100 group-hover:bg-slate-900 group-hover:text-white text-slate-800 flex items-center justify-center transition-colors">
                      <Icon className="text-xl" />
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {item.badge}
                    </span>
                  </div>

                  <h2 className="text-lg font-bold text-slate-950 mb-2 group-hover:text-blue-700 transition-colors">
                    {item.name}
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                    {item.desc}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-900 group-hover:text-blue-700">
                  <span>View Wing Mandate &amp; Team</span>
                  <FiArrowRight className="text-sm transition-transform group-hover:translate-x-1" />
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

