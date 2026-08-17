import React, { useState } from "react";
import { motion } from "framer-motion";

const events = [
  {
    id: 1,
    title: "Yearbook & Graduation Fest",
    badge: "Flagship Tradition",
    logo: "/yearbook.PNG",
    description:
      "Yearbook is an annual flagship event organized for every graduating batch of IIT Patna. The celebration includes inter-branch sports competitions, cultural performances, and memorable activities that bring the entire batch together one final time. A specially curated yearbook capturing four years of memories is distributed to all graduating students.",
    items: [
      "Inter-branch sports competitions",
      "Cultural performances and celebrations",
      "Official graduation yearbook distribution"
    ],
    heading: "Key Highlights",
    link: "/events/yearbook",
  },
  {
    id: 2,
    title: "InvisionX",
    badge: "Leadership Conclave",
    logo: "/invisionx.jpeg",
    description:
      "InvisionX was an inspiring conclave that witnessed enthusiastic student participation and engaging discussions. Students interacted directly with industry leaders, asked insightful questions, and gained clarity on career pathways. The event fostered meaningful industry–academia interaction and created a vibrant space for dialogue and learning.",
    items: [
      "Engaging panel discussions",
      "Industry–academia interaction",
      "Live Q&A with industry leaders"
    ],
    heading: "Key Highlights",
    link: "/events/invisionx",
  },
  {
    id: 3,
    title: "Research Scholars’ Day (RSD)",
    badge: "Innovation Summit",
    logo: "/rsd.jpeg",
    description:
      "Research Scholars’ Day (RSD) is an initiative by IIT Patna research scholars to make research more accessible and impactful. The event bridges academic research with real-world applications, allowing scholars to collaborate with prominent scientists and present their work through short talks and poster presentations.",
    items: [
      "Poster Presentations to eminent dignitaries",
      "3-Minute Fast-Track Research Talks",
      "Publication in RSD IIT Patna booklet"
    ],
    heading: "Key Highlights",
    link: "/events/research-symposium",
  }
];

const PastEvents = () => {
  const [expanded, setExpanded] = useState(null);

  const toggleReadMore = (id) => {
    setExpanded(expanded === id ? null : id);
  };

  return (
    <div className="py-20 relative overflow-hidden">
      <section className="max-w-[1280px] mx-auto px-6 md:px-16 relative z-10">
        
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20 text-xs font-black uppercase tracking-widest mb-4 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[var(--color-secondary)] animate-pulse" />
            Milestone Archives
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[var(--color-primary)] tracking-tight my-2">
            Celebrating Excellence
          </h2>

          <p className="text-slate-600 max-w-2xl mx-auto text-base sm:text-lg">
            Flagship events and student conclaves hosted by the Academic and Career Council at IIT Patna
          </p>
        </div>

        {/* Event Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map((event, index) => {
            const isExpanded = expanded === event.id;
            const shortDescription =
              event.description.length > 140
                ? event.description.slice(0, 140) + "..."
                : event.description;

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="bg-gradient-to-b from-white/95 via-sky-50/30 to-blue-50/40 backdrop-blur-2xl border-2 border-[var(--color-secondary)]/45 hover:border-[var(--color-primary-accent)]/60 rounded-[2.5rem] p-4 flex flex-col shadow-[0_16px_45px_rgba(11,30,63,0.08)] hover:shadow-[0_24px_60px_var(--color-secondary-glow)] transition-all duration-500 group hover:-translate-y-2 relative overflow-hidden"
              >
                {/* Ambient permanent glow orb inside */}
                <div className="absolute -top-12 -right-12 w-36 h-36 bg-gradient-to-br from-[var(--color-secondary)]/35 to-transparent rounded-full blur-2xl pointer-events-none" />

                {/* Image Section */}
                <div className="h-52 overflow-hidden rounded-[2rem] bg-slate-100 relative border border-slate-200/90 shadow-xs">
                  <img
                    src={event.logo}
                    alt={event.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3 px-3 py-1 bg-white/95 backdrop-blur-md rounded-full border border-sky-200 shadow-xs">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[var(--color-primary)]">
                      {event.badge}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 pt-4 flex flex-col flex-grow">
                  <h3 className="text-xl font-black text-[var(--color-primary)] mb-2 tracking-tight group-hover:text-[var(--color-primary-accent)] transition-colors leading-snug">
                    {event.title}
                  </h3>

                  <p className="text-slate-700 text-sm leading-relaxed mb-3 font-normal">
                    {isExpanded ? event.description : shortDescription}
                  </p>

                  {event.description.length > 140 && (
                    <button
                      onClick={() => toggleReadMore(event.id)}
                      className="text-[var(--color-primary-accent)] hover:text-[var(--color-secondary)] text-xs font-black uppercase tracking-wider mb-4 hover:underline self-start cursor-pointer transition-colors"
                    >
                      {isExpanded ? "Show Less ↑" : "Read More ↓"}
                    </button>
                  )}

                  <div className="mt-auto pt-4 border-t border-slate-200/80">
                    <h4 className="text-[11px] font-black uppercase tracking-wider text-[var(--color-secondary)] mb-2">
                      {event.heading}
                    </h4>

                    <ul className="space-y-1.5 text-slate-700 text-xs font-semibold">
                      {event.items.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-[var(--color-secondary)] text-xs font-black">✦</span>
                          <span>{item}</span>
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
    </div>
  );
};

export default PastEvents;
