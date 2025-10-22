import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FiMenu, FiX } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import logo from "/logo.png";

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = () => setIsOpen(!isOpen);

  const menuItems = [
    { name: "Home", path: "/" },
    { name: "Wings", path: "/wings" },
    { name: "Contact Us", path: "/contact-us" },
  ];

  return (
    <nav className="bg-white shadow-md fixed w-full z-50">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          {/* Logo Section */}
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center">
              <img src={logo} alt="logo" className="h-12 sm:h-16 w-auto" />
              <p className="ml-2  sm:block font-semibold text-md md:text-lg sm:text-xl">
                Academic & Career Council
              </p>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-6">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`px-3 py-2 rounded-md text-lg font-medium ${
                  location.pathname === item.path
                    ? "text-blue-600"
                    : "text-gray-800"
                } hover:text-black transition-colors duration-300`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/*Login on large device */}
          <div className="hidden md:flex">
            <button className="px-6 py-2 text-lg bg-blue-600 rounded-full text-white hover:bg-blue-700 transition-all duration-300">
              Login
            </button>
          </div>

          {/*Hamburger */}
          <div className="md:hidden flex items-center ml-3">
            <button
              onClick={toggleMenu}
              className="focus:outline-none text-gray-800 text-3xl"
            >
              {isOpen ? <FiX /> : <FiMenu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown  */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden bg-white shadow-lg border-t border-gray-200"
          >
            <ul className="px-4 pt-4 pb-6 space-y-3">
              {menuItems.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      location.pathname === item.path
                        ? "text-blue-600"
                        : "text-gray-800"
                    } hover:text-blue-700 transition-colors duration-300`}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}

              {/* Login */}
              <li>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full text-left text-white text-lg font-semibold uppercase tracking-wider bg-linear-to-r from-blue-700 to-blue-500 px-6 py-2 rounded-full hover:from-blue-600 hover:to-blue-400 transition-all duration-300 ease-in-out"
                >
                  Login
                </button>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

export default Navbar;
