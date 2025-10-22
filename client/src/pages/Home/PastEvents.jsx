import React from "react";
import { motion } from "framer-motion";
import { FaArrowRight } from "react-icons/fa";

//to be replaced with actual one
const events = [
    {
        id: 1,
        title: "Career Connect",
        logo: "/hero.png",
        description:
            "The Academics and Career Council organized CAREER CONNECT, a three-day event for all undergraduate and postgraduate students, from 5th to 7th April 2024.",
        items: ["Debugging the software role", "Stock Trading Competition", "Ideation-Insomnia", "Product Paradigm"],
        heading: "Events",
        link: "/events/career-connect",
    },
    {
        id: 2,
        title: "National Students Research Convention",
        logo: "/hero.png",
        description:
            "The 5th National Students' Research Convention 2023 (NSRC '23) took place from 3-5 March 2023, with the theme 'MedTech and Healthcare: The Welfare of Humanity'.",
        items: ["Biomechanics & Biophysics", "Medical imaging", "Medical instrumentations", "Medical sensing & Implant"],
        heading: "Competition Themes",
        link: "/events/nsrc",
    },
    {
        id: 3,
        title: "Institute Research Symposium",
        logo: "/hero.png",
        description:
            "Academics and Career Council organised IRS where PG and UG students of IIT Kanpur showcased their research to the larger community.",
        items: ["Prof. Rajiv Mishra", "Prof. Rahu Mishra", "Prof. Arijit Mondal", "Prof. Joydeep Mondal"],
        heading: "Professors",
        link: "/events/irs",
    },
];

const PastEvents = () => {
    return (
        <section className="max-w-7xl mx-auto px-6 py-16">
            <div className="text-center mb-16">
                <motion.span
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-lg text-white py-1 font-semibold uppercase tracking-widest bg-gradient-to-r from-blue-700 to-blue-500 px-6 rounded-2xl"
                >
                    Past Events
                </motion.span>

                <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-gray-900 mb-2">Celebrating Excellence</h2>
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
                        className="bg-white rounded-2xl shadow-lg p-6 flex flex-col justify-between hover:shadow-xl transition-shadow"
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
