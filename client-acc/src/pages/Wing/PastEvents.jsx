import React, { useState } from "react";
import { motion } from "framer-motion";
import { useParams } from "react-router-dom";
import { FaBook } from "react-icons/fa";

const PastEventsData = {
  "academic-mentorship": [
    {
      id: 1,
      title: "Yearbook Event",
      logo: "/yearbook.PNG",
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
      icon: FaBook
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

  if (events.length === 0) return null;

  return (
    <section className="max-w-[1280px] mx-auto px-6 md:px-16 py-20">
      {/* Section Header */}
      <div className="text-center mb-16">
        <div className="flex justify-center items-center gap-3 mb-4">
          <div className="w-[4px] h-8 bg-gradient-to-b from-[#D96B43] via-[#FED7AA] to-[#133E87] rounded-full shadow-[0_0_8px_#D96B43]" />
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#0B1E3F] uppercase tracking-tight">
            Flagship Events
          </h2>
          <div className="w-[4px] h-8 bg-gradient-to-b from-[#D96B43] via-[#FED7AA] to-[#133E87] rounded-full shadow-[0_0_8px_#D96B43]" />
        </div>
        <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto font-normal">
          Highlighting key conclaves, workshops, and milestones organized by this wing.
        </p>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="bg-gradient-to-b from-white/95 via-sky-50/25 to-blue-50/35 backdrop-blur-2xl border-2 border-[var(--color-secondary)]/40 hover:border-[var(--color-primary-accent)]/60 rounded-[2.5rem] overflow-hidden shadow-[0_16px_45px_rgba(11,30,63,0.08)] hover:shadow-[0_24px_60px_var(--color-secondary-glow)] transition-all duration-500 flex flex-col group hover:-translate-y-2"
            >
              {/* Image Section */}
              <div className="relative h-48 sm:h-52 overflow-hidden bg-slate-100 border-b border-slate-200/90">
                <img
                  src={event.logo}
                  alt={event.title}
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                />
              </div>

              {/* Content */}
              <div className="p-6 md:p-8 flex flex-col flex-grow">
                <h3 className="text-xl font-black text-[var(--color-primary)] mb-3 tracking-tight group-hover:text-[var(--color-primary-accent)] transition-colors">
                  {event.title}
                </h3>

                <p className="text-slate-700 text-sm sm:text-base leading-relaxed mb-4 font-normal">
                  {isExpanded ? event.description : shortDescription}
                </p>

                {event.description.length > 150 && (
                  <button
                    onClick={() => toggleReadMore(event.id)}
                    className="text-[var(--color-primary-accent)] text-xs font-black uppercase tracking-wider mb-6 hover:text-[var(--color-secondary)] transition-colors duration-200 self-start cursor-pointer"
                  >
                    {isExpanded ? "Show Less ↑" : "Read More ↓"}
                  </button>
                )}

                <div className="mt-auto pt-4 border-t border-slate-200/80">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-[3px] h-4 bg-[var(--color-secondary)] rounded-full" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-[var(--color-secondary)]">
                      {event.heading}
                    </h4>
                  </div>

                  <ul className="list-none space-y-2">
                    {event.items.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-slate-700 text-xs sm:text-sm font-medium">
                        <span className="text-[var(--color-secondary)] mt-0.5 text-xs font-black">▶</span>
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

export default PastEvents;