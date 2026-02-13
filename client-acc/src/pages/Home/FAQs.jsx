import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

const faqData = [
  {
    question: "What wings exist under the ACC?",
    answer:
      "There are five wings under ACC including Academic, Career Development, Research, Finance and Web, Media and Publicity Wing",
  },
  {
    question: "Who can I contact for career guidance?",
    answer:
      "We have Student Mentorship Program for this purpose, you can reach out to your mentors and co-mentors.",
  },
  {
    question: "Does ACC provide research opportunities?",
    answer:
      "Yes! Our Research & Development Wing helps students find research projects, internships, and collaborations with faculty and external organizations.",
  },
];

const FAQs = () => {
  const [activeIndex, setActiveIndex] = useState(null);

  const toggleQuestion = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-black mb-4">FAQs</h1>
        <p className="text-gray-700 text-lg">
          Browse through the FAQs below to answer most, if not all, of your queries.
        </p>
      </div>

      {/* FAQ List */}
      <div className="">
        {faqData.map((faq, index) => (
          <motion.div
            key={index}
            layout
            className="bg-white rounded-xl shadow-md p-6 cursor-pointer border border-gray-200"
            onClick={() => toggleQuestion(index)}
          >
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-800">{faq.question}</h2>
              <span className="text-blue-600">
                {activeIndex === index ? <FaChevronUp /> : <FaChevronDown />}
              </span>
            </div>

            <AnimatePresence>
              {activeIndex === index && (
                <motion.p
                  key="content"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-4 text-gray-700 text-base leading-relaxed"
                >
                  {faq.answer}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default FAQs;
