import React from "react";
import { motion } from "framer-motion";
import { FaArrowRight } from "react-icons/fa";
import { useParams } from "react-router-dom";
import { FaBook, FaBriefcase, FaFlask, FaGraduationCap, FaLaptopCode, FaUsers, FaBullhorn } from "react-icons/fa";

// Enhanced Data Structure for a more dynamic and formal look
const ResourcesData = {
    "academic-mentorship": {
        wingTitle: "Academic Support",
        subtitle: "Key Resources focused on guidance and study.",
        events: [
            {
                id: 1,
                title: "ACC Academic Resources Portal",
                logo: "/hero.png",
                description:
                    "The ACC Academic Resources Portal (acc.iitp.ac.in) serves as a centralized platform for curated academic materials and student support resources. It provides access to organized notes, slides, manuals, reports, and structured study content across courses. The portal is designed to simplify academic preparation and ensure students have reliable, accessible learning resources at one place.",
                items: [
                    "Curated notes, slides, and course materials",
                    "Previous year resources and academic guides",
                    "Structured support for semester preparation",
                    "Centralized access to academic documentation"
                ],
                heading: "Platform Features",
                link: "/dashboard/courses",
                icon: FaBook
            }

        ]
    },
    "career-development": {
        wingTitle: "Career Development Initiatives",
        subtitle: "Seminars and workshops to boost professional skills, resume building, and networking prowess.",
        events: [
            {
                id: 2,
                title: "Online Session: Robotics Reality",
                logo: "/robotics-reality.png", // upload first image with this name
                description:
                    "An interactive online session featuring Suganth Ravichandran (IIT Patna’22 | Engineer, Adverb | ex-Chegg Inc.) sharing practical insights into careers in Robotics and Mechanical Core domains. The session explored how academic knowledge translates into real-world industrial production and challenges.",
                items: [
                    "Career insights in Robotics & Core Engineering",
                    "Industry–academia perspective",
                    "Live Q&A with IITP alumnus"
                ],
                heading: "Session Highlights",
                link: "/wing/career-development",
                icon: FaBriefcase
            },
            {
                id: 3,
                title: "Online Session: AI Unleashed",
                logo: "/ai-unleashed.png", // upload second image with this name
                description:
                    "A dynamic online session featuring Amish Mittal (IIT Patna’22 | Co-Founder & CTO, Saturn Labs | ex-Microsoft Research Fellow) discussing career pathways in AI, research, and entrepreneurship. The session provided clarity on opportunities spanning research labs, industry roles, and startup ecosystems.",
                items: [
                    "Careers in AI & Research",
                    "Entrepreneurship insights",
                    "Industry and startup exposure"
                ],
                heading: "Session Highlights",
                link: "/wing/career-development",
                icon: FaBriefcase
            }
        ]

    },
    "research": {
        wingTitle: "Research & Innovation",
        subtitle: "Showcasing student research and fostering a culture of academic inquiry and innovation.",
        events: [
            {
                id: 3,
                title: "Grad School Application Guidance Session",
                logo: "/hero.png",
                description:
                    "The Research Community hosted an online session on 31st May 2025 to guide students through the graduate school application process — from selecting suitable programs to crafting strong Statements of Purpose (SOPs). The session was led by seniors from the 2021–25 batch, a cohort that particularly excelled in ML research. Students gained practical insights directly from those who recently navigated the application journey.",
                items: [
                    "Choosing the right graduate programs",
                    "SOP writing strategies and application tips",
                    "Insights from ML-focused research seniors (2021–25 batch)",
                    "Live interaction and Q&A session"
                ],
                heading: "Session Highlights",
                link: "https://docs.google.com/presentation/d/1ktPAdUFjdCj0gFZSuTw0eVHR-pygmH_Or5FrzcAvwjg/edit",
                icon: FaFlask
            }


        ]
    },
    "placement": {
        wingTitle: "Placement Preparation",
        subtitle: "Targeted workshops and resources to ensure student success in final placement drives.",
        events: [
            {
                id: 4,
                title: "Placement Prep Workshop",
                logo: "/hero.png",
                description: "Intensive training to prepare students for technical interviews, aptitude tests, and group discussions.",
                items: ["Advanced resume tips", "Technical interview prep", "In-depth company insights"],
                heading: "Workshop Sessions",
                link: "/events/placement-prep",
                icon: FaGraduationCap
            }
        ]
    },
    "internship": {
        wingTitle: "Internship Programs",
        subtitle: "Orientation and guidance for securing valuable summer and winter industrial training experiences.",
        events: [
            {
                id: 5,
                title: "Internship Orientation",
                logo: "/hero.png",
                description: "An introductory session to understand the process, timeline, and expectations for internships.",
                items: ["Resume structuring advice", "Company shortlisting insights", "Interview preparation strategies"],
                heading: "Event Agenda",
                link: "/events/internship-orientation",
                icon: FaLaptopCode
            }
        ]
    },
    "alumni": {
        wingTitle: "Alumni Engagement",
        subtitle: "Connecting current students with distinguished alumni for mentorship and professional guidance.",
        events: [
            {
                id: 6,
                title: "Alumni Meet 2024",
                logo: "/hero.png",
                description: "A formal gathering to network and learn from the professional journeys of our successful alumni.",
                items: ["Focused networking sessions", "Industry expert panel discussions", "Personalized career advice"],
                heading: "Key Highlights",
                link: "/events/alumni-meet",
                icon: FaUsers
            }
        ]
    }
};

const ResourcesPage = () => {
    const { wingId } = useParams();
    // Retrieve the data object for the current wingId
    const wingData = ResourcesData[wingId] || { wingTitle: "Events", subtitle: "Events from the Academic and Career Council", events: [] };
    const { wingTitle, subtitle, events } = wingData;

    return (
        <section className="max-w-7xl mx-auto px-6 py-16">
            <div className="text-center mb-16">
                <motion.span
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    // Formal and neat design: solid background, white text
                    className="text-lg text-white py-1 font-semibold uppercase tracking-widest bg-linear-to-r from-blue-700 to-blue-500 px-6 rounded-2xl py-3"
                >
                    Resources
                </motion.span>

                {/* Dynamic and formal main title */}
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 my-4 tracking-tight">
                    {wingTitle}
                </h2>
                {/* Dynamic subtitle */}
                <p className="text-gray-600 max-w-3xl mx-auto text-lg">
                    {subtitle}
                </p>
            </div>

            {/* Event Cards - Refined Design */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {events.map((event, index) => (
                    <motion.div
                        key={event.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.2, duration: 0.6 }}
                        // Formal Card: Clean white background, subtle border, and indigo shadow on hover
                        className="bg-white border border-gray-200 rounded-xl shadow-md p-8 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:border-indigo-200"
                    >
                        {/* Icon for quick visual identity */}
                        <div className="mb-4 text-center">
                            <event.icon className="w-10 h-10 text-blue-600 mx-auto" />
                        </div>

                        {/* <img // Kept the image but it's often better to use the icon for this formal style
                            src={event.logo}
                            alt={event.title}
                            className="w-16 h-16 object-contain mb-4 mx-auto"
                        /> */}
                        <h3 className="text-xl font-bold text-gray-900 mb-3 text-center tracking-tight">{event.title}</h3>
                        <p className="text-gray-600 text-base mb-6 text-center">{event.description}</p>

                        <div className="mt-auto"> {/* Pushes the content to the bottom */}
                            <h4 className="text-md font-semibold uppercase text-blue-700 mb-3 border-b border-indigo-100 pb-1">{event.heading}</h4>

                            <ul className="list-disc list-inside text-gray-700 mb-6 text-md space-y-2 pl-4">
                                {event.items.map((item, idx) => (
                                    <li key={idx} className="leading-relaxed">{item}</li>
                                ))}
                            </ul>

                            <a
                                href={event.link}
                                // Formal Link: Indigo color with subtle hover underline
                                className="inline-flex items-center text-blue-600 font-semibold  transition-colors text-lg group"
                            >
                                View Details
                                <FaArrowRight className="ml-2 w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                            </a>
                        </div>
                    </motion.div>
                ))}
            </div>
            {/* Display message if no events found for the wing */}
            {events.length === 0 && (
                <div className="text-center py-10">
                    <p className="text-lg text-gray-500">No events found for this resource wing.</p>
                </div>
            )}
        </section>
    );
};

export default ResourcesPage;