import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { useParams } from "react-router-dom";

// FAQs data per wing
export const faqsData = {
  "academic-mentorship": [
    {
      question: "How can I join the Academic Mentorship Wing?",
      answer: "You can apply through the Gymkhana portal..."
    },
    {
      question: "Do mentors guide for exams?",
      answer: "Yes, we provide guidance for midterms, finals, and projects."
    }
  ],
  "career-development": [
    {
      question: "How can I join the Career Development Wing?",
      answer: "Reach out via the Gymkhana portal or attend our workshops."
    }
  ],
  "research": [
    {
      question: "How can I participate in research projects?",
      answer: "Contact faculty or join our research wing to get guidance."
    }
  ],
  "placement": [
    {
      question: "What is the Placement Cell responsible for?",
      answer: "We help students prepare for placements and connect with companies."
    },
    {
      question: "Are mock interviews conducted?",
      answer: "Yes, we organize mock interviews and resume reviews."
    }
  ],
  "internship": [
    {
      question: "How do I apply for internships?",
      answer: "Check our internship portal or contact the wing lead."
    },
    {
      question: "Are internships only for final year students?",
      answer: "No, all students can apply based on eligibility."
    }
  ],
  "alumni": [
    {
      question: "How do I connect with alumni?",
      answer: "Use our alumni network portal or contact the Alumni Wing."
    }
  ],
  "pr": [
    {
      question: "How can I get involved in Public Relations & Outreach?",
      answer: "Join events, campaigns, and media outreach initiatives."
    },
     {
      question: "How can I get involved in Public Relations & Outreach?",
      answer: "Join events, campaigns, and media outreach initiatives."
    },
     {
      question: "How can I get involved in Public Relations & Outreach?",
      answer: "Join events, campaigns, and media outreach initiatives."
    },
     {
      question: "How can I get involved in Public Relations & Outreach?",
      answer: "Join events, campaigns, and media outreach initiatives."
    }
  ]
};

// will select FAQs based on wingId
const FAQs = () => {
  const { wingId } = useParams(); 
  const faqs = faqsData[wingId] || []; 
  const [activeIndex, setActiveIndex] = useState(null);

  const toggleQuestion = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  if (faqs.length === 0) {
    return <p className="text-center text-gray-500 mt-6">No FAQs available for this wing.</p>;
  }

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
      <div className="space-y-1">
        {faqs.map((faq, index) => (
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
