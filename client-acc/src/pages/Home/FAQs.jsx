import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronDown, FaChevronUp, FaArrowRight } from "react-icons/fa";
import { Link } from "react-router-dom";

import faqDataFull from "../../data/faq.json";

// Filter out 3 FAQs for the homepage, e.g. from ACC category
const faqData = faqDataFull.filter(faq => faq.category === "ACC").slice(0, 3);

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

      {/* See All FAQs Button */}
      <div className="flex justify-center mt-10">
        <Link to="/faq">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold px-8 py-3.5 rounded-2xl shadow-lg hover:shadow-xl transition-shadow text-sm"
          >
            See All FAQs
            <FaArrowRight className="text-xs" />
          </motion.button>
        </Link>
      </div>
    </div>
  );
};

export default FAQs;
