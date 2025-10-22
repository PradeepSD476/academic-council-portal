import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

const faqData = [
  {
    question: "How can I join the Academic & Career Council?",
    answer:
      "You can join the ACC by participating in our recruitment drives and submitting an application through the official student portal. Selection is based on merit and interest in academic and career initiatives.",
  },
  {
    question: "What wings exist under the ACC?",
    answer:
      "There are seven wings under ACC including Academic Mentorship, Career Development, Research & Development, Placement Cell, Internship Cell, Alumni Relations, and Public Relations & Outreach.",
  },
  {
    question: "Who can I contact for career guidance?",
    answer:
      "You can contact the Career Development Wing through email or by visiting our office during office hours. They provide personalized guidance for all students.",
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
