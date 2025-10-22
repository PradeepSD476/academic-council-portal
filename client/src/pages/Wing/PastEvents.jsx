import React from "react";
import { motion } from "framer-motion";
import { FaArrowRight } from "react-icons/fa";
import { useParams } from "react-router-dom";
import { FaBook, FaBriefcase, FaFlask, FaGraduationCap, FaLaptopCode, FaUsers, FaBullhorn } from "react-icons/fa";

const PastEventsData = {
  "academic-mentorship": [
    {
      id: 1,
      title: "Mentorship Workshop",
      logo: "/hero.png",
      description: "A workshop to connect mentees with experienced mentors.",
      items: ["Guidance sessions", "Study plan creation", "Exam tips"],
      heading: "Activities",
      link: "/events/mentorship-workshop",
      icon: FaBook
    }
  ],
  "career-development": [
    {
      id: 2,
      title: "Career Guidance Seminar",
      logo: "/hero.png",
      description: "Seminar on career options, internships, and skill-building.",
      items: ["Resume building", "Mock interviews", "Networking strategies"],
      heading: "Highlights",
      link: "/events/career-guidance",
      icon: FaBriefcase
    }
  ],
  "research": [
    {
      id: 3,
      title: "Research Symposium",
      logo: "/hero.png",
      description: "Students present their research to the academic community.",
      items: ["Poster presentations", "Paper reviews", "Expert feedback"],
      heading: "Sessions",
      link: "/events/research-symposium",
      icon: FaFlask
    }
  ],
  "placement": [
    {
      id: 4,
      title: "Placement Prep Workshop",
      logo: "/hero.png",
      description: "Prepare for interviews and placement drives.",
      items: ["Resume tips", "Interview prep", "Company insights"],
      heading: "Sessions",
      link: "/events/placement-prep",
      icon: FaGraduationCap
    }
  ],
  "internship": [
    {
      id: 5,
      title: "Internship Orientation",
      logo: "/hero.png",
      description: "Introduction to summer and winter internships for students.",
      items: ["Resume tips", "Company insights", "Interview prep"],
      heading: "Agenda",
      link: "/events/internship-orientation",
      icon: FaLaptopCode
    }
  ],
  "alumni": [
    {
      id: 6,
      title: "Alumni Meet 2024",
      logo: "/hero.png",
      description: "Reconnect with alumni and learn from their experiences.",
      items: ["Networking sessions", "Panel discussions", "Career advice"],
      heading: "Highlights",
      link: "/events/alumni-meet",
      icon: FaUsers
    }
  ],
  "pr": [
    {
      id: 7,
      title: "PR & Outreach Campaign",
      logo: "/hero.png",
      description: "Engage in public relations and outreach activities.",
      items: ["Media campaigns", "Event promotions", "Community initiatives"],
      heading: "Activities",
      link: "/events/pr-campaign",
      icon: FaBullhorn
    }
  ]
};

const PastEvents = () => {
    const { wingId } = useParams();
    const events = PastEventsData[wingId] || [];

    return (
        <section className="max-w-7xl mx-auto px-6 py-16">
            <div className="text-center mb-16">
                <motion.span
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                   className="text-lg text-white py-1 font-semibold uppercase tracking-widest bg-linear-to-r from-blue-700 to-blue-500 px-6 rounded-2xl py-3"
                >
                    Past Events
                </motion.span>

                <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-gray-900 my-4">Celebrating Excellence</h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                    Highlighted events hosted by the Academic and Career Council at IIT Patna
                </p>
            </div>

            {/* Event Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {events.map((event, index) => (
                    <motion.div
                        key={event.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.2, duration: 0.6 }}
                        className="bg-[#C8BBFF] rounded-2xl shadow-lg p-6 flex flex-col justify-between hover:shadow-xl transition-shadow"
                    >
                       
                        <img
                            src={event.logo}
                            alt={event.title}
                            className="w-24 h-24 object-contain mb-4 mx-auto"
                        />
                        <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">{event.title}</h3>
                        <p className="text-gray-600 text-sm mb-4">{event.description}</p>
                        <h4 className="text-md font-medium text-gray-800 mb-2">{event.heading}</h4>

                        <ul className="list-disc list-inside text-gray-700 mb-4 text-sm space-y-1">
                            {event.items.map((item, idx) => (
                                <li key={idx}>{item}</li>
                            ))}
                        </ul>

                        <a
                            href={event.link}
                            className="inline-flex items-center text-blue-600 font-medium hover:text-blue-800 transition-colors"
                        >
                            Explore More <FaArrowRight className="ml-1" />
                        </a>
                    </motion.div>
                ))}
            </div>
        </section>
    );
};

export default PastEvents;
