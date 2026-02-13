import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
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
      answer: "You can access the templates here:Google Slides Template – https://docs.google.com/presentation/d/1NJXFVM8HsHpLi5mhjGO2Cm0lOGuTbKe2vSn93sbyLjQ/edit Overleaf LaTeX Template – https://www.overleaf.com/latex/templates/iit-patna-resume/ddnnnxjgzckp"
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
      <p className="text-center text-gray-500 mt-6 px-4">
        No FAQs available for this wing.
      </p>
    );
  }

  // Show first 4 by default
  const visibleFaqs = showAll ? faqs : faqs.slice(0, 4);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-black mb-3">
          FAQs
        </h1>
        <p className="text-gray-600 text-sm sm:text-lg max-w-2xl mx-auto">
          Browse through the FAQs below to answer most of your queries.
        </p>
      </div>

      {/* FAQ List */}
      <div className="space-y-3">
        {visibleFaqs.map((faq, index) => (
          <motion.div
            key={index}
            layout
            className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 p-4 sm:p-6 cursor-pointer border border-gray-200"
            onClick={() => toggleQuestion(index)}
          >
            <div className="flex justify-between items-start sm:items-center gap-4">
              <h2 className="text-sm sm:text-lg font-medium text-gray-800 leading-snug">
                {faq.question}
              </h2>
              <span className="text-blue-600 mt-1 sm:mt-0">
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
                  className="mt-4 text-gray-600 text-sm sm:text-base leading-relaxed"
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
        <div className="text-center mt-8">
          <button
            onClick={() => setShowAll(!showAll)}
            className="px-6 py-2 rounded-full border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white transition-all duration-300 text-sm sm:text-base"
          >
            {showAll ? "Show Less" : "Read More"}
          </button>
        </div>
      )}
    </div>
  );
};

export default FAQs;
