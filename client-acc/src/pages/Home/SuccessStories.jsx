import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { motion } from "framer-motion";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const successStories = [
  {
    id: 1,
    name: "Manvendra Singh",
    title: "B.Tech, Electrical and Electronics Engineering, IIT Patna",
    achievement: "AIR 112, UPSC Engineering Services Examination (ESE) 2025",
    message:
      "Diagnosed with cerebral palsy at six months of age, Manvendra Singh overcame significant physical challenges through resilience and determination. He cleared JEE in his first attempt, graduated from IIT Patna in Electrical and Electronics Engineering, and went on to secure AIR 112 in ESE 2025. His journey stands as a powerful reminder that adversity can be transformed into distinction through hard work and self-belief.",
  },
  {
    id: 2,
    name: "Abhay Kumar",
    title: "Chemical and Biochemical Engineering, IIT Patna",
    achievement:
      "AIR 66 (GATE 2024), AIR 14 (GATE 2025 – Chemical Engineering), Placed at BPCL",
    message:
      "Abhay Kumar cracked GATE twice, securing AIR 66 in 2024 and an exceptional AIR 14 in GATE 2025 (Chemical Engineering). Alongside his academic excellence, he earned an on-campus placement at Bharat Petroleum Corporation Limited (BPCL). His journey reflects perseverance and the pursuit of excellence in both academics and professional growth.",
  },
  {
    id: 3,
    name: "Dr. Pranjali Sharma",
    title:
      "B.Tech (Chemical Science and Technology), IIT Patna, 2018",
    achievement: "Assistant Professor at IIT Roorkee",
    message:
      "After completing her undergraduate studies at IIT Patna, Dr. Pranjali Sharma pursued advanced research and built a strong academic profile, leading to her appointment as an Assistant Professor at IIT Roorkee. Her journey reflects dedication to research, teaching, and academic excellence at premier institutions.",
  },
  {
    id: 4,
    name: "Pavan Teja Machavarapu",
    title:
      "Alumnus, IIT Patna | MS in Data Science, University of Cincinnati",
    achievement: "Co-Founder, Autosure.ai",
    message:
      "After graduating from IIT Patna, Pavan Teja Machavarapu pursued a Master’s in Data Science at the University of Cincinnati. He is currently the Co-Founder of Autosure.ai, leading data-driven product development and innovation. His journey showcases a blend of global academics and entrepreneurship.",
  },
];


const SuccessStories = () => {
  return (
    <section className="max-w-7xl mx-auto px-6 py-16">
      <div className="text-center mb-12">
        <motion.span
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-lg text-white font-semibold uppercase tracking-widest bg-linear-to-r from-blue-700 to-blue-500 px-6 py-1 rounded-2xl"
        >
          Success Stories
        </motion.span>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-3xl md:text-5xl font-bold mt-3 text-black"
        >
          Campus Chronicles
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7 }}
          className="mt-4 text-gray-600 max-w-2xl mx-auto"
        >
          Compelling narratives detailing significant achievements and profound
          transformations across various domains.
        </motion.p>
      </div>
      <div className="relative rounded-2xl shadow-lg p-6">
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
          className="pb-10!"
        >
          {successStories.map((story) => (
            <SwiperSlide key={story.id}>
              <div className="flex justify-center items-stretch h-full">
                <div className="bg-[#9BE6C1] w-full max-w-md rounded-xl shadow-md p-6 flex flex-col justify-between h-full min-h-[300px] transition-all hover:shadow-xl">
                  <div className="text-center md:text-left">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {story.name}
                    </h3>
                    <p className="text-gray-700 font-medium">
                      {story.company}
                    </p>
                    <p className="text-gray-500 text-sm">
                      {story.achievement}
                    </p>
                  </div>
                  <div className=" border-t border-gray-400"></div>
                  <p className="text-gray-700 text-sm leading-relaxed italic">
                    “{story.message}”
                  </p>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
        <div className="absolute top-1/2 left-0 sm:left-3 -translate-y-1/2 text-2xl text-gray-900 cursor-pointer custom-prev z-10">
          <FaChevronLeft />
        </div>
        <div className="absolute top-1/2 right-0 sm:right-3 -translate-y-1/2 text-2xl text-gray-900 cursor-pointer custom-next z-10">
          <FaChevronRight />
        </div>
      </div>
    </section>
  );
};

export default SuccessStories;
