import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import { FaChevronLeft, FaChevronRight, FaQuoteLeft } from "react-icons/fa";
import { motion } from "framer-motion";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const successStories = [
  {
    id: 1,
    name: "Manvendra Singh",
    title: "B.Tech, Electrical and Electronics Engineering, IIT Patna",
    achievement: "AIR 112, UPSC ESE 2025",
    message:
      "Diagnosed with cerebral palsy at six months of age, Manvendra Singh overcame significant physical challenges through resilience and determination. He cleared JEE in his first attempt, graduated from IIT Patna in Electrical and Electronics Engineering, and went on to secure AIR 112 in ESE 2025. His journey stands as a powerful reminder that adversity can be transformed into distinction through hard work and self-belief.",
  },
  {
    id: 2,
    name: "Abhay Kumar",
    title: "Chemical and Biochemical Engineering, IIT Patna",
    achievement: "AIR 14 (GATE 2025) · BPCL",
    message:
      "Abhay Kumar cracked GATE twice, securing AIR 66 in 2024 and an exceptional AIR 14 in GATE 2025 (Chemical Engineering). Alongside his academic excellence, he earned an on-campus placement at Bharat Petroleum Corporation Limited (BPCL). His journey reflects perseverance and the pursuit of excellence in both academics and professional growth.",
  },
  {
    id: 3,
    name: "Dr. Pranjali Sharma",
    title: "B.Tech (Chemical Science and Technology), IIT Patna, 2018",
    achievement: "Assistant Professor at IIT Roorkee",
    message:
      "After completing her undergraduate studies at IIT Patna, Dr. Dr. Pranjali Sharma pursued advanced research and built a strong academic profile, leading to her appointment as an Assistant Professor at IIT Roorkee. Her journey reflects dedication to research, teaching, and academic excellence at premier institutions.",
  },
  {
    id: 4,
    name: "Pavan Teja Machavarapu",
    title: "Alumnus, IIT Patna | MS in Data Science, University of Cincinnati",
    achievement: "Co-Founder, Autosure.ai",
    message:
      "After graduating from IIT Patna, Pavan Teja Machavarapu pursued a Master’s in Data Science at the University of Cincinnati. He is currently the Co-Founder of Autosure.ai, leading data-driven product development and innovation. His journey showcases a blend of global academics and entrepreneurship.",
  },
];

const SuccessStories = () => {
  return (
    <div className="py-20 relative overflow-hidden">
      <section className="max-w-[1280px] mx-auto px-6 md:px-16 relative z-10">
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 text-xs text-[var(--color-primary)] font-black uppercase tracking-widest bg-[var(--color-primary)]/10 backdrop-blur-md border border-[var(--color-primary)]/20 px-4 py-1.5 rounded-full shadow-xs"
          >
            <span className="w-2 h-2 rounded-full bg-[var(--color-secondary)] animate-pulse" />
            Distinguished Alumni &amp; Scholars
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-5xl font-black mt-3 text-[var(--color-primary)] tracking-tight"
          >
            Campus Chronicles
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="mt-4 text-slate-600 max-w-2xl mx-auto text-base sm:text-lg"
          >
            Inspiring narratives of distinction, research breakthroughs, and leadership from IIT Patna alumni &amp; students.
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
            {successStories.map((story) => (
              <SwiperSlide key={story.id}>
                <div className="flex justify-center items-stretch h-full">
                  <div className="bg-gradient-to-br from-white/95 via-blue-50/30 to-sky-50/40 backdrop-blur-2xl border-2 border-[var(--color-primary-accent)]/20 hover:border-[var(--color-secondary)]/50 w-full rounded-[2.5rem] p-8 sm:p-10 flex flex-col justify-between h-full min-h-[340px] transition-all duration-500 hover:shadow-[0_24px_60px_var(--color-secondary-glow)] shadow-[0_16px_45px_rgba(11,30,63,0.08)] relative overflow-hidden group">
                    {/* Decorative watermark quote */}
                    <FaQuoteLeft className="absolute top-6 right-8 text-6xl text-[var(--color-primary-accent)]/10 pointer-events-none group-hover:text-[var(--color-secondary)]/15 transition-colors duration-500" />

                    <div className="relative z-10">
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                        <div>
                          <h3 className="text-2xl font-black text-[var(--color-primary)] tracking-tight group-hover:text-[var(--color-primary-accent)] transition-colors">
                            {story.name}
                          </h3>
                          {story.title && (
                            <p className="text-slate-600 text-xs sm:text-sm mt-0.5 font-medium">
                              {story.title}
                            </p>
                          )}
                        </div>

                        <div className="px-4 py-1.5 bg-gradient-to-r from-sky-100 to-blue-100 border border-sky-300 text-[var(--color-primary)] rounded-full shadow-xs">
                          <p className="text-[11px] font-black uppercase tracking-wider">
                            {story.achievement}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="relative z-10 mt-6 pt-6 border-t border-slate-200/80">
                      <p className="text-slate-700 text-[15px] sm:text-base leading-relaxed italic font-normal">
                        “{story.message}”
                      </p>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          <div className="absolute top-1/2 -left-3 md:-left-6 -translate-y-1/2 w-12 h-12 rounded-full bg-white/95 backdrop-blur-2xl border-2 border-slate-200 text-[#0B1E3F] hover:text-white hover:bg-[#0B1E3F] flex items-center justify-center cursor-pointer custom-prev z-10 shadow-md hover:shadow-lg transition-all hover:scale-110 active:scale-95">
            <FaChevronLeft className="text-sm" />
          </div>
          <div className="absolute top-1/2 -right-3 md:-right-6 -translate-y-1/2 w-12 h-12 rounded-full bg-white/95 backdrop-blur-2xl border-2 border-slate-200 text-[#0B1E3F] hover:text-white hover:bg-[#0B1E3F] flex items-center justify-center cursor-pointer custom-next z-10 shadow-md hover:shadow-lg transition-all hover:scale-110 active:scale-95">
            <FaChevronRight className="text-sm" />
          </div>
        </div>
      </section>
    </div>
  );
};

export default SuccessStories;
