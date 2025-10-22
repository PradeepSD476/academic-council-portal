import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FaArrowRight } from "react-icons/fa";
import hero from "/hero.png";
import Wings from "./Wings";
import FAQs from "./FAQs";
import PastEvents from "./PastEvents";
import SuccessStories from "./SuccessStories";
import TabSection from "./TabSection";


const Home = () => {
  const [activeTab, setActiveTab] = useState("academics");

  return (
    <div className="mt-6 bg-gray-50">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="bg-gray-100 px-8 md:px-16 py-20 flex flex-col md:flex-row items-center justify-between gap-10"
      >
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="md:w-1/2 space-y-6 text-center md:text-left"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-black leading-tight">
            ACADEMICS AND <br /> CAREER COUNCIL, IIT PATNA
          </h1>
          <p className="text-gray-700 text-lg leading-relaxed">
            Under the Student's Gymkhana, we are dedicated to empowering
            students with all their academic, research, and career needs.
            Whether you are an undergraduate or postgraduate student, we are
            here to assist you in achieving your goals.
          </p>
          <Link
            to="/about"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-900 text-white font-semibold rounded-3xl shadow-md transition duration-300"
          >
            Explore
            <FaArrowRight className="text-white text-sm mt-0.5" />
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="md:w-1/2 flex justify-center"
        >
          <img
            src={hero}
            alt="hero"
            className="w-full max-w-md md:max-w-lg object-contain"
          />
        </motion.div>
      </motion.section>

      <Wings/>

      {/* Mission Section */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="bg-[#FFDD80] m-6 rounded-2xl px-8 md:px-16 py-16 flex flex-col md:flex-row items-center justify-between gap-10"
      >
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          className="md:w-1/2 flex justify-center"
        >
          <img src={hero} alt="mission" className="w-full max-w-md md:max-w-lg" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          className="md:w-1/2 space-y-6 text-center md:text-left"
        >
          <h1 className="text-4xl font-bold text-black leading-tight">
            OUR MISSION
          </h1>
          <p className="text-gray-700 text-lg leading-relaxed">
            Our mission is to create an ecosystem where every student can
            identify their potential and pursue excellence in academics,
            research, and professional growth through mentorship, collaboration,
            and continuous learning.
          </p>
        </motion.div>
      </motion.section>

      {/* Vision Section */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="bg-[#C8BBFF] m-6 rounded-2xl px-8 md:px-16 py-16 flex flex-col md:flex-row items-center justify-between gap-10"
      >
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          className="md:w-1/2 space-y-6 text-center md:text-left"
        >
          <h1 className="text-4xl font-bold text-black leading-tight">
            OUR VISION
          </h1>
          <p className="text-gray-700 text-lg leading-relaxed">
            We envision IIT Patna as a hub of academic excellence, innovation,
            and professional growth — where students evolve into leaders,
            researchers, and global contributors through continuous learning and
            collaboration.
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          className="md:w-1/2 flex justify-center"
        >
          <img src={hero} alt="vision" className="w-full max-w-md md:max-w-lg" />
        </motion.div>
      </motion.section>
      <TabSection/>
      <PastEvents />
      <SuccessStories/>

      <FAQs/>
    </div>
  );
};

export default Home;
