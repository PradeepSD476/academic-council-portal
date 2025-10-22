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
    name: "John Doe",
    company: "Tech Solutions Inc.",
    address: ["New York, USA"],
    message:"Working here helped me grow professionally and gave me the confidence to lead projects.",
  },
  {
    id: 2,
    name: "Jane Smith",
    company: "Innovate Labs",
    address: ["San Francisco, USA"],
    message:"I learned invaluable skills and connected with amazing mentors who guided my career.",
  },
  {
    id: 3,
    name: "Alex Johnson",
    company: "Global Tech Corp.",
    address: ["Seattle, USA"],
    message: "The experience and exposure I gained here helped me land my dream role.",
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
                      {story.address.join(", ")}
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
