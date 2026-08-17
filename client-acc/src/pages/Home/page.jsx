import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FaArrowRight } from "react-icons/fa";
import Wings from "./Wings";
import FAQs from "./FAQs";
import PastEvents from "./PastEvents";
import SuccessStories from "./SuccessStories";
import TabSection from "./TabSection";
import ChatbotButton from "../../components/chatbot/ChatbotButton";

const Home = () => {
  return (
    <div className="min-h-screen text-slate-900 overflow-hidden relative">
      {/* ─── Hero Section ────────────────────────────────────────── */}
      <section className="relative w-full min-h-[92vh] flex flex-col justify-between overflow-hidden bg-slate-950">
        {/* Background Image spanning entire Hero */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/Home.webp')" }}
        />

        {/* Dark semi-transparent overlay below hero text & above background image */}
        <div className="absolute inset-0 bg-slate-950/65 backdrop-blur-[1px]" />

        {/* Ambient background light gradients for rich depth */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[var(--color-secondary)]/25 rounded-full blur-3xl pointer-events-none animate-ambient-pulse" />
        <div className="absolute top-1/3 -right-20 w-[30rem] h-[30rem] bg-[var(--color-primary-accent)]/25 rounded-full blur-3xl pointer-events-none animate-ambient-pulse" />
        <div className="absolute bottom-10 left-1/4 w-80 h-80 bg-[var(--color-primary-accent)]/45 rounded-full blur-3xl pointer-events-none" />

        {/* Hero Content Area */}
        <div className="relative z-10 max-w-[1280px] w-full mx-auto px-6 md:px-16 pt-24 md:pt-36 pb-14 flex flex-col justify-between flex-1">
          {/* Top block: Headline on Left, Description on Right */}
          <div className="flex flex-col lg:flex-row items-start justify-between gap-10 lg:gap-16">
            {/* Left — Headline using Google Font Elsie */}
            <motion.div
              initial={{ opacity: 0, y: 35 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="flex-1 max-w-2xl"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#050B17]/70 border border-white/20 text-white text-xs font-black uppercase tracking-wider mb-6 shadow-sm backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-[var(--color-secondary)] animate-pulse shadow-[0_0_8px_var(--color-secondary)]" />
                Students' Gymkhana · IIT Patna
              </div>

              <h1 className="font-elsie font-black text-[clamp(44px,6.8vw,86px)] leading-[1.04] tracking-[-0.02em] text-white drop-shadow-md">
                Academic and
                <br />
                <span className="bg-gradient-to-r from-[var(--color-secondary)] via-[#FCE7F3] to-[#93C5FD] bg-clip-text text-transparent drop-shadow-sm">
                  Career Council
                </span>
                <br />
                IIT Patna
              </h1>
            </motion.div>

            {/* Right — Description with animated Accent bar */}
            <motion.div
              initial={{ opacity: 0, y: 35 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="flex gap-5 max-w-lg lg:pt-14"
            >
              {/* Glowing accent bar */}
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: "auto" }}
                transition={{ duration: 0.8, delay: 0.25 }}
                className="w-[4.5px] bg-gradient-to-b from-[var(--color-secondary)] via-[#FCE7F3] to-[var(--color-primary-accent)] shrink-0 self-stretch rounded-full shadow-[0_0_15px_var(--color-secondary)]"
              />

              <p className="text-[16px] sm:text-[17px] md:text-[18px] text-slate-200 font-normal leading-[1.8] drop-shadow-sm">
                Under the Students' Gymkhana, we are dedicated to empowering
                students with all their academic, research, and career needs.
                Whether you are an undergraduate or postgraduate student, we
                are here to assist you in achieving your goals.
              </p>
            </motion.div>
          </div>

          {/* Prominent & Hierarchical CTAs below the Hero text */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="mt-14 md:mt-18 pt-8 border-t border-white/15 flex flex-col sm:flex-row items-stretch sm:items-center justify-start gap-4 sm:gap-6"
          >
            {/* Primary CTA — Go to Dashboard */}
            <Link
              to="/login"
              className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-primary-accent)] to-[#0284C7] hover:from-[var(--color-primary-accent)] hover:to-[var(--color-secondary)] text-white font-bold text-[15px] sm:text-base rounded-full shadow-[0_10px_30px_rgba(11,30,63,0.35)] hover:shadow-[0_15px_40px_var(--color-secondary-glow)] transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.98] cursor-pointer border border-white/20"
            >
              <span>Go to Dashboard</span>
              <FaArrowRight className="text-xs group-hover:translate-x-1.5 transition-transform duration-200" />
            </Link>

            {/* Secondary CTA — Explore Team */}
            <Link
              to="/team"
              className="group inline-flex items-center justify-center gap-3 px-7 py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 text-white font-semibold text-[15px] sm:text-base rounded-full backdrop-blur-md transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <span>Explore Team</span>
              <span className="w-6 h-6 rounded-full bg-white/20 border border-white/30 text-white flex items-center justify-center text-xs group-hover:bg-[#0284C7] group-hover:border-cyan-400 group-hover:text-white group-hover:rotate-45 transition-all duration-300">
                ↗
              </span>
            </Link>
          </motion.div>
        </div>

        {/* Subtle bottom fade transition into light off-white #F8FAFC */}
        <div className="relative z-10 h-16 pointer-events-none bg-gradient-to-t from-[var(--color-canvas)] via-[var(--color-canvas)]/60 to-transparent" />
      </section>

      {/* ─── Wings Link Pill ────────────────────────────────────── */}
      <Wings />

      {/* ─── Mission Section ─────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-[1280px] mx-auto px-6 md:px-16 py-10 relative"
      >
        <div className="bg-gradient-to-br from-white/95 via-sky-50/50 to-blue-50/60 backdrop-blur-2xl border-2 border-[var(--color-secondary)]/50 hover:border-[var(--color-secondary)] rounded-[2.5rem] p-8 sm:p-12 md:p-14 flex flex-col md:flex-row items-center gap-10 md:gap-14 shadow-[0_16px_45px_var(--color-secondary-glow)] hover:shadow-[0_24px_60px_var(--color-secondary-glow)] transition-all duration-500 group relative overflow-hidden">
          {/* Ambient flowing aurora glow — Electric Azure (Permanent) */}
          <div className="absolute -top-16 -left-16 w-96 h-96 bg-gradient-to-br from-[var(--color-secondary)]/45 via-[var(--color-secondary-soft)]/30 to-transparent rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform duration-700" />
          
          {/* Organic Illustration Showcase with Floating Glow Pedestal */}
          <div className="md:w-5/12 flex justify-center relative z-10">
            <div className="relative w-full max-w-[340px] flex items-center justify-center p-6">
              {/* Luminous aura behind illustration (Permanent) */}
              <div className="absolute inset-2 rounded-full bg-gradient-to-tr from-[var(--color-secondary)]/40 via-[var(--color-secondary-soft)]/30 to-transparent blur-2xl group-hover:blur-3xl transition-all duration-500 pointer-events-none" />
              
              <img
                src="/hero.png"
                alt="Our Mission"
                className="w-full max-w-[280px] sm:max-w-[300px] object-contain relative z-10 drop-shadow-[0_15px_30px_rgba(11,30,63,0.15)] group-hover:scale-105 transition-transform duration-500"
              />

              {/* Floating Status Capsule */}
              <div className="absolute -bottom-1 sm:bottom-1 px-4 py-1.5 bg-white/95 backdrop-blur-xl rounded-full border-2 border-[var(--color-secondary)]/80 shadow-[0_4px_20px_var(--color-secondary-glow)] flex items-center gap-2.5 z-20">
                <span className="w-2 h-2 rounded-full bg-[var(--color-secondary)] shadow-[0_0_8px_var(--color-secondary)] animate-pulse" />
                <span className="text-[11px] font-black uppercase text-[var(--color-primary)] tracking-wider">Empowering Growth</span>
              </div>
            </div>
          </div>

          <div className="md:w-7/12 space-y-6 relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-100 text-[#0369A1] shadow-sm border border-sky-300">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-secondary)]" />
              <span className="text-xs font-black uppercase tracking-widest">01 · Foundation</span>
            </div>

            <h2 className="text-3xl md:text-5xl font-black text-[var(--color-primary)] tracking-tight leading-tight">
              Pioneering Academic &amp; Career Leadership
            </h2>

            <p className="text-[16px] sm:text-[18px] text-slate-700 leading-[1.85] font-normal">
              Our mission is to create an ecosystem where every student can
              identify their potential and pursue excellence in academics,
              research, and professional growth through mentorship,
              collaboration, and continuous learning.
            </p>

            <div className="pt-2 flex flex-wrap gap-3">
              {["Mentorship & Guidance", "Research Incubation", "Career Pathways"].map((tag, i) => (
                <span 
                  key={i} 
                  className="px-4 py-2 rounded-full bg-sky-50/90 hover:bg-sky-100 border border-sky-200/90 text-xs sm:text-sm font-bold text-[#0369A1] shadow-xs transition-all flex items-center gap-2 cursor-default"
                >
                  <span className="text-[var(--color-secondary)] font-black">✓</span>
                  <span>{tag}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* ─── Vision Section ──────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-[1280px] mx-auto px-6 md:px-16 py-6 relative"
      >
        <div className="bg-gradient-to-bl from-white/95 via-blue-50/50 to-indigo-50/60 backdrop-blur-2xl border-2 border-blue-300/60 hover:border-blue-400 rounded-[2.5rem] p-8 sm:p-12 md:p-14 flex flex-col md:flex-row-reverse items-center gap-10 md:gap-14 shadow-[0_16px_45px_rgba(19,62,135,0.14)] hover:shadow-[0_24px_60px_rgba(19,62,135,0.25)] transition-all duration-500 group relative overflow-hidden">
          {/* Ambient flowing aurora glow — Deep Blue (Permanent) */}
          <div className="absolute -bottom-16 -right-16 w-96 h-96 bg-gradient-to-tl from-[#133E87]/35 via-[#1E40AF]/25 to-transparent rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform duration-700" />

          {/* Organic Illustration Showcase with Floating Glow Pedestal */}
          <div className="md:w-5/12 flex justify-center relative z-10">
            <div className="relative w-full max-w-[340px] flex items-center justify-center p-6">
              {/* Luminous aura behind illustration (Permanent) */}
              <div className="absolute inset-2 rounded-full bg-gradient-to-bl from-[var(--color-primary-accent)]/35 via-[var(--color-secondary)]/30 to-transparent blur-2xl group-hover:blur-3xl transition-all duration-500 pointer-events-none" />

              <img
                src="/hero.png"
                alt="Our Vision"
                className="w-full max-w-[280px] sm:max-w-[300px] object-contain relative z-10 drop-shadow-[0_15px_30px_rgba(11,30,63,0.15)] group-hover:scale-105 transition-transform duration-500"
              />

              {/* Floating Status Capsule */}
              <div className="absolute -bottom-1 sm:bottom-1 px-4 py-1.5 bg-white/95 backdrop-blur-xl rounded-full border-2 border-blue-300/80 shadow-[0_4px_20px_rgba(19,62,135,0.35)] flex items-center gap-2.5 z-20">
                <span className="w-2 h-2 rounded-full bg-[var(--color-primary-accent)] shadow-[0_0_8px_var(--color-primary-accent)] animate-pulse" />
                <span className="text-[11px] font-black uppercase text-[var(--color-primary)] tracking-wider">Future Ready</span>
              </div>
            </div>
          </div>

          <div className="md:w-7/12 space-y-6 relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 text-blue-900 shadow-sm border border-blue-300">
              <span className="w-1.5 h-1.5 rounded-full bg-[#133E87]" />
              <span className="text-xs font-black uppercase tracking-widest">02 · Horizon</span>
            </div>

            <h2 className="text-3xl md:text-5xl font-black text-[#0B1E3F] tracking-tight leading-tight">
              Shaping Global Thinkers &amp; Innovators
            </h2>

            <p className="text-[16px] sm:text-[18px] text-slate-700 leading-[1.85] font-normal">
              We envision IIT Patna as a hub of academic excellence,
              innovation, and professional growth — where students evolve into
              leaders, researchers, and global contributors through continuous
              learning and collaboration.
            </p>

            <div className="pt-2 flex flex-wrap gap-3">
              {["Global Network", "Industry Connect", "Continuous Excellence"].map((tag, i) => (
                <span 
                  key={i} 
                  className="px-4 py-2 rounded-full bg-blue-50/90 hover:bg-blue-100 border border-blue-200/90 text-xs sm:text-sm font-bold text-blue-950 shadow-xs transition-all flex items-center gap-2 cursor-default"
                >
                  <span className="text-[#133E87] font-black">✦</span>
                  <span>{tag}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* ─── Remaining Sections ───────────────────────────────────── */}
      <TabSection />
      <PastEvents />
      <SuccessStories />
      <FAQs />
      <ChatbotButton />
    </div>
  );
};

export default Home;
