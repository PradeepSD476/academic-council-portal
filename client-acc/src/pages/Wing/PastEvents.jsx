import React from "react";
import { motion } from "framer-motion";
import { FaArrowRight } from "react-icons/fa";
import { useParams } from "react-router-dom";
import { FaBook, FaBriefcase, FaFlask, FaGraduationCap, FaLaptopCode, FaUsers, FaBullhorn } from "react-icons/fa";
import { useState } from "react";
const PastEventsData = {
  "academic-mentorship": [
    
      {
      id: 1,
      title: "Yearbook Event",
      logo: "/yearbook.jpeg",
      description:
        "Yearbook is an annual flagship event organized for every graduating batch of IIT Patna. The celebration includes inter-branch sports competitions, vibrant cultural events, and memorable activities that bring together the entire batch one last time. As a cherished keepsake, a specially curated yearbook capturing four years of memories is distributed to all graduating students.",
      items: [
        "Inter-branch sports competitions",
        "Cultural performances and celebrations",
        "Batch-wide engagement activities",
        "Distribution of official graduation yearbook"
      ],
      heading: "Event Highlights",
      link: "/events/yearbook",
      icon: FaBook
    }

    
  ],
"career-development": [
  {
    id: 2,
    title: "InvisionX",
    logo: "/invisionx.jpeg",
    description: "InvisionX turned out to be an inspiring and impactful experience, with enthusiastic student participation and engaging discussions throughout the event. Students actively interacted with the panelists, asked insightful questions, and gained clarity directly from industry leaders. The conclave successfully fostered meaningful industry–academia interaction, creating a vibrant space for learning, dialogue, and exchange of ideas.",
    items: [
      "Engaging panel discussions",
      "Industry–academia interaction",
      "Live Q&A with industry leaders"
    ],
    heading: "Highlights",
    link: "/events/mentorship-workshop",
    icon: FaBook
  }

],
  "research": [
    {
      id: 3,
      title: "Research Scholars’ Day (RSD)",
      logo: "/rsd.jpeg",
      description:
        "Research Scholars’ Day (RSD) is an initiative by the research scholars of IIT Patna to make research more accessible and impactful. It serves as a platform for scholars to collaborate with prominent personalities in their fields by sharing knowledge through short talks and poster presentations. The event bridges academic research with real-world applications, offering scholars an opportunity to showcase their work and interact with leading scientists.",
      items: [
        "Poster Presentations showcasing research to eminent dignitaries",
        "3-Minute Research Talks explaining complex ideas concisely",
        "Best presentations featured on official RSD social media platforms",
        "All presented work published in the RSD IIT Patna booklet",
        "Cultural closing evening (SPICMACAY program) celebrating Indian classical music"
      ],
      heading: "Event Highlights",
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
        ]
};

const PastEvents = () => {
  const { wingId } = useParams();
  const events = PastEventsData[wingId] || [];

  const [expanded, setExpanded] = useState(null);

  const toggleReadMore = (id) => {
    setExpanded(expanded === id ? null : id);
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Header */}
      <div className="text-center mb-14">
        <span className="text-sm sm:text-base text-white font-semibold uppercase tracking-widest bg-gradient-to-r from-blue-700 to-blue-500 px-6 py-2 rounded-full inline-block">
          Past Events
        </span>

        <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-gray-900 my-4">
          Celebrating Excellence
        </h2>

        <p className="text-gray-600 max-w-2xl mx-auto text-sm sm:text-base">
          Highlighted events hosted by the Academic and Career Council at IIT Patna
        </p>
      </div>

      {/* Event Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {events.map((event, index) => {
          const isExpanded = expanded === event.id;
          const shortDescription =
            event.description.length > 150
              ? event.description.slice(0, 150) + "..."
              : event.description;

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15, duration: 0.6 }}
              className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col"
            >
              {/* Image (Half Card) */}
              <div className="h-48 sm:h-52 md:h-56 overflow-hidden">
                <img
                  src={event.logo}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Content */}
              <div className="p-5 flex flex-col flex-grow">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">
                  {event.title}
                </h3>

                <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-3">
                  {isExpanded ? event.description : shortDescription}
                </p>

                {event.description.length > 150 && (
                  <button
                    onClick={() => toggleReadMore(event.id)}
                    className="text-blue-600 text-sm font-medium mb-4 hover:underline self-start"
                  >
                    {isExpanded ? "Show Less" : "Read More"}
                  </button>
                )}

                <h4 className="text-sm sm:text-base font-medium text-gray-800 mb-2">
                  {event.heading}
                </h4>

                <ul className="list-disc list-inside text-gray-700 text-sm space-y-1 mt-auto">
                  {event.items.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

export default PastEvents;