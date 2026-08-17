import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { motion } from "framer-motion";
import { useParams } from "react-router-dom";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";


const successStories= {
  "academic-mentorship": [
    {
      id: 1,
      name: "Ananya Gupta",
      company: "McKinsey & Co.",
      address: ["New Delhi, India"],
      message:
        "The mentorship I received shaped my approach to academics and helped me secure top grades consistently.",
    },
    {
      id: 2,
      name: "Rohit Sharma",
      company: "Amazon",
      address: ["Bangalore, India"],
      message:
        "My mentor guided me not just academically but also helped me manage time efficiently during placements.",
    },
  ],

  "career-development": [
    {
      id: 3,
      name: "Priya Iyer",
      company: "Goldman Sachs",
      address: ["Mumbai, India"],
      message:
        "The Career Development Wing’s resume and interview sessions were game changers for my placement journey.",
    },
    {
      id: 4,
      name: "Karthik Raj",
      company: "Deloitte",
      address: ["Hyderabad, India"],
      message:
        "Through mock interviews and peer mentoring, I built the confidence needed to ace consulting interviews.",
    },
  ],

  "research": [
    {
      id: 5,
      name: "Simran Kaur",
      company: "IIT Madras Research Fellow",
      address: ["Chennai, India"],
      message:
        "The Research Wing opened my eyes to interdisciplinary research and helped me publish my first paper.",
    },
    {
      id: 6,
      name: "Aditya Verma",
      company: "PhD, ETH Zurich",
      address: ["Zurich, Switzerland"],
      message:
        "Guidance from professors and peers in the R&D wing helped me secure a PhD position abroad.",
    },
  ],

  "placement": [
    {
      id: 7,
      name: "Neha Singh",
      company: "Microsoft",
      address: ["Hyderabad, India"],
      message:
        "The Placement Cell’s preparation bootcamp was instrumental in helping me crack Microsoft interviews.",
    },
    {
      id: 8,
      name: "Ravi Patel",
      company: "Google",
      address: ["Bangalore, India"],
      message:
        "Mock interviews and technical preparation sessions made all the difference in landing my dream job.",
    },
  ],

  "internship": [
    {
      id: 9,
      name: "Isha Mehta",
      company: "Samsung R&D",
      address: ["Noida, India"],
      message:
        "Thanks to the Internship Cell, I secured a summer internship that converted into a full-time offer.",
    },
    {
      id: 10,
      name: "Amit Kumar",
      company: "Intel",
      address: ["Bangalore, India"],
      message:
        "The internship support and guidance on resume building made me industry-ready early in my journey.",
    },
  ],

  "alumni": [
    {
      id: 11,
      name: "Sanya Malhotra",
      company: "Tesla",
      address: ["California, USA"],
      message:
        "Reconnecting with alumni through this wing gave me valuable insights into the tech industry abroad.",
    },
    {
      id: 12,
      name: "Arjun Deshmukh",
      company: "Apple Inc.",
      address: ["Cupertino, USA"],
      message:
        "Alumni interactions shaped my understanding of global product development and design excellence.",
    },
  ],

  "pr": [
    {
      id: 13,
      name: "Tanya Bansal",
      company: "Ogilvy & Mather",
      address: ["Mumbai, India"],
      message:
        "The PR & Outreach Wing gave me hands-on experience managing campaigns — now it’s my full-time job!",
    },
    {
      id: 14,
      name: "Vivek Tiwari",
      company: "Meta",
      address: ["Singapore"],
      message:
        "Public relations work helped me build communication skills that proved crucial for leadership roles.",
    },
  ],
};

const SuccessStories = () => {
  const {wingId} = useParams();
  const stories = successStories[wingId] || [];
  return (
    <section className="max-w-7xl mx-auto px-6 py-16">
      <div className="text-center mb-12">
        <motion.span
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-xs text-[#0B1E3F] font-bold uppercase tracking-widest bg-[#0B1E3F]/10 border border-[#0B1E3F]/20 px-4 py-1.5 rounded-full"
        >
          Success Stories
        </motion.span>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-3xl md:text-5xl font-extrabold mt-3 text-[#0B1E3F] tracking-tight"
        >
          Campus Chronicles
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7 }}
          className="mt-4 text-slate-600 max-w-2xl mx-auto text-sm sm:text-base"
        >
          Compelling narratives detailing significant achievements and profound
          transformations across various domains.
        </motion.p>
      </div>
      <div className="relative">
        <Swiper
          modules={[Navigation, Pagination]}
          navigation={{
            nextEl: ".custom-next",
            prevEl: ".custom-prev",
          }}
          pagination={{ clickable: true }}
          spaceBetween={30}
          breakpoints={{
            0: { slidesPerView: 1 },
            1024: { slidesPerView: 2 },
          }}
          className="!pb-14"
        >
          {stories.map((story) => (
            <SwiperSlide key={story.id}>
              <div className="flex justify-center items-stretch h-full">
                <div className="bg-gradient-to-br from-white/95 via-blue-50/30 to-sky-50/40 backdrop-blur-2xl border-2 border-[var(--color-primary-accent)]/20 hover:border-[var(--color-secondary)]/50 w-full max-w-md rounded-[2.2rem] p-8 flex flex-col justify-between h-full min-h-[300px] transition-all shadow-[0_16px_45px_rgba(11,30,63,0.08)] hover:shadow-[0_24px_60px_var(--color-secondary-glow)]">
                  <div>
                    <h3 className="text-xl font-black text-[var(--color-primary)] tracking-tight">
                      {story.name}
                    </h3>
                    <p className="text-[var(--color-secondary)] text-xs font-black uppercase tracking-wider mt-1">
                      {story.company}
                    </p>
                    <p className="text-slate-600 text-xs mt-1 font-medium">
                      {story.address.join(", ")}
                    </p>
                  </div>
                  <div className="border-t border-slate-200/80 my-4"></div>
                  <p className="text-slate-700 text-sm leading-relaxed italic font-normal">
                    “{story.message}”
                  </p>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
        <div className="absolute top-1/2 -left-3 md:-left-5 -translate-y-1/2 w-10 h-10 rounded-full bg-white/95 border-2 border-slate-200 text-[#0B1E3F] hover:text-white hover:bg-[#0B1E3F] flex items-center justify-center cursor-pointer custom-prev z-10 shadow-lg transition-all">
          <FaChevronLeft className="text-xs" />
        </div>
        <div className="absolute top-1/2 -right-3 md:-right-5 -translate-y-1/2 w-10 h-10 rounded-full bg-white/95 border-2 border-slate-200 text-[#0B1E3F] hover:text-white hover:bg-[#0B1E3F] flex items-center justify-center cursor-pointer custom-next z-10 shadow-lg transition-all">
          <FaChevronRight className="text-xs" />
        </div>
      </div>
    </section>
  );
};

export default SuccessStories;
