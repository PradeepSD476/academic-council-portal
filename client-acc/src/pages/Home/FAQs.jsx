import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiChevronDown, FiChevronUp, FiArrowRight } from "react-icons/fi";
import { Link } from "react-router-dom";
import faqDataFull from "../../data/faq.json";

// Filter 3 FAQs for the homepage
const faqData = faqDataFull.filter((faq) => faq.category === "ACC").slice(0, 3);

const FAQs = () => {
  const [activeIndex, setActiveIndex] = useState(null);

  const toggleQuestion = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className="py-16 bg-[#F8FAFC]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-12">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="academic-badge mb-3">Help &amp; Guidance</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
            Frequently Answered Questions
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Common academic inquiries regarding course archives, mentoring appointments, and council policies.
          </p>
        </div>

        {/* FAQ List */}
        <div className="max-w-3xl mx-auto space-y-3">
          {faqData.map((faq, index) => (
            <div
              key={index}
              className="academic-card rounded-xl p-5 cursor-pointer transition-colors"
              onClick={() => toggleQuestion(index)}
            >
              <div className="flex justify-between items-center gap-4">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                  {faq.question}
                </h3>
                <span className="text-slate-500 shrink-0 text-sm p-1.5 bg-slate-100 rounded-md">
                  {activeIndex === index ? <FiChevronUp /> : <FiChevronDown />}
                </span>
              </div>

              <AnimatePresence>
                {activeIndex === index && (
                  <motion.div
                    key="content"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <p className="mt-3 pt-3 border-t border-slate-100 text-slate-600 text-xs sm:text-sm leading-relaxed">
                      {faq.answer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        {/* Explore All FAQs Link */}
        <div className="flex justify-center mt-10">
          <Link
            to="/faq"
            className="academic-btn-outline gap-2 shadow-xs"
          >
            <span>Browse Full FAQ Repository</span>
            <FiArrowRight className="text-xs" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FAQs;

