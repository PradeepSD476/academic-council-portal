import React, { useState } from "react";
import { motion } from "framer-motion";
import hero from "/hero.png";

const tabData = {
  academics: {
    title: "Academics",
    text: "Our Academic Wing provides guidance on course selection, academic planning, and study strategies to help students achieve excellence in their coursework. From peer mentoring to subject-specific workshops, we ensure that every student receives the right academic support at the right time.",
    color: "#FFDD80",
  },
  workshops: {
    title: "Workshops",
    text: "We conduct hands-on workshops and expert sessions designed to enhance students’ technical, analytical, and communication skills. These sessions bridge the gap between academic learning and practical implementation, preparing students for professional success.",
    color: "#C8BBFF",
  },
  research: {
    title: "Research & Internships",
    text: "Our Research & Internship Wing assists students in exploring research opportunities, internships, and collaborations. From proposal drafting to publication support, we aim to nurture a strong research culture at IIT Patna.",
    color: "#A7E8BD",
  },
};

const TabSection = () => {
  const [activeTab, setActiveTab] = useState("academics");

  return (
    <>
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="px-4 sm:px-8 md:px-16 py-12 m-4 sm:m-6 rounded-2xl bg-white shadow-lg"
      >
        {/* Tabs */}
        <div className="flex overflow-x-auto justify-start md:justify-center gap-6 sm:gap-10 md:gap-20 mb-10 border-b border-gray-300 pb-2 scrollbar-hide">
          {Object.keys(tabData).map((key) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`whitespace-nowrap pb-2 text-base sm:text-lg font-medium transition-all ${
                activeTab === key
                  ? "border-b-4 border-blue-600 text-blue-700"
                  : "text-gray-600 hover:text-black"
              }`}
            >
              {tabData[key].title}
            </button>
          ))}
        </div>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row items-center justify-between gap-8 sm:gap-10 p-6 sm:p-8 rounded-xl"
          style={{ backgroundColor: tabData[activeTab].color }}
        >
          <div className="md:w-1/2 space-y-4 sm:space-y-6 text-center md:text-left">
            <h3 className="text-2xl sm:text-3xl font-semibold text-black">
              {tabData[activeTab].title}
            </h3>
            <p className="text-gray-800 text-base sm:text-lg leading-relaxed">
              {tabData[activeTab].text}
            </p>
          </div>

          <div className="md:w-1/2 flex justify-center">
            <img
              src={hero}
              alt={tabData[activeTab].title}
              className="w-3/4 sm:w-full max-w-xs sm:max-w-md md:max-w-lg object-contain"
            />
          </div>
        </motion.div>
      </motion.section>
    </>
  );
};

export default TabSection;
