import React, { useContext } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FiArrowRight, FiCheck } from "react-icons/fi";
import AuthContext from "../../context/auth/authContext";
import Wings from "./Wings";
import FAQs from "./FAQs";
import PastEvents from "./PastEvents";
import SuccessStories from "./SuccessStories";
import TabSection from "./TabSection";
import ChatbotButton from "../../components/chatbot/ChatbotButton";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 25 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

const Home = () => {
  const { isAuthenticated, user } = useContext(AuthContext);

  const getDashboardPath = () => {
    if (!isAuthenticated) return "/login";
    if (user?.role === "FACULTY") return "/admin/dashboard";
    return "/dashboard/courses";
  };

  return (
    <div className="min-h-screen text-slate-900 bg-[#F8FAFC]">
      {/* ─── Hero Section with Campus Backdrop & Centered CTAs ────── */}
      <section className="relative w-full min-h-[88vh] lg:min-h-[92vh] flex flex-col justify-center overflow-hidden bg-slate-950 text-white">
        {/* Campus Background Image with Micro Zoom on Entry */}
        <motion.div
          initial={{ scale: 1.08 }}
          animate={{ scale: 1.02 }}
          transition={{ duration: 1.8, ease: "easeOut" }}
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-85 pointer-events-none"
          style={{ backgroundImage: "url('/Home.webp')" }}
        />

        {/* Thin Transparent Dark Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/55 to-slate-950/85 pointer-events-none" />

        {/* Hero Content Area */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative z-10 max-w-[1280px] w-full mx-auto px-4 sm:px-6 lg:px-12 pt-36 sm:pt-44 pb-20 sm:pb-28 flex flex-col justify-center flex-1"
        >
          {/* Top Row: Title on Left, Description on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Column: Prestigious Display Title */}
            <motion.div variants={itemVariants} className="lg:col-span-7 space-y-4">
              <h1 className="font-outfit font-black text-4xl sm:text-6xl lg:text-7xl xl:text-8xl text-white tracking-tight leading-[1.03]">
                Academic &amp;
                <br />
                Career Council
              </h1>
            </motion.div>

            {/* Right Column: Hero Description with Left Accent Border */}
            <motion.div
              variants={itemVariants}
              className="lg:col-span-5 border-l-2 border-blue-500 pl-4 sm:pl-5 flex flex-col justify-center"
            >
              <p className="text-slate-200 text-base sm:text-lg lg:text-xl leading-relaxed font-normal">
                Under the Students' Gymkhana, we are dedicated to empowering students with all their academic, research, and career needs. Whether you are an undergraduate or postgraduate student, we are here to assist you in achieving your goals.
              </p>
            </motion.div>
          </div>

          {/* Centered CTAs: Centered below Title & Description */}
          <motion.div
            variants={itemVariants}
            className="mt-12 sm:mt-16 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6"
          >
            {/* Primary CTA — Go to Dashboard */}
            <motion.div
              whileHover={{ y: -3, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="w-full sm:w-auto"
            >
              <Link
                to={getDashboardPath()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-slate-950 hover:bg-blue-600 hover:text-white font-bold text-sm sm:text-base rounded-xl transition-colors duration-200 shadow-lg hover:shadow-blue-500/25 cursor-pointer group"
              >
                <span>Go to Dashboard</span>
                <div className="w-6 h-6 rounded-full bg-slate-100 group-hover:bg-white/20 text-slate-900 group-hover:text-white flex items-center justify-center transition-colors">
                  <FiArrowRight className="text-xs group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            </motion.div>

            {/* Secondary CTA — Explore Team */}
            <motion.div
              whileHover={{ y: -3, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="w-full sm:w-auto"
            >
              <Link
                to="/team"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-4 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-white font-semibold text-sm sm:text-base rounded-xl transition-colors duration-200 cursor-pointer shadow-md hover:border-slate-500 group"
              >
                <span>Explore Team</span>
                <span className="text-blue-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform font-bold">
                  ↗
                </span>
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* ─── Wings Banner ───────────────────────────────────────── */}
      <Wings />

      {/* ─── Mission & Vision Sections ──────────────────────────── */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-12 pt-10 sm:pt-14 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Mission Card */}
          <div className="academic-card rounded-2xl p-6 sm:p-8 space-y-4">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block">
              Our Mission
            </span>
            <h2 className="text-2xl font-bold text-slate-950 tracking-tight">
              Pioneering Academic &amp; Career Leadership
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Our mission is to create an ecosystem where every student can identify their potential and pursue excellence in academics, research, and professional growth through mentorship, collaboration, and continuous learning.
            </p>
            <div className="pt-2 flex flex-wrap gap-2">
              {["Mentorship & Guidance", "Research Incubation", "Career Pathways"].map((tag, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200 flex items-center gap-1.5"
                >
                  <span className="text-blue-600 font-bold">✓</span>
                  <span>{tag}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Vision Card */}
          <div className="academic-card rounded-2xl p-6 sm:p-8 space-y-4">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block">
              Our Vision
            </span>
            <h2 className="text-2xl font-bold text-slate-950 tracking-tight">
              Shaping Global Thinkers &amp; Innovators
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              We envision IIT Patna as an institutional hub of academic excellence, innovation, and professional growth — where students evolve into leaders, researchers, and global contributors through continuous learning and collaboration.
            </p>
            <div className="pt-2 flex flex-wrap gap-2">
              {["Global Network", "Industry Connect", "Continuous Excellence"].map((tag, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200 flex items-center gap-1.5"
                >
                  <span className="text-blue-600 font-bold">✦</span>
                  <span>{tag}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Focus Areas / Tabs ─────────────────────────────────── */}
      <TabSection />

      {/* ─── Past Events ────────────────────────────────────────── */}
      <PastEvents />

      {/* ─── Success Stories ────────────────────────────────────── */}
      <SuccessStories />

      {/* ─── FAQs ───────────────────────────────────────────────── */}
      <FAQs />

      {/* ─── Floating Chatbot ───────────────────────────────────── */}
      <ChatbotButton />
    </div>
  );
};

export default Home;


