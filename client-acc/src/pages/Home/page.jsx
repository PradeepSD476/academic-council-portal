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
import ChatbotButton from "../../components/chatbot/ChatbotButton";


const Home = () => {
  const [activeTab, setActiveTab] = useState("academics");

  return (
    <div className="mt-6 bg-gray-50">
      <motion.section
  initial={{ opacity: 0, y: -30 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.8 }}
  className="relative w-full min-h-[90vh] flex items-center justify-center px-6 md:px-16"
>
  {/* Background Image */}
  <div
    className="absolute inset-0 bg-cover bg-center"
    style={{ backgroundImage: "url('/Home.webp')" }}
  />

  {/* Dark Overlay */}
  <div className="absolute inset-0 bg-black/60" />

  {/* Content */}
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.9 }}
    className="relative z-10 max-w-4xl text-center space-y-6"
  >
    <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-white leading-tight">
      ACADEMICS AND <br className="hidden sm:block" /> CAREER COUNCIL
      <br />
      IIT PATNA
    </h1>

    <p className="text-gray-200 text-sm sm:text-lg md:text-xl leading-relaxed max-w-3xl mx-auto">
      Under the Students' Gymkhana, we are dedicated to empowering students
      with all their academic, research, and career needs. Whether you are
      an undergraduate or postgraduate student, we are here to assist you
      in achieving your goals.
    </p>

    <Link
      to="/wings"
      className="inline-flex items-center gap-2 px-8 py-3 bg-white text-black font-semibold rounded-full shadow-lg hover:bg-gray-200 transition duration-300"
    >
      Explore
      <FaArrowRight className="text-sm mt-0.5" />
    </Link>
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
      <ChatbotButton />
    </div>
  );
};

export default Home;
