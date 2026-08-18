import React, { useState } from "react";
import { motion } from "framer-motion";
import { FiCalendar, FiCheck } from "react-icons/fi";

const events = [
  {
    id: 1,
    title: "Yearbook & Graduation Fest",
    badge: "Flagship Tradition",
    logo: "/yearbook.PNG",
    description:
      "Yearbook is an annual flagship event organized for every graduating batch of IIT Patna. The celebration includes inter-branch sports competitions, cultural performances, and memorable activities that bring the entire batch together one final time.",
    items: [
      "Inter-branch sports competitions",
      "Cultural performances and celebrations",
      "Official graduation yearbook distribution",
    ],
    heading: "Key Highlights",
  },
  {
    id: 2,
    title: "InvisionX Leadership Conclave",
    badge: "Industry Conclave",
    logo: "/invisionx.jpeg",
    description:
      "InvisionX is an inspiring conclave witnessing high student participation and engaging discussions. Students interact directly with industry leaders and alumni, gaining valuable perspective on emerging technical careers.",
    items: [
      "Panel discussions with tech leaders",
      "Industry–academia interaction",
      "Live student mentorship and Q&A",
    ],
    heading: "Key Highlights",
  },
  {
    id: 3,
    title: "Research Scholars’ Day (RSD)",
    badge: "Research Summit",
    logo: "/rsd.jpeg",
    description:
      "Research Scholars’ Day (RSD) is an initiative by IIT Patna research scholars to make research accessible and impactful, featuring research talks, symposia, and poster presentations to distinguished faculty.",
    items: [
      "Poster presentations to eminent scientists",
      "3-Minute fast-track research talks",
      "Publication of official RSD proceedings booklet",
    ],
    heading: "Key Highlights",
  },
];

const PastEvents = () => {
  const [expanded, setExpanded] = useState(null);

  const toggleReadMore = (id) => {
    setExpanded(expanded === id ? null : id);
  };

  return (
    <div className="py-16 bg-[#F8FAFC]">
      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-12">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="academic-badge mb-3">Milestones &amp; Archives</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
            Flagship Campus Initiatives
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Annual conclaves, summits, and traditions organized by the Academic &amp; Career Council.
          </p>
        </div>

        {/* Event Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {events.map((event) => {
            const isExpanded = expanded === event.id;
            const shortDescription =
              event.description.length > 130
                ? event.description.slice(0, 130) + "..."
                : event.description;

            return (
              <div
                key={event.id}
                className="academic-card rounded-xl overflow-hidden flex flex-col hover:-translate-y-0.5"
              >
                {/* Image */}
                <div className="h-48 overflow-hidden bg-slate-100 relative border-b border-slate-200">
                  <img
                    src={event.logo}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 bg-white/95 backdrop-blur-sm rounded text-[10px] font-bold uppercase tracking-wider text-slate-900 border border-slate-200 shadow-xs">
                    {event.badge}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-grow space-y-3">
                  <h3 className="text-base font-bold text-slate-950 leading-snug">
                    {event.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {isExpanded ? event.description : shortDescription}
                  </p>

                  {event.description.length > 130 && (
                    <button
                      onClick={() => toggleReadMore(event.id)}
                      className="text-blue-700 text-xs font-semibold hover:underline self-start cursor-pointer"
                    >
                      {isExpanded ? "Show Less ↑" : "Read More ↓"}
                    </button>
                  )}

                  <div className="mt-auto pt-3 border-t border-slate-100">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                      {event.heading}
                    </h4>

                    <ul className="space-y-1.5 text-xs text-slate-700 font-medium">
                      {event.items.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <FiCheck className="text-blue-600 text-xs shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default PastEvents;

