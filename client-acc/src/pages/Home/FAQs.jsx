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
    <div className="py-20 border-t border-slate-200/80">
      <div className="max-w-[1280px] mx-auto px-6 md:px-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20 text-xs font-black uppercase tracking-widest mb-4 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-secondary)]" />
            Help &amp; Support
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-[var(--color-primary)] mb-4 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-slate-600 text-base max-w-2xl mx-auto">
            Browse through quick answers regarding council activities, academic policies, and student resources.
          </p>
        </div>

        {/* FAQ List */}
        <div className="max-w-3xl mx-auto space-y-4">
          {faqData.map((faq, index) => (
            <motion.div
              key={index}
              layout
              className="bg-gradient-to-r from-white/95 via-sky-50/25 to-blue-50/35 backdrop-blur-2xl border-2 border-[var(--color-secondary)]/40 hover:border-[var(--color-primary-accent)]/60 rounded-2xl p-6 sm:p-7 cursor-pointer transition-all duration-300 shadow-[0_10px_35px_rgba(11,30,63,0.06)] hover:shadow-[0_16px_45px_var(--color-secondary-glow)]"
              onClick={() => toggleQuestion(index)}
            >
              <div className="flex justify-between items-center gap-4">
                <h3 className="text-base sm:text-lg font-bold text-[var(--color-primary)] tracking-tight">
                  {faq.question}
                </h3>
                <span className="text-[var(--color-primary)] shrink-0 text-sm p-2 bg-sky-100 border border-sky-300 rounded-full shadow-xs">
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
                    className="mt-4 pt-4 border-t border-slate-200/80 text-slate-700 text-sm sm:text-base leading-relaxed font-normal"
                  >
                    {faq.answer}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* See All FAQs Button */}
        <div className="flex justify-center mt-12">
          <Link to="/faq">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-3 text-sm md:text-base font-bold text-white bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-primary-accent)] to-[var(--color-secondary)] hover:from-[var(--color-primary-accent)] hover:to-[var(--color-secondary-soft)] border border-white/20 px-8 py-3.5 rounded-full transition-all shadow-md hover:shadow-[0_8px_25px_var(--color-secondary-glow)] cursor-pointer group"
            >
              <span>Explore All FAQs</span>
              <FaArrowRight className="text-xs text-[#FCE7F3] group-hover:translate-x-1 transition-all" />
            </motion.button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FAQs;
