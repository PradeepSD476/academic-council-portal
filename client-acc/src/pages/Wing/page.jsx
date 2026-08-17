import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FaArrowRight } from "react-icons/fa";
import hero from "/hero.png";
import FAQs from "./FAQs";
import PastEvents from "./PastEvents";
import SuccessStories from "./SuccessStories";
import { useParams } from "react-router-dom";
import ResourcesPage from "./ResourcesPage";

export const wingHeroData = {
  "academic-mentorship": {
    title: "Academic Mentorship Wing",
    subtitle: "Guiding Students Towards Academic Excellence",
    description:
      "Develop and regularly update academic resources (Notes, Slides, Manuals, Reports), publish reviews and guides, promote awareness of policies, and analyze existing practices to recommend meaningful improvements.",
    image: "/images/academic_mentorship.png",
    buttonText: "Meet Our Team",
    buttonLink: "/team",
  },

  "career-development": {
    title: "Career Development Wing",
    subtitle: "Shaping Your Career Path with Confidence",
    description:
      "Career guidance, skill-building workshops, internship preparation, placement training programs, mentorship, and networking opportunities with alumni and industry professionals.",
    image: "/images/career_development.png",
    buttonText: "Meet Our Team",
    buttonLink: "/team",
  },

  "research": {
    title: "Research Wing",
    subtitle: "Igniting Curiosity, Inspiring Innovation",
    description:
      "Enhance student involvement in academic and industrial research, conduct workshops, provide research mentorships, and facilitate departments in organizing industrial or laboratory visits.",
    image: "/images/research.png",
    buttonText: "Meet Our Team",
    buttonLink: "/team",
  },

  "finance": {
    title: "Finance Wing",
    subtitle: "Bridging Talent with Opportunities",
    description:
      "Secure strategic sponsorships, manage council finances efficiently for smooth execution of events, and manage financial literacy programs under ACC.",
    image: "/images/placement.png",
    buttonText: "Meet Our Team",
    buttonLink: "/team",
  },

  "pr": {
    title: "Web, Media & Publicity Wing",
    subtitle: "Building Bridges Beyond Campus",
    description:
      "Develop and maintain the online presence of IIT Patna and the Academic and Career Council through the ACC website and social media platforms, manage communications, promote initiatives, and create engaging content.",
    image: "/images/pr.png",
    buttonText: "Meet Our Team",
    buttonLink: "/team",
  },
};

const WingPage = () => {
  const { wingId } = useParams();
  const heroData = wingHeroData[wingId];
  
  if (!heroData) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center p-8 bg-white/90 border border-slate-200/80 rounded-3xl shadow-lg">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Wing Not Found</h2>
          <p className="text-slate-600 mb-6">The requested wing division does not exist.</p>
          <Link to="/wings" className="px-6 py-2.5 bg-[#0B1E3F] hover:bg-[#133E87] text-white rounded-full font-semibold text-sm">
            Back to Wings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-900 relative overflow-hidden">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="relative px-8 md:px-16 pt-36 pb-20 flex flex-col md:flex-row items-center justify-between gap-12 border-b border-slate-200/80"
      >
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="md:w-1/2 space-y-6 text-center md:text-left"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] backdrop-blur-md border border-[var(--color-primary)]/20 text-xs font-black uppercase tracking-wider shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[var(--color-secondary)] animate-pulse" />
            {heroData.subtitle}
          </div>

          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="hidden md:block w-[4px] h-12 bg-gradient-to-b from-[var(--color-secondary)] via-[var(--color-primary-accent)] to-[var(--color-primary)] rounded-full shadow-[0_0_8px_var(--color-secondary)] shrink-0" />
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[var(--color-primary)] leading-tight uppercase tracking-tight">
              {heroData.title}
            </h1>
          </div>

          <p className="text-slate-600 text-base sm:text-lg leading-relaxed max-w-xl mx-auto md:mx-0 font-normal">
            {heroData.description}
          </p>

          <Link
            to={heroData.buttonLink}
            className="group inline-flex items-center gap-3 px-8 py-3.5 bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-primary-accent)] to-[var(--color-secondary)] hover:from-[var(--color-primary-accent)] hover:to-[var(--color-secondary-soft)] text-white font-extrabold text-base rounded-full shadow-[0_10px_25px_rgba(11,30,63,0.25)] hover:shadow-[0_15px_35px_var(--color-secondary-glow)] transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.98] mt-4 cursor-pointer border border-white/20"
          >
            <span>{heroData.buttonText}</span>
            <FaArrowRight className="text-sm group-hover:translate-x-1.5 transition-transform duration-200" />
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="md:w-1/2 flex justify-center"
        >
          <div className="relative p-6 sm:p-8 rounded-[2.8rem] bg-gradient-to-tr from-[var(--color-secondary)]/20 via-white/50 to-[var(--color-primary-accent)]/20 border border-slate-200/80 overflow-hidden shadow-2xl backdrop-blur-2xl transition-all duration-500 hover:scale-105">
            <img
              src={hero}
              alt="hero"
              className="w-full max-w-md md:max-w-lg object-contain drop-shadow-[0_15px_35px_rgba(11,30,63,0.12)]"
            />
          </div>
        </motion.div>
      </motion.section>

      {wingId !== "pr" && wingId !== "finance" && (
        <>
          <PastEvents />
          <ResourcesPage />
        </>
      )}

      <FAQs />
    </div>
  );
};

export default WingPage;
