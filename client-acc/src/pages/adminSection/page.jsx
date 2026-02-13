import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";

import adminDetails from "./administrators.jsx";

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" }
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const PersonCard = ({ person, color }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLockedOpen, setIsLockedOpen] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (cardRef.current && !cardRef.current.contains(event.target)) {
        setIsFlipped(false);
        setIsLockedOpen(false);
      }
    };
    if (isLockedOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isLockedOpen]);

  const handleHoverStart = () => { if (!isLockedOpen) setIsFlipped(true); };
  const handleHoverEnd = () => { if (!isLockedOpen) setIsFlipped(false); };
  const handleTap = () => {
    const next = !isLockedOpen;
    setIsLockedOpen(next);
    setIsFlipped(next);
  };

  return (
    <motion.div
      ref={cardRef}
      variants={cardVariants}
      className="w-64 h-80 cursor-pointer"
      style={{ perspective: '1000px' }}
    >
      <motion.div
        className="relative w-full h-full [transform-style:preserve-3d] shadow-xl rounded-xl"
        onHoverStart={handleHoverStart}
        onHoverEnd={handleHoverEnd}
        onTap={handleTap}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      >
        {/* Front */}
        <div
          className="absolute w-full h-full rounded-xl overflow-hidden [backface-visibility:hidden]"
          style={{ backgroundColor: color }}
        >
          <img
            src={person.profile}
            alt={person.name}
            className="w-full h-2/3 object-cover [mask-image:linear-gradient(to_bottom,black_85%,transparent_100%)]"
          />
          <div className="p-5">
            <h4 className="text-xl font-bold text-gray-900 truncate">
              {person.name}
            </h4>
            <span className="text-md text-gray-700 truncate">
              {person.subtitle}
            </span>
          </div>
        </div>

        {/* Back */}
        <div
          className="absolute w-full h-full rounded-xl p-6 [transform:rotateY(180deg)] [backface-visibility:hidden] flex flex-col space-y-4"
          style={{ backgroundColor: color }}
        >
          <p className="text-sm text-gray-800 h-2/5 overflow-y-auto">
            {person.description}
          </p>

          <div>
            <h5 className="text-lg font-semibold text-gray-900 mb-3">
              Connect now:
            </h5>
            <ul className="space-y-2.5">
              {person.phone && (
                <li className="flex items-center space-x-3">
                  <span className="text-xl w-5 text-center">📞</span>
                  <span className="text-sm text-gray-700">{person.phone}</span>
                </li>
              )}
              {person.email && (
                <li className="flex items-center space-x-3">
                  <span className="text-xl w-5 text-center">✉️</span>
                  <a
                    href={`mailto:${person.email}`}
                    className="text-sm text-gray-700 hover:underline truncate"
                  >
                    {person.email}
                  </a>
                </li>
              )}
              {person.linkedin && (
                <li className="flex items-center space-x-3">
                  <span className="text-xl w-5 text-center">🔗</span>
                  <a
                    href={`https://www.linkedin.com/in/${person.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-700 hover:underline"
                  >
                    LinkedIn
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const AdminTeam = () => {
  const currentData = adminDetails;

  return (
    <div className="mt-6 bg-gray-50 min-h-screen">
      <section className="max-w-7xl mx-auto px-6 py-16">

        {/* Header */}
        <AnimatePresence>
          <motion.section
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4, ease: "circOut" }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-4">
              {currentData.title}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {currentData.description}
            </p>
          </motion.section>
        </AnimatePresence>

        {/* Team */}
        {(currentData.team || []).map((wing) => (
          <div key={wing.wingname} className="mb-20">
            <h3 className="text-2xl md:text-3xl font-extrabold text-gray-800 mb-10 text-center uppercase tracking-widest">
              {wing.wingname}
            </h3>

            <motion.div
              className="flex flex-wrap justify-center gap-10"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
            >
              {(wing.wingpeople || []).map((person, index) => (
                <PersonCard
                  key={`${person.name}-${index}`}
                  person={person}
                  color={wing.wingcolor}
                />
              ))}
            </motion.div>
          </div>
        ))}

      </section>
    </div>
  );
};

export default AdminTeam;
