import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";

// Import your new data sources
import accDetails from "./acc_team";
import adminDetails from "./administrators";

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
    const newLockState = !isLockedOpen;
    setIsLockedOpen(newLockState);
    setIsFlipped(newLockState);
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
        {/* Front Side */}
        <div className="absolute w-full h-full rounded-xl overflow-hidden [backface-visibility:hidden]" style={{ backgroundColor: color }}>
          <img
            src={person.profile}
            alt={person.name}
            className="w-full h-2/3 object-cover [mask-image:linear-gradient(to_bottom,black_85%,transparent_100%)]"
          />
          <div className="p-5">
            <h4 className="text-xl font-bold text-gray-900 truncate">{person.name}</h4>
            <span className="text-md text-gray-700 truncate">{person.subtitle}</span>
          </div>
        </div>

        {/* Back Side */}
        <div className="absolute w-full h-full rounded-xl p-6 [transform:rotateY(180deg)] [backface-visibility:hidden] flex flex-col space-y-4" style={{ backgroundColor: color }}>
          <p className="text-sm text-gray-800 h-2/5 overflow-y-auto">{person.description}</p>
          <div>
            <h5 className="text-lg font-semibold text-gray-900 mb-3">Connect now:</h5>
            <ul className="space-y-2.5">
              {person.phone && (
                <li className="flex items-center space-x-3">
                  <span className="text-xl w-5 text-center flex-shrink-0">📞</span>
                  <span className="text-sm text-gray-700">{person.phone}</span>
                </li>
              )}
              {person.email && (
                <li className="flex items-center space-x-3">
                  <span className="text-xl w-5 text-center flex-shrink-0">✉️</span>
                  <a href={`mailto:${person.email}`} className="text-sm text-gray-700 hover:underline truncate">{person.email}</a>
                </li>
              )}
              {person.linkedin && (
                <li className="flex items-center space-x-3">
                  <span className="text-xl w-5 text-center flex-shrink-0">🔗</span>
                  <a href={`https://www.linkedin.com/in/${person.linkedin}`} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-700 hover:underline">LinkedIn</a>
                </li>
              )}
            </ul>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const Team = () => {
  const [view, setView] = useState('ACC');
  const currentData = view === 'ACC' ? accDetails : adminDetails;

  return (
    <div className="mt-6 bg-gray-50 min-h-screen">
      <section className="max-w-7xl mx-auto px-6 py-16">
        
        {/* Enhanced Toggle Switch */}
        <div className="flex justify-center mb-16">
          <div className="inline-flex items-center bg-gray-200/80 backdrop-blur-sm p-1.5 rounded-2xl shadow-inner border border-gray-300/50">
            <button
              onClick={() => setView('ACC')}
              className={`relative px-8 py-2.5 text-sm font-bold transition-colors duration-300 cursor-pointer outline-none focus:ring-0
                ${view === 'ACC' ? 'text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {view === 'ACC' && (
                <motion.div
                  layoutId="activePill"
                  className="absolute inset-0 bg-white rounded-xl shadow-md border border-blue-100"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10">ACC Team</span>
            </button>

            <button
              onClick={() => setView('ADMIN')}
              className={`relative px-8 py-2.5 text-sm font-bold transition-colors duration-300 cursor-pointer outline-none focus:ring-0
                ${view === 'ADMIN' ? 'text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {view === 'ADMIN' && (
                <motion.div
                  layoutId="activePill"
                  className="absolute inset-0 bg-white rounded-xl shadow-md border border-blue-100"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10">Academic Administrators</span>
            </button>
          </div>
        </div>

        {/* Dynamic Header */}
        <AnimatePresence mode="wait">
          <motion.section
            key={view}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4, ease: "circOut" }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">
              {currentData?.title}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
              {currentData?.description}
            </p>
          </motion.section>
        </AnimatePresence>

        {/* Dynamic Content Mapping */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={view}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Added fallback to empty array to prevent the .map crash */}
            {(currentData?.team || []).map((wing) => (
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
                      key={`${view}-${person.name}-${index}`} 
                      person={person} 
                      color={wing.wingcolor} 
                    />
                  ))}
                </motion.div>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
        
      </section>
    </div>
  )
}

export default Team;