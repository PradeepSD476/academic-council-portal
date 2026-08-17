import React from "react";
import { motion } from "framer-motion";
import { FaArrowRight } from "react-icons/fa";
import { useParams } from "react-router-dom";
import { FaBook, FaBriefcase, FaFlask, FaGraduationCap, FaLaptopCode, FaUsers, FaBullhorn } from "react-icons/fa";

const ResourcesData = {
    "academic-mentorship": {
        wingTitle: "Academic Support",
        subtitle: "Key resources and initiatives focused on curriculum guidance and study strategies.",
        events: [
            {
                id: 1,
                title: "ACC Academic Resources Portal",
                logo: "/hero.png",
                description:
                    "The ACC Academic Resources Portal serves as a centralized platform for curated academic materials and student support resources. It provides access to organized notes, slides, manuals, reports, and structured study content across courses.",
                items: [
                    "Curated notes, slides, and course materials",
                    "Previous year resources and academic guides",
                    "Structured support for semester preparation",
                    "Centralized access to academic documentation"
                ],
                heading: "Platform Features",
                link: "/dashboard/courses",
                icon: FaBook
            },
            {
                id: 2,
                title: "Student Mentorship Program",
                logo: "/mentorship.jpeg",
                description:
                    "The Student Mentorship Program is designed to provide personalized academic and personal guidance to students throughout the year. Each student is assigned a mentor and co-mentor who conduct regular meetings and monitor progress.",
                items: [
                    "Assigned mentor and co-mentor for every student",
                    "Regular one-on-one mentorship meetings",
                    "Academic and career guidance support",
                    "Continuous monitoring and personal development"
                ],
                heading: "Program Highlights",
                link: "/smp/",
                icon: FaBook
            }
        ]
    },
    "career-development": {
        wingTitle: "Career Development Initiatives",
        subtitle: "Seminars and workshops to boost professional skills, resume building, and industry networking.",
        events: [
            {
                id: 3,
                title: "Online Session: Robotics Reality",
                logo: "/robotics-reality.png",
                description:
                    "An interactive online session featuring industry experts sharing practical insights into careers in Robotics and Mechanical Core domains. Explores how academic knowledge translates into real-world production.",
                items: [
                    "Career insights in Robotics & Core Engineering",
                    "Practical industrial challenges and roadmaps",
                    "Live interactive Q&A with experienced engineers",
                    "Guidance on skill transition from campus to industry"
                ],
                heading: "Session Highlights",
                link: "https://youtube.com",
                icon: FaBriefcase
            },
            {
                id: 4,
                title: "Online Session: Beyond College",
                logo: "/beyond-college.png",
                description:
                    "A dynamic talk on mastering interview strategies, cracking competitive hiring rounds, and transitioning effectively from college life to professional corporate environments.",
                items: [
                    "Resume building & personal branding tips",
                    "Cracking technical and behavioral interviews",
                    "Real-world work culture expectations",
                    "Alumni experiences and actionable career roadmaps"
                ],
                heading: "Session Highlights",
                link: "https://youtube.com",
                icon: FaBriefcase
            }
        ]
    },
    "research": {
        wingTitle: "Research Initiatives",
        subtitle: "Cultivating curiosity, industrial lab visits, and academic publishing mentorship.",
        events: [
            {
                id: 5,
                title: "Industrial & Lab Visit Program",
                logo: "/hero.png",
                description:
                    "Facilitating student visits to state-of-the-art national research facilities, cleanrooms, and private R&D hubs to observe research in action.",
                items: [
                    "Guided tours to cutting-edge research facilities",
                    "Direct interaction with senior scientists & principal investigators",
                    "Understanding industrial safety and lab standards",
                    "Exploration of joint R&D internship pathways"
                ],
                heading: "Key Takeaways",
                link: "#",
                icon: FaFlask
            },
            {
                id: 6,
                title: "Research Paper Mentorship Cell",
                logo: "/hero.png",
                description:
                    "Guiding undergraduate and postgraduate scholars through literature review structuring, LaTeX formatting, peer review response drafting, and IEEE/ACM journal submissions.",
                items: [
                    "Structured workshops on LaTeX and academic typography",
                    "Guidance on identifying high-impact conferences",
                    "Review feedback and peer-mentoring sessions",
                    "Ethical citation and plagiarism check assistance"
                ],
                heading: "Program Pillars",
                link: "#",
                icon: FaFlask
            }
        ]
    }
};

const ResourcesPage = () => {
    const { wingId } = useParams();
    const wingData = ResourcesData[wingId] || { wingTitle: "Wing Resources", subtitle: "Key programs and resources for this division.", events: [] };
    const { wingTitle, subtitle, events } = wingData;

    if (!events || events.length === 0) return null;

    return (
        <section className="max-w-[1280px] mx-auto px-6 md:px-16 py-16 border-t border-slate-200/80">
            {/* Header Section */}
            <div className="text-center mb-16">
                <div className="flex justify-center items-center gap-3 mb-4">
                    <div className="w-[4px] h-8 bg-gradient-to-b from-[#D96B43] via-[#FED7AA] to-[#133E87] rounded-full shadow-[0_0_8px_#D96B43]" />
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#0B1E3F] uppercase tracking-tight">
                        {wingTitle}
                    </h2>
                    <div className="w-[4px] h-8 bg-gradient-to-b from-[#D96B43] via-[#FED7AA] to-[#133E87] rounded-full shadow-[0_0_8px_#D96B43]" />
                </div>
                <p className="text-slate-600 max-w-3xl mx-auto text-base sm:text-lg font-normal">
                    {subtitle}
                </p>
            </div>

            {/* Event Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {events.map((event, index) => (
                    <motion.div
                        key={event.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.15, duration: 0.5 }}
                        className="group bg-gradient-to-b from-white/95 via-sky-50/25 to-blue-50/35 backdrop-blur-2xl border-2 border-[var(--color-secondary)]/40 hover:border-[var(--color-primary-accent)]/60 rounded-[2.5rem] shadow-[0_16px_45px_rgba(11,30,63,0.08)] p-8 flex flex-col justify-between transition-all duration-500 hover:shadow-[0_24px_60px_var(--color-secondary-glow)] relative overflow-hidden hover:-translate-y-2"
                    >
                        {/* Icon Badge */}
                        <div className="mb-6 flex justify-center">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-100 to-blue-100 border-2 border-sky-200 flex items-center justify-center group-hover:scale-110 group-hover:bg-gradient-to-br group-hover:from-[var(--color-primary)] group-hover:via-[var(--color-primary-accent)] group-hover:to-[var(--color-secondary)] transition-all duration-300 shadow-xs backdrop-blur-md">
                                <event.icon className="w-7 h-7 text-[var(--color-primary)] group-hover:text-white transition-colors duration-300" />
                            </div>
                        </div>

                        <h3 className="text-xl font-black text-[var(--color-primary)] mb-3 text-center tracking-tight group-hover:text-[var(--color-primary-accent)] transition-colors">
                            {event.title}
                        </h3>
                        <p className="text-slate-700 text-sm leading-relaxed mb-6 text-center font-normal">
                            {event.description}
                        </p>

                        <div className="mt-auto pt-4 border-t border-slate-200/80">
                            <div className="flex items-center justify-center gap-2 mb-3">
                                <div className="w-[3px] h-3.5 bg-[var(--color-secondary)] rounded-full" />
                                <h4 className="text-xs font-black uppercase text-[var(--color-secondary)] tracking-wider">{event.heading}</h4>
                            </div>

                            <ul className="list-none space-y-2 mb-6 text-xs sm:text-sm">
                                {event.items.map((item, idx) => (
                                    <li key={idx} className="flex items-start gap-2.5 text-slate-700 font-medium">
                                        <span className="text-[var(--color-secondary)] mt-0.5 text-xs font-black">▶</span>
                                        <span className="leading-relaxed">{item}</span>
                                    </li>
                                ))}
                            </ul>

                            <div className="text-center">
                                <a
                                    href={event.link}
                                    className="group/btn inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-white/95 border border-sky-300 text-[var(--color-primary)] font-black text-sm rounded-full hover:bg-gradient-to-r hover:from-[var(--color-primary)] hover:via-[var(--color-primary-accent)] hover:to-[var(--color-secondary)] hover:text-white hover:border-transparent transition-all duration-300 shadow-xs"
                                >
                                    <span>Access Resource</span>
                                    <FaArrowRight className="text-xs transition-transform duration-300 group-hover/btn:translate-x-1" />
                                </a>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
};

export default ResourcesPage;