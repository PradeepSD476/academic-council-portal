import React from "react";
import { Link } from "react-router-dom";
import logo from "/logo.png";

function Footer() {
  return (
    <footer className=" text-white mt-auto my-0">
      {/* Top bar */}
      <div className=" mx-auto   grid grid-cols-1 md:grid-cols-2 ">
        {/* Left Column */}
        <div className=" bg-[#153460] px-6 md:px-16 py-10">
          <div className="flex items-center mb-4">
            <Link to="/" className="flex items-center space-x-3">
              <img src={logo} alt="logo" className="h-14 w-auto" />
              <p className="font-semibold text-2xl leading-snug">
                Academic & Career Council
              </p>
            </Link>
          </div>

          <p className="text-gray-300 mb-4 leading-relaxed text-justify">
            The Academic & Career Council (ACC) of IIT Patna is a student body under
            the Student Gymkhana that fosters academic excellence, research,
            and career development for students through various initiatives
            and events.
          </p>

          <div>
            <h2 className="text-lg font-semibold mb-1 text-white">Contact</h2>
            <p className="text-gray-300 hover:text-white transition">
              acc_ug@iitp.ac.in
            </p>
          </div>
        </div>

        {/* Right Column */}
        <div className="grid grid-cols-2 gap-8 bg-[#1C4980] px-6 md:px-16 py-10">
          <div>
            <h1 className="text-lg text-center font-semibold mb-3 border-b border-blue-400 pb-1">
              Quick Links
            </h1>
            <ul className="space-y-2 text-gray-300 text-center">
              <li><Link to="/" className="hover:text-white transition">Home</Link></li>
              <li><Link to="/academics" className="hover:text-white transition">Academics</Link></li>
              <li><Link to="/research" className="hover:text-white transition">Research</Link></li>
              <li><Link to="/wings" className="hover:text-white transition">Wings</Link></li>
              <li><Link to="/resources" className="hover:text-white transition">Resources</Link></li>
              <li><Link to="/about" className="hover:text-white transition">About Us</Link></li>
            </ul>
          </div>

          <div>
            <h1 className="text-lg font-semibold mb-3 border-b border-blue-400 pb-1 text-center">
              Info
            </h1>
            <ul className="space-y-2 text-gray-300 text-center">
              <li><Link to="/team" className="hover:text-white transition">Team</Link></li>
              <li><Link to="/events" className="hover:text-white transition">Events</Link></li>
              <li><Link to="/about" className="hover:text-white transition">About Us</Link></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-700 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-black text-sm px-6 md:px-16">
          <ul className="flex flex-wrap justify-center md:justify-start gap-4 mb-3 md:mb-0 text-md">
            <li className="hover:text-white transition cursor-pointer">English</li>
            <li className="hover:text-white transition cursor-pointer">Privacy Policy</li>
            <li className="hover:text-white transition cursor-pointer">Support</li>
          </ul>

          <p className="text-center text-black text-md">
            &copy; 2025 Academic & Career Council, IIT Patna. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
