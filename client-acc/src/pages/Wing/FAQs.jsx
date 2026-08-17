import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronDown } from "react-icons/fa";
import { useParams } from "react-router-dom";

export const faqsData = {
  "academic-mentorship": [
    {
      question: "Where to check grades?",
      answer: "Moodle → Dashboard → B.Tech Batch → Scroll to Current Semester."
    },
    {
      question: "Where to download transcript?",
      answer: "Dashboard >> All Courses >> 202X Batch >> PQR Branch >> PQR Branch >> Top Right block drawer >> Icon(Orange) >> My Total Credits"
    },
    {
      question: "Missing or wrong grade in transcript?",
      answer: "Update semester manually in Moodle profile. If unresolved, mail AR Academic (aracademic@iitp.ac.in)."
    },
    {
      question: "Need urgent transcript for internship?",
      answer: "Contact UGR."
    },
    {
      question: "Academic Calendar?",
      answer: "Check official IITP website for latest Academic Calendar PDF."
    },
    {
      question: "When will results be released?",
      answer: "Contact AR Academic."
    },
    {
      question: "When will supplementary exams be held?",
      answer: "Check Academic Calendar. Usually held after even semester."
    },
    {
      question: "Missed exam — what to do?",
      answer: "Medical: provide prescription and request make-up. Non-medical: request professor and forward application through academic hierarchy."
    },
    {
      question: "Criteria for supplementary exams?",
      answer: "CPI < 5. IADC cases usually next year."
    },
    {
      question: "What happens if caught cheating?",
      answer: "Strict punishment. You will appear before IADC and penalty will be decided."
    },
    {
      question: "Debarred due to low attendance — what now?",
      answer: "Request professor for make-up/supplementary and provide medical proof if applicable."
    },
    {
      question: "Registration procedure?",
      answer: "Enroll via Moodle Dashboard → All Courses → BTech semester course or fill offline form if provided."
    },
    {
      question: "Documents required for semester registration?",
      answer: "Fee receipt and Income Certificate."
    },
    {
      question: "Should income certificate be renewed every semester?",
      answer: "Yes, every odd semester."
    },
    {
      question: "Fees paid but not updated?",
      answer: "Mail AcadBTech and CC AIS Support."
    },
    {
      question: "Mess fees not updated?",
      answer: "Inform AIS Support, AcadBTech and SA Office."
    },
    {
      question: "Need extension in fee payment deadline?",
      answer: "Mail Adean Academic UG and CC DR Academic + AcadBTech."
    },
    {
      question: "Where to upload income certificate?",
      answer: "Upload on AIS Portal."
    },
    {
      question: "How to get MCM Scholarship?",
      answer: "Mail AR Academic."
    },
    {
      question: "Need Bonafide Certificate?",
      answer: "Pay via SBI Collect and submit receipt to AR Academic."
    },
    {
      question: "Need degree certificate after graduation?",
      answer: "Fill form from IITP Academic website and mail receipt to AcadBTech."
    }
  ],

  "career-development": [
    {
      question: "Official resume format of IIT Patna?",
      answer: "You can access the templates here: Google Slides Template – https://docs.google.com/presentation/d/1NJXFVM8HsHpLi5mhjGO2Cm0lOGuTbKe2vSn93sbyLjQ/edit | Overleaf LaTeX Template – https://www.overleaf.com/latex/templates/iit-patna-resume/ddnnnxjgzckp"
    },
    {
      question: "Application templates for official work?",
      answer: "Use SoAP templates provided by Academic Section."
    }
  ],

  "research": [
    {
      question: "How can I participate in research projects?",
      answer: "Contact faculty or join Research Wing."
    },
    {
      question: "Research internship resources?",
      answer: "Refer GitHub repositories like Research-Internships-for-Undergraduates and Summer Research Internship Programs."
    }
  ],

  "placement": [
    {
      question: "What is the Placement Cell responsible for?",
      answer: "Prepares students for placements and connects with companies."
    },
    {
      question: "Are mock interviews conducted?",
      answer: "Yes, mock interviews and resume reviews are organized."
    }
  ],

  "internship": [
    {
      question: "How do I apply for internships?",
      answer: "Check internship portal or contact wing lead."
    },
    {
      question: "Procedure for 6-month internship?",
      answer: "Follow official guidelines at acciitp.netlify.app."
    },
    {
      question: "Where to seek NOC for internship?",
      answer: "Write undertaking (75% attendance), apply leave on portal, get NOC format from AR Academic and complete required signatures."
    },
    {
      question: "How many days of classes can I miss during internship?",
      answer: "As long as attendance criteria is satisfied. Inform professors and Faculty Advisor."
    }
  ],

  "alumni": [
    {
      question: "How do I connect with alumni?",
      answer: "Use alumni network portal or contact Alumni Wing."
    }
  ],

  "pr": [
    {
      question: "How can I get involved in Public Relations & Outreach?",
      answer: "Join events, campaigns, and media outreach initiatives."
    }
  ]
};

const FAQs = () => {
  const { wingId } = useParams();
  const faqs = faqsData[wingId] || [];

  const [activeIndex, setActiveIndex] = useState(null);
  const [showAll, setShowAll] = useState(false);

  const toggleQuestion = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  if (faqs.length === 0) {
    return (
      <p className="text-center text-slate-500 mt-6 px-4">
        No FAQs available for this wing.
      </p>
    );
  }

  const visibleFaqs = showAll ? faqs : faqs.slice(0, 4);

  return (
    <div className="py-20 px-6 sm:px-12 md:px-16 lg:px-24 border-t border-slate-200/80">
      <div className="max-w-[1280px] mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="flex justify-center items-center gap-3 mb-4">
            <div className="w-[4px] h-8 bg-gradient-to-b from-[#D96B43] via-[#FED7AA] to-[#133E87] rounded-full shadow-[0_0_8px_#D96B43]" />
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#0B1E3F] uppercase tracking-tight">
              Wing FAQs
            </h2>
            <div className="w-[4px] h-8 bg-gradient-to-b from-[#D96B43] via-[#FED7AA] to-[#133E87] rounded-full shadow-[0_0_8px_#D96B43]" />
          </div>
          <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto font-normal">
            Browse through the FAQs below to answer most of your wing-specific queries.
          </p>
        </div>

        {/* FAQ List */}
        <div className="space-y-4 max-w-4xl mx-auto">
          {visibleFaqs.map((faq, index) => (
            <motion.div
              key={index}
              layout
              className="bg-gradient-to-r from-white/95 via-sky-50/25 to-blue-50/35 backdrop-blur-2xl rounded-2xl shadow-[0_10px_35px_rgba(11,30,63,0.06)] hover:shadow-[0_16px_45px_var(--color-secondary-glow)] transition-all duration-300 p-6 sm:p-7 cursor-pointer border-2 border-[var(--color-secondary)]/40 hover:border-[var(--color-primary-accent)]/60"
              onClick={() => toggleQuestion(index)}
            >
              <div className="flex justify-between items-start sm:items-center gap-4">
                <h3 className="text-base sm:text-lg font-bold text-[var(--color-primary)] leading-snug">
                  {faq.question}
                </h3>
                <span className={`text-[var(--color-primary)] mt-1 sm:mt-0 transition-transform duration-300 p-1.5 bg-sky-100 border border-sky-300 rounded-full shrink-0 ${activeIndex === index ? 'rotate-180' : ''}`}>
                  <FaChevronDown className="text-xs" />
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
                    className="mt-4 text-slate-700 text-sm sm:text-base leading-relaxed border-t border-slate-200/80 pt-4 font-normal"
                  >
                    {faq.answer}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Read More Button */}
        {faqs.length > 4 && (
          <div className="text-center mt-10">
            <button
              onClick={() => setShowAll(!showAll)}
              className="group inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-primary-accent)] to-[var(--color-secondary)] hover:from-[var(--color-primary-accent)] hover:to-[var(--color-secondary-soft)] text-white font-bold text-sm sm:text-base rounded-full transition-all duration-300 shadow-md hover:shadow-lg cursor-pointer border border-white/20"
            >
              {showAll ? "Show Fewer FAQs ↑" : "See All FAQs ↓"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FAQs;
