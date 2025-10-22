import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FaArrowRight } from "react-icons/fa";
import logo from "/hero.png"; // replace with actual logo

const wingsData = [
  { id: 1, name: "Academic Mentorship Wing", link: "/wing/academic-mentorship" },
  { id: 2, name: "Career Development Wing", link: "/wing/career-development" },
  { id: 3, name: "Research and Development Wing", link: "/wing/research" },
  { id: 4, name: "Placement Cell", link: "/wing/placement" },
  { id: 5, name: "Internship Cell", link: "/wing/internship" },
  { id: 6, name: "Alumni Relations Wing", link: "/wing/alumni" },
  { id: 7, name: "Public Relations & Outreach Wing", link: "/wing/pr" },
];

const MotionLink = motion(Link); // ✅ create motion-wrapped Link

const Wings = () => {
  return (
    <div className="bg-gray-50">
      {/* Header Section */}
      <div className="text-white py-12 px-6 text-center">
        <MotionLink
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          to="/wings"
          className="inline-block text-sm md:text-lg font-semibold uppercase tracking-widest bg-gradient-to-r from-blue-700 to-blue-500 px-4 md:px-6 py-2 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
        >
          Core Structure of the ACC Team
        </MotionLink>
      </div>
    </div>
  );
};

export default Wings;
