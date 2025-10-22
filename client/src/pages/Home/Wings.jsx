import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FaArrowRight } from "react-icons/fa";
import logo from "/hero.png"; //to be replaced

const wingsData = [
  { id: 1, name: "Academic Mentorship Wing", link: "/wing/academic-mentorship" },
  { id: 2, name: "Career Development Wing", link: "/wing/career-development" },
  { id: 3, name: "Research and Development Wing", link: "/wing/research" },
  { id: 4, name: "Placement Cell", link: "/wing/placement" },
  { id: 5, name: "Internship Cell", link: "/wing/internship" },
  { id: 6, name: "Alumni Relations Wing", link: "/wing/alumni" },
  { id: 7, name: "Public Relations & Outreach Wing", link: "/wing/pr" },
];

const Wings = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className=" text-white py-12 px-6 text-center">
        <motion.span
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-sm md:text-lg font-semibold uppercase tracking-widest bg-linear-to-r from-blue-700 to-blue-500 px-2 md:px-6 py-1 rounded-2xl"
        >
          Core Structure of the ACC Team 
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-3xl md:text-5xl font-bold mt-3 text-black"
        >
          Wings Under the ACC Council
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7 }}
          className="mt-4 text-gray-600 max-w-2xl mx-auto"
        >
          The Academics and Career Council primarily has seven wings to ensure
          efficient operation and holistic development of students.
        </motion.p>
      </div>

      {/* cards  */}
      <div className="py-14 px-6 md:px-16 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {wingsData.map((wing, index) => (
          <motion.div
            key={wing.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="bg-white shadow-lg rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:shadow-xl hover:-translate-y-2 transition-all duration-300"
          >
            <img
              src={logo}
              alt={wing.name}
              className="w-40 h-40 object-contain mb-4"
            />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              {wing.name}
            </h2>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Wings;
