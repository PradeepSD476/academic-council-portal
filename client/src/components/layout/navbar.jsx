import React, { useState, useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FiMenu, FiX, FiLogOut } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import logo from "/logo.png";
import AuthContext from "../../context/auth/authContext";

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdown, setDropdown] = useState(false);
  const { user, firebaseUser, logout, isAuthenticated } = useContext(AuthContext);

  const location = useLocation();
  const navigate = useNavigate();

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
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center">
              <img src={logo} alt="logo" className="h-12 sm:h-16 w-auto" />
              <p className="ml-2 font-semibold text-md md:text-lg sm:text-xl">
                Academic & Career Council
              </p>
            </Link>
          </div>

          <div className="hidden md:flex space-x-6">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`px-3 py-2 rounded-md text-lg font-medium ${
                  location.pathname === item.path
                    ? "text-blue-600"
                    : "text-gray-800"
                } hover:text-black transition`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center">
            {!isAuthenticated && (
              <Link
                to="/login"
                className="px-6 py-2 text-lg bg-blue-600 rounded-full text-white hover:bg-blue-700 transition"
              >
                Login
              </Link>
            )}

            {isAuthenticated && (
              <div className="relative">
                <img
                  src={user?.photoURL || "/default-avatar.png"}
                  onClick={() => setDropdown((prev) => !prev)}
                  className="h-12 w-12 rounded-full cursor-pointer border-2 border-blue-500"
                />

                {dropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border">
                    <button
                      onClick={() => {
                        navigate("/dashboard/courses");
                        setDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100"
                    >
                      Dashboard
                    </button>
                    <button
                      onClick={logout}
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <FiLogOut /> Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

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

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
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
                    } hover:text-blue-700`}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}

              {!isAuthenticated && (
                <li>
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="block text-center text-white bg-blue-600 px-6 py-2 rounded-full text-lg font-semibold"
                  >
                    Login
                  </Link>
                </li>
              )}

              {isAuthenticated && (
                <div className="mt-4 border-t pt-4 space-y-3">
                  <li>
                    <button
                      onClick={() => {
                        navigate("/dashboard/courses");
                        setIsOpen(false);
                      }}
                      className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-800 hover:text-blue-700 hover:bg-gray-50"
                    >
                      Dashboard
                    </button>
                  </li>

                  <div className="flex items-center justify-between px-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={user?.photoURL || "/default-avatar.png"}
                        className="h-10 w-10 rounded-full border border-gray-200"
                        alt="profile"
                      />
                      <p className="font-medium text-gray-700">{user?.displayName}</p>
                    </div>

                    <button
                      onClick={() => {
                        logout();
                        setIsOpen(false);
                      }}
                      className="text-red-600 p-2 hover:bg-red-50 rounded-full transition-colors"
                    >
                      <FiLogOut size={20} />
                    </button>
                  </div>
                </div>
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

export default Navbar;