import React, { useState } from "react";
import { motion } from "framer-motion";

const events = [
  {
    id: 1,
    title: "Yearbook & Graduation Fest",
    logo: "/yearbook.jpeg",
    description:
      "Yearbook is an annual flagship event organized for every graduating batch of IIT Patna. The celebration includes inter-branch sports competitions, cultural performances, and memorable activities that bring the entire batch together one final time. A specially curated yearbook capturing four years of memories is distributed to all graduating students.",
    items: [
      "Inter-branch sports competitions",
      "Cultural performances and celebrations",
      "Batch-wide engagement activities",
      "Official graduation yearbook distribution"
    ],
    heading: "Event Highlights",
    link: "/events/yearbook",
  },
  {
    id: 2,
    title: "InvisionX",
    logo: "/invisionx.jpeg",
    description:
      "InvisionX was an inspiring conclave that witnessed enthusiastic student participation and engaging discussions. Students interacted directly with industry leaders, asked insightful questions, and gained clarity on career pathways. The event fostered meaningful industry–academia interaction and created a vibrant space for dialogue and learning.",
    items: [
      "Engaging panel discussions",
      "Industry–academia interaction",
      "Live Q&A with industry leaders"
    ],
    heading: "Event Highlights",
    link: "/events/invisionx",
  },
  {
    id: 3,
    title: "Research Scholars’ Day (RSD)",
    logo: "/rsd.jpeg",
    description:
      "Research Scholars’ Day (RSD) is an initiative by IIT Patna research scholars to make research more accessible and impactful. The event bridges academic research with real-world applications, allowing scholars to collaborate with prominent scientists and present their work through short talks and poster presentations.",
    items: [
      "Poster Presentations to eminent dignitaries",
      "3-Minute Research Talks",
      "Publication in RSD IIT Patna booklet",
      "Cultural closing evening (SPICMACAY program)"
    ],
    heading: "Event Highlights",
    link: "/events/research-symposium",
  }
];

const PastEvents = () => {
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
            event.description.length > 160
              ? event.description.slice(0, 160) + "..."
              : event.description;

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15, duration: 0.6 }}
              className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col"
            >
              {/* Image - Half Card */}
              <div className="h-48 sm:h-52 md:h-56 overflow-hidden">
                <img
                  src={event.logo}
                  alt={event.title}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                />
              </div>

              {/* Content */}
              <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">
                  {event.title}
                </h3>

                <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-3">
                  {isExpanded ? event.description : shortDescription}
                </p>

                {event.description.length > 160 && (
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
