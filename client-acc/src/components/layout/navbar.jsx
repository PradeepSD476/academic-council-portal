import React, { useState, useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FiMenu, FiX, FiLogOut } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import logo from "/logo.png";
import AuthContext from "../../context/auth/authContext";

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdown, setDropdown] = useState(false);
  const { user, logout, isAuthenticated } = useContext(AuthContext);

  const location = useLocation();
  const navigate = useNavigate();

  const toggleMenu = () => setIsOpen(!isOpen);

  const menuItems = [
    { name: "Home", path: "/" },
    { name: "Wings", path: "/wings" },
    { name: "The Team", path: "/team" },
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };


  return (
    <nav className="bg-white shadow-md fixed w-full z-50">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          <div className="flex flex-1 items-center space-x-3">
            <Link to="/" className="flex items-center">
              <img src={logo} alt="logo" className="h-12 sm:h-16 w-auto" />
              <p className="ml-2 font-semibold text-md md:text-lg sm:text-xl whitespace-nowrap">
                Academic & Career Council
              </p>
            </Link>
          </div>

          <div className="hidden lg:flex justify-center items-center space-x-8">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`px-3 py-2 rounded-md text-lg font-medium transition-colors ${location.pathname === item.path
                  ? "text-blue-600"
                  : "text-gray-800 hover:text-blue-500"
                  }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          <div className="flex flex-1 justify-end items-center">
            <div className="hidden md:flex items-center">
              {!isAuthenticated ? (
                <Link
                  to="/login"
                  className="px-6 py-2 text-lg bg-blue-600 rounded-full text-white hover:bg-blue-700 transition shadow-sm"
                >
                  Login
                </Link>
              ) : (
                <div className="relative">
                  <img
                    src={'/sp.pfp.jpg'}
                    onClick={() => setDropdown((prev) => !prev)}
                    className="h-12 w-12 rounded-full cursor-pointer border-2 border-blue-500 object-cover"
                    alt="profile"
                  />
                  <AnimatePresence>
                    {dropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-3 w-48 bg-white rounded-xl shadow-xl border overflow-hidden"
                      >
                        <button
                          onClick={() => {
                            navigate("/dashboard/courses");
                            setDropdown(false);
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                        >
                          Dashboard
                        </button>
                        
                        <button
                          onClick={logout}
                          className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors border-t"
                        >
                          <FiLogOut /> Logout
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center ml-4">
              <button
                onClick={toggleMenu}
                className="focus:outline-none text-gray-800 text-3xl p-1"
                aria-label="Toggle menu"
              >
                {isOpen ? <FiX /> : <FiMenu />}
              </button>
            </div>
          </div>

        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white shadow-lg border-t border-gray-100 overflow-hidden"
          >
            <ul className="px-6 py-8 space-y-4">
              {menuItems.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`block py-2 text-xl font-semibold ${location.pathname === item.path ? "text-blue-600" : "text-gray-800"
                      }`}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
              <hr className="my-4 border-gray-100" />
              {!isAuthenticated ? (
                <li>
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="block text-center text-white bg-blue-600 py-3 rounded-xl text-lg font-bold shadow-md"
                  >
                    Login
                  </Link>
                </li>
              ) : (
                <div className="space-y-4 pt-2">
                  <button
                    onClick={() => { navigate("/dashboard/courses"); setIsOpen(false); }}
                    className="block w-full text-left py-2 text-lg font-semibold text-gray-800"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => { handleLogout(); setIsOpen(false); }}
                    className="flex items-center gap-2 w-full text-left py-2 text-lg font-semibold text-red-600"
                  >
                    <FiLogOut /> Logout
                  </button>
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