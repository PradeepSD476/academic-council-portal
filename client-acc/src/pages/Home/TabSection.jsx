import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiCheckCircle } from "react-icons/fi";

const tabData = {
  academics: {
    title: "Academics",
    tagline: "Structured Curriculum & Peer Guidance",
    text: "Our Academic Wing provides guidance on course selection, academic planning, and study strategies to help students achieve excellence in their coursework. From peer mentoring to subject-specific workshops, we ensure that every student receives timely academic support.",
    image: "/academics-tab.webp",
    metrics: ["1-on-1 Mentorship", "Curriculum Roadmaps", "Exam Prep Series"],
  },
  workshops: {
    title: "Workshops & Bootcamps",
    tagline: "Hands-on Technical & Career Bootcamps",
    text: "We conduct hands-on workshops and expert sessions designed to enhance students’ technical, analytical, and communication skills. These sessions bridge the gap between academic learning and practical implementation, preparing students for research and industry.",
    image: "/workshop-tab.JPEG",
    metrics: ["Hands-on Coding Labs", "Industry Masterclasses", "Skill Sprints"],
  },
  research: {
    title: "Research & Internships",
    tagline: "Incubating High-Impact Publications & Grants",
    text: "Our Research & Internship Wing assists students in exploring research opportunities, internships, and global collaborations. From proposal drafting to publication support, we aim to nurture a strong research culture at IIT Patna.",
    image: "/research-tab.jpeg",
    metrics: ["Global Research Grants", "Paper Reviews", "Internship Drives"],
  },
};

const TabSection = () => {
  const [activeTab, setActiveTab] = useState("academics");

  return (
    <div className="py-12 bg-white border-y border-slate-200">
      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-12">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="academic-badge mb-3">Core Pillars</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
            Key Academic Initiatives
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Explore how the council delivers structured support across teaching, industry workshops, and scholarly research.
          </p>
        </div>

        {/* Clean Segmented Tab Bar */}
        <div className="flex justify-center mb-8">
          <div className="p-1 bg-slate-100 border border-slate-200 rounded-lg inline-flex gap-1 max-w-full overflow-x-auto">
            {Object.keys(tabData).map((key) => {
              const isActive = activeTab === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`px-4 py-2 rounded-md text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? "bg-white text-slate-950 shadow-xs border border-slate-200"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {tabData[key].title}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="academic-card rounded-2xl p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-8"
          >
            <div className="md:w-1/2 space-y-4">
              <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider bg-blue-50 px-2.5 py-1 rounded">
                {tabData[activeTab].tagline}
              </span>

              <h3 className="text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight">
                {tabData[activeTab].title}
              </h3>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                {tabData[activeTab].text}
              </p>

              {/* Metric feature pills */}
              <div className="pt-3 flex flex-wrap gap-2">
                {tabData[activeTab].metrics.map((item, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-md bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 flex items-center gap-1.5"
                  >
                    <FiCheckCircle className="text-blue-600 text-xs" />
                    <span>{item}</span>
                  </span>
                ))}
              </div>
            </div>

            <div className="md:w-1/2 w-full flex justify-center">
              <div className="overflow-hidden rounded-xl border border-slate-200 w-full max-h-[300px] shadow-xs">
                <img
                  src={tabData[activeTab].image}
                  alt={tabData[activeTab].title}
                  className="w-full h-full object-cover max-h-[300px]"
                />
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </section>
    </div>
  );
};

export default TabSection;

