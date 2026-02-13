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
    title: "Academic Wing",
    subtitle: "Guiding Students Towards Academic Excellence",
    description:
      "Develop and regularly update academic resources (Notes,Slides,Manuals,Reports),Publish reviews and guides,Promote awareness of policies,and analyze existing practices to recommened meaningful improvements.",
    image: "/images/academic_mentorship.png",
    buttonText: "Meet Our Team",
    buttonLink: "/team",
  },

  "career-development": {
    title: "Career Development Wing",
    subtitle: "Shaping Your Career Path with Confidence",
    description:
      "Career guidance, Skill-building Workshops,Internship preparation,Placement training programs,Mentorship and Networking Opportunities with alumni and professionals.",
    image: "/images/career_development.png",
    buttonText: "Meet Our Team",
    buttonLink: "/team",
  },

  "research": {
    title: "Research Wing",
    subtitle: "Igniting Curiosity, Inspiring Innovation",
    description:
      "Enhance student involvement in Academic and Industrial Research,conduct workshops,provide research mentorships,Facilitate departments in organizing industrial or lab visits.",
    image: "/images/research.png",
    buttonText: "Meet Our Team",
    buttonLink: "/team",
  },

  "finance": {
    title: "Finance Wing",
    subtitle: "Bridging Talent with Opportunities",
    description:
      "Bring Strategic Sponsorships,Manage Finance efficiently for smooth conduct of events under ACC",
    image: "/images/placement.png",
    buttonText: "Meet Our Team",
    buttonLink: "/team",
  },

  "pr": {
    title: "Web,Media and Publicity Wing",
    subtitle: "Building Bridges Beyond Campus",
    description:
      "Develop and maintain the online presence of IIT Patna and the Academic and Career Council through the ACC website and social media platforms,manage communication and outreachs,promote events,workshops, and initiatives, and create engaging content such as campus story videos,lab highlights,and research facility,updates to ensure strong visibility and engagement.",
    image: "/images/pr.png",
    buttonText: "Meet Our Team",
    buttonLink: "/team",
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
            to={heroData.buttonLink}
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
      {/* <SuccessStories /> */}

      <FAQs />
    </div>
  );
};

export default  WingPage;
