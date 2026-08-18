import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
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
      "Diagnosed with cerebral palsy at six months of age, Manvendra Singh overcame significant physical challenges through resilience and determination. He cleared JEE in his first attempt, graduated from IIT Patna in EEE, and secured AIR 112 in ESE 2025.",
  },
  {
    id: 2,
    name: "Abhay Kumar",
    title: "Chemical and Biochemical Engineering, IIT Patna",
    achievement: "AIR 14 (GATE 2025) · BPCL",
    message:
      "Abhay Kumar secured AIR 66 in 2024 and an exceptional AIR 14 in GATE 2025 (Chemical Engineering). Alongside his academic distinction, he earned an on-campus placement at Bharat Petroleum Corporation Limited (BPCL).",
  },
  {
    id: 3,
    name: "Dr. Pranjali Sharma",
    title: "B.Tech (Chemical Science and Technology), IIT Patna, 2018",
    achievement: "Assistant Professor at IIT Roorkee",
    message:
      "After completing undergraduate studies at IIT Patna, Dr. Pranjali Sharma pursued advanced doctoral research, leading to her appointment as an Assistant Professor at IIT Roorkee.",
  },
  {
    id: 4,
    name: "Pavan Teja Machavarapu",
    title: "Alumnus, IIT Patna | MS in Data Science, University of Cincinnati",
    achievement: "Co-Founder, Autosure.ai",
    message:
      "After graduating from IIT Patna, Pavan Teja completed an MS in Data Science at the University of Cincinnati and currently serves as Co-Founder of Autosure.ai, leading data-driven product innovation.",
  },
];

const SuccessStories = () => {
  return (
    <div className="py-16 bg-white border-y border-slate-200">
      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-12">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="academic-badge mb-3">Distinguished Scholars</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
            Scholarly &amp; Career Distinction
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Notable academic breakthroughs and career milestones achieved by IIT Patna scholars and alumni.
          </p>
        </div>

        <div className="relative">
          <Swiper
            modules={[Navigation, Pagination]}
            navigation={{
              nextEl: ".custom-next",
              prevEl: ".custom-prev",
            }}
            pagination={{ clickable: true }}
            spaceBetween={24}
            breakpoints={{
              0: { slidesPerView: 1 },
              1024: { slidesPerView: 2 },
            }}
            className="!pb-12"
          >
            {successStories.map((story) => (
              <SwiperSlide key={story.id}>
                <div className="academic-card rounded-xl p-6 sm:p-8 flex flex-col justify-between h-full min-h-[260px]">
                  <div>
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-slate-950">
                          {story.name}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          {story.title}
                        </p>
                      </div>
                      <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-800 text-[11px] font-bold rounded">
                        {story.achievement}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-slate-600 text-xs sm:text-sm leading-relaxed italic">
                      “{story.message}”
                    </p>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          <div className="absolute top-1/2 -left-3 -translate-y-1/2 w-9 h-9 rounded-md bg-white border border-slate-200 text-slate-700 hover:text-slate-950 hover:bg-slate-50 flex items-center justify-center cursor-pointer custom-prev z-10 shadow-xs">
            <FiChevronLeft className="text-base" />
          </div>
          <div className="absolute top-1/2 -right-3 -translate-y-1/2 w-9 h-9 rounded-md bg-white border border-slate-200 text-slate-700 hover:text-slate-950 hover:bg-slate-50 flex items-center justify-center cursor-pointer custom-next z-10 shadow-xs">
            <FiChevronRight className="text-base" />
          </div>
        </div>
      </section>
    </div>
  );
};

export default SuccessStories;

