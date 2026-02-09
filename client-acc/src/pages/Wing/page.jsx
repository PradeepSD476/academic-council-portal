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

// WingHeroData.jsx

export const wingHeroData = {
  "academic-mentorship": {
    title: "Academic Mentorship Wing",
    subtitle: "Guiding Students Towards Academic Excellence",
    description:
      "The Academic Mentorship Wing provides structured mentorship to help students excel in academics, manage stress, and develop strong study habits.",
    image: "/images/academic_mentorship.png",
    buttonText: "Meet Our Mentors",
    buttonLink: "/wing/academic-mentorship/team",
  },

  "career-development": {
    title: "Career Development Wing",
    subtitle: "Shaping Your Career Path with Confidence",
    description:
      "Our mission is to empower students with essential skills for professional success through resume workshops, mock interviews, and career talks.",
    image: "/images/career_development.png",
    buttonText: "Explore Programs",
    buttonLink: "/wing/career-development/events",
  },

  "research": {
    title: "Research and Development Wing",
    subtitle: "Igniting Curiosity, Inspiring Innovation",
    description:
      "We foster a strong research culture by connecting students with professors, facilitating research projects, and organizing symposiums.",
    image: "/images/research.png",
    buttonText: "Join Our Research Initiatives",
    buttonLink: "/wing/research/projects",
  },

  "placement": {
    title: "Placement Cell",
    subtitle: "Bridging Talent with Opportunities",
    description:
      "We guide students through placement drives, organize skill-building sessions, and help them secure top roles at leading companies worldwide.",
    image: "/images/placement.png",
    buttonText: "View Placement Stats",
    buttonLink: "/wing/placement/stats",
  },

  "internship": {
    title: "Internship Cell",
    subtitle: "Your Gateway to Real-World Experience",
    description:
      "The Internship Cell helps students secure internships across industries, ensuring early exposure to real-world problem-solving and work culture.",
    image: "/images/internship.png",
    buttonText: "Find Internships",
    buttonLink: "/wing/internship/openings",
  },

  "alumni": {
    title: "Alumni Relations Wing",
    subtitle: "Connecting Past, Present, and Future",
    description:
      "We build bridges between current students and alumni through mentorship programs, reunions, and professional networking opportunities.",
    image: "/images/alumni.png",
    buttonText: "Connect with Alumni",
    buttonLink: "/wing/alumni/network",
  },

  "pr": {
    title: "Public Relations & Outreach Wing",
    subtitle: "Building Bridges Beyond Campus",
    description:
      "From handling media relations to event coverage, the PR & Outreach Wing ensures IIT Patna’s achievements reach the world.",
    image: "/images/pr.png",
    buttonText: "View Campaigns",
    buttonLink: "/wing/pr/campaigns",
  },
};



const WingPage = () => {
  const { wingId } = useParams();
  const heroData = wingHeroData[wingId]
  if(!heroData){
    return <div className="mt-10 text-center text-2xl font-bold">Wing Not Found</div>
  }
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
            {heroData.title}
          </h1>
          <p className="text-gray-700 text-lg leading-relaxed">
            {heroData.description}
          </p>
          <Link
            to="/about"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-900 text-white font-semibold rounded-3xl shadow-md transition duration-300"
          >
            {heroData.buttonText}
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

      {/* Past Events Section */}
      <PastEvents />
      {/* Resources Page */}
      <ResourcesPage />
      {/* Resources Section */}
      <SuccessStories />

      <FAQs />
    </div>
  );
};

export default  WingPage;
