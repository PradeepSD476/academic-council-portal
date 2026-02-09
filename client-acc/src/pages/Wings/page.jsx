import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FaBook, 
  FaBriefcase, 
  FaFlask, 
  FaGraduationCap, 
  FaLaptopCode, 
  FaUsers, 
  FaBullhorn 
} from 'react-icons/fa';

const wingsData = [
  { id: 1, name: "Academic Mentorship Wing", link: "/wing/academic-mentorship", icon: FaBook },
  { id: 2, name: "Career Development Wing", link: "/wing/career-development", icon: FaBriefcase },
  { id: 3, name: "Research and Development Wing", link: "/wing/research", icon: FaFlask },
  { id: 4, name: "Placement Cell", link: "/wing/placement", icon: FaGraduationCap },
  { id: 5, name: "Internship Cell", link: "/wing/internship", icon: FaLaptopCode },
  { id: 6, name: "Alumni Relations Wing", link: "/wing/alumni", icon: FaUsers },
  { id: 7, name: "Public Relations & Outreach Wing", link: "/wing/pr", icon: FaBullhorn },
];

const colors = [
  "bg-[#9BE6C1]",
  "bg-[#E1A500]",
  "bg-[#FFDD80]",
  "bg-[#9BC9FF]",
  "bg-[#C8BBFF]",
  // "bg-green-400",
  // "bg-blue-400",
  // "bg-yellow-400",
  // "bg-purple-400",
  // "bg-pink-400",
  // "bg-indigo-400",
];

const Wings = () => {
  return (
    <div className="mt-10 bg-gray-50">
      <h1 className="pt-4 pb-4 text-center  text-3xl font-bold">OUR WINGS</h1>
      <div className="flex flex-wrap justify-center gap-4">
        {wingsData.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.id}
              className={`w-[350px] h-[214px] p-5  sm:p-6 my-3 mx-3 flex flex-col justify-center items-center h-[300px] rounded-[900px] text-white ${colors[index % colors.length]}`}
              whileHover={{ y: -7 , boxShadow: "0px 10px 20px rgba(0, 0, 0, 0.2)"}}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <Icon className="text-4xl text-black mb-3" />
              <Link to={item.link} className="text-lg text-black font-semibold hover:underline text-center">
                {item.name}
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default Wings;
