import React, { useState, useRef, useEffect } from 'react'
import { motion } from "framer-motion";

const team = [
  {
    wingname: "Wing 1",
    wingcolor: "#FFDD80",
    wingpeople: [
      {
        name: "Longname person",
        subtitle: "Subtitle if any",
        description: "Hey guys, my name is longname i am currently in 3rd year in python branch...",
        phone: "91 77777 77777",
        email: "name_rollno@iitp.ac.in",
        linkedin: "longname-person",
        profile: "https://i.pravatar.cc/300?img=1"
      },
      {
        name: "Another Person",
        subtitle: "Subtitle if any",
        description: "Hey guys, my name is longname i am currently in 3rd year in python branch...",
        phone: "91 77777 77777",
        email: "name_rollno@iitp.ac.in",
        linkedin: "longname-person",
        profile: "https://i.pravatar.cc/300?img=2"
      },
      {
        name: "Third Member",
        subtitle: "Subtitle if any",
        description: "Hey guys, my name is longname i am currently in 3rd year in python branch...",
        phone: "91 77777 77777",
        email: "name_rollno@iitp.ac.in",
        linkedin: "longname-person",
        profile: "https://i.pravatar.cc/300?img=3"
      }
    ]
  },
  {
    wingname: "Wing 2",
    wingcolor: "#C8BBFF",
    wingpeople: [
      {
        name: "Fourth Person",
        subtitle: "Subtitle if any",
        description: "Hey guys, my name is longname i am currently in 3rd year in python branch...",
        phone: "91 77777 77777",
        email: "name_rollno@iitp.ac.in",
        linkedin: "longname-person",
        profile: "https://i.pravatar.cc/300?img=4"
      },
      {
        name: "Fifth Person",
        subtitle: "Subtitle if any",
        description: "Hey guys, my name is longname i am currently in 3rd year in python branch...",
        phone: "91 77777 77777",
        email: "name_rollno@iitp.ac.in",
        linkedin: "longname-person",
        profile: "https://i.pravatar.cc/300?img=5"
      },
      {
        name: "Sixth Person",
        subtitle: "Subtitle if any",
        description: "Hey guys, my name is longname i am currently in 3rd year in python branch...",
        phone: "91 77777 77777",
        email: "name_rollno@iitp.ac.in",
        linkedin: "longname-person",
        profile: "https://i.pravatar.cc/300?img=6"
      }
    ]
  },
  {
    wingname: "Wing 3",
    wingcolor: "#9BE6C1",
    wingpeople: [
      {
        name: "Seventh Person",
        subtitle: "Subtitle if any",
        description: "Hey guys, my name is longname i am currently in 3rd year in python branch...",
        phone: "91 77777 77777",
        email: "name_rollno@iitp.ac.in",
        linkedin: "longname-person",
        profile: "https://i.pravatar.cc/300?img=7"
      },
      {
        name: "Eighth Person",
        subtitle: "Subtitle if any",
        description: "Hey guys, my name is longname i am currently in 3rd year in python branch...",
        phone: "91 77777 77777",
        email: "name_rollno@iitp.ac.in",
        linkedin: "longname-person",
        profile: "https://i.pravatar.cc/300?img=8"
      },
      {
        name: "Ninth Person",
        subtitle: "Subtitle if any",
        description: "Hey guys, my name is longname i am currently in 3rd year in python branch...",
        phone: "91 77777 77777",
        email: "name_rollno@iitp.ac.in",
        linkedin: "longname-person",
        profile: "https://i.pravatar.cc/300?img=9"
      }
    ]
  },
  {
    wingname: "Wing 4",
    wingcolor: "#9BC9FF",
    wingpeople: [
      {
        name: "Tenth Person",
        subtitle: "Subtitle if any",
        description: "Hey guys, my name is longname i am currently in 3rd year in python branch...",
        phone: "91 77777 77777",
        email: "name_rollno@iitp.ac.in",
        linkedin: "longname-person",
        profile: "https://i.pravatar.cc/300?img=10"
      },
      {
        name: "Eleventh Person",
        subtitle: "Subtitle if any",
        description: "Hey guys, my name is longname i am currently in 3rd year in python branch...",
        phone: "91 77777 77777",
        email: "name_rollno@iitp.ac.in",
        linkedin: "longname-person",
        profile: "https://i.pravatar.cc/300?img=11"
      },
      {
        name: "Twelfth Person",
        subtitle: "Subtitle if any",
        description: "Hey guys, my name is longname i am currently in 3rd year in python branch...",
        phone: "91 77777 77777",
        email: "name_rollno@iitp.ac.in",
        linkedin: "longname-person",
        profile: "https://i.pravatar.cc/300?img=12"
      }
    ]
  }
]

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut"
    }
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
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

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isLockedOpen]);

  const handleHoverStart = () => {
    if (!isLockedOpen) {
      setIsFlipped(true);
    }
  };

  const handleHoverEnd = () => {
    if (!isLockedOpen) {
      setIsFlipped(false);
    }
  };

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
        <div className="absolute w-full h-full rounded-xl overflow-hidden [backface-visibility:hidden]" style={{ backgroundColor: color }}>
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


        <div className="absolute w-full h-full rounded-xl p-6 [transform:rotateY(180deg)] [backface-visibility:hidden] flex flex-col space-y-4" style={{ backgroundColor: color }}>
          
          <p className="text-sm text-gray-800 h-2/5 overflow-y-auto">
            {person.description}
          </p>
          
          <div>
            <h5 className="text-lg font-semibold text-gray-900 mb-3">Connect now:</h5>
            <ul className="space-y-2.5">
              {person.phone && (
                <li className="flex items-center space-x-3">
                  <span className="text-xl w-5 text-center flex-shrink-0" aria-label="phone">📞</span>
                  <span className="text-sm text-gray-700">{person.phone}</span>
                </li>
              )}
              {person.email && (
                <li className="flex items-center space-x-3">
                  <span className="text-xl w-5 text-center flex-shrink-0" aria-label="email">✉️</span>
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
                  <span className="text-xl w-5 text-center flex-shrink-0" aria-label="link">🔗</span>
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


const Contact = () => {
  return (
    <div className="mt-6 bg-gray-50">
      <section className="max-w-7xl mx-auto px-6 py-16">
        
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-gray-900 mb-2">Meet the Team</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Our team is a group of highly dedicated people working unanimously towards to goal of a seamless and doubtless academcic experience for everyone.
          </p>
        </motion.section>
        {team.map((wing) => (
          <div key={wing.wingname} className="mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-800 mb-8 text-center">
              {wing.wingname}
            </h3>

            <motion.div
              className="flex flex-wrap justify-center gap-8"
              variants={containerVariants}
              initial="hidden"
              viewport={{ once: true, amount: 0.2 }}
              whileInView="visible"
            >
              {wing.wingpeople.map((person, index) => (
                <PersonCard key={`${wing.wingname}-${person.name}-${index}`} person={person} color={wing.wingcolor} />
              ))}
            </motion.div>

          </div>
        ))}
        
      </section>
    </div>
  )
}

export default Contact;