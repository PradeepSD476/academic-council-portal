import React, { useState, useContext, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FiMenu, FiX, FiLogOut, FiGrid, FiChevronDown, FiUser } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import logo from "/logo.png";
import AuthContext from "../../context/auth/authContext";

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdown, setDropdown] = useState(false);
  const { user, logout, isAuthenticated } = useContext(AuthContext);
  const dropdownRef = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();

  const toggleMenu = () => setIsOpen(!isOpen);

  const menuItems = [
    { name: "Home", path: "/" },
    { name: "Wings", path: "/wings" },
    { name: "ACC Team", path: "/team" },
    { name: "Academic Administrators", path: "/administrators" },
  ];

  const handleLogout = async () => {
    await logout();
    setDropdown(false);
    navigate("/login");
  };

  const getDashboardPath = () => {
    if (user?.role === "FACULTY") return "/admin/dashboard";
    return "/dashboard/courses";
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Derive a short display name
  const displayName = user?.displayName?.split(" ")[0] || user?.email?.split("@")[0] || "Student";

  return (
    <nav className="bg-white shadow-md fixed w-full z-50">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          {/* Logo */}
          <div className="flex items-center space-x-3 shrink-0">
            <Link to="/" className="flex items-center">
              <img src={logo} alt="logo" className="h-12 sm:h-16 w-auto" />
              <p className="ml-2 font-semibold text-sm md:text-lg lg:text-xl whitespace-nowrap hidden sm:block">
                Academic &amp; Career Council
              </p>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-6">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`px-3 py-2 rounded-md text-lg font-medium transition-colors ${
                  location.pathname === item.path
                    ? "text-blue-600"
                    : "text-gray-800 hover:text-blue-500"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Desktop Auth Section */}
          <div className="flex justify-end items-center shrink-0">
            <div className="hidden md:flex items-center">
              {!isAuthenticated ? (
                /* ΓöÇΓöÇ Login Button ΓöÇΓöÇ */
                <Link
                  to="/login"
                  className="px-6 py-2 text-lg bg-blue-600 rounded-full text-white hover:bg-blue-700 transition shadow-sm"
                >
                  Login
                </Link>
              ) : (
                /* ΓöÇΓöÇ Student Dashboard CTA ΓöÇΓöÇ */
                <div className="relative" ref={dropdownRef}>
                  {/* Main Dashboard button */}
                  <button
                    onClick={() => setDropdown((prev) => !prev)}
                    className="group flex items-center gap-2.5 px-4 py-2 rounded-xl
                               bg-gradient-to-r from-blue-600 to-indigo-600
                               hover:from-blue-700 hover:to-indigo-700
                               text-white font-semibold text-sm
                               shadow-md hover:shadow-lg
                               transition-all duration-200 ease-out
                               focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                    aria-haspopup="true"
                    aria-expanded={dropdown}
                  >
                    {/* Avatar circle */}
                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-white/25 text-white shrink-0">
                      <FiUser className="text-sm" />
                    </span>

                    {/* Label */}
                    <span className="hidden lg:inline leading-none">
                      {displayName}
                    </span>

                    {/* Dashboard text */}
                    <span className="hidden sm:inline leading-none font-bold text-white/90">
                      ┬╖ Dashboard
                    </span>

                    {/* Chevron */}
                    <FiChevronDown
                      className={`text-white/80 transition-transform duration-200 ${
                        dropdown ? "rotate-180" : "rotate-0"
                      }`}
                    />
                  </button>

                  {/* Dropdown menu */}
                  <AnimatePresence>
                    {dropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.18, ease: "easeOut" }}
                        className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
                      >
                        {/* User info header */}
                        <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
                          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                            Signed in as
                          </p>
                          <p className="text-sm font-bold text-gray-800 truncate mt-0.5">
                            {user?.displayName || user?.email || "Student"}
                          </p>
                          {user?.role && (
                            <span className="inline-flex mt-1 items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700 uppercase tracking-wide">
                              {user.role.replace(/_/g, " ")}
                            </span>
                          )}
                        </div>

                        {/* Go to Dashboard */}
                        <button
                          onClick={() => {
                            navigate(getDashboardPath());
                            setDropdown(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-gray-700
                                     hover:bg-blue-50 hover:text-blue-700 transition-colors group"
                        >
                          <FiGrid className="text-blue-500 group-hover:scale-110 transition-transform" />
                          Go to Dashboard
                        </button>

                        {/* Divider */}
                        <div className="mx-4 border-t border-gray-100" />

                        {/* Logout */}
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-red-500
                                     hover:bg-red-50 hover:text-red-600 transition-colors group"
                        >
                          <FiLogOut className="group-hover:scale-110 transition-transform" />
                          Logout
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
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

      {/* ΓöÇΓöÇ Mobile Drawer ΓöÇΓöÇ */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white shadow-lg border-t border-gray-100 overflow-hidden"
          >
            <ul className="px-6 py-6 space-y-3">
              {menuItems.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`block py-2 text-xl font-semibold ${
                      location.pathname === item.path
                        ? "text-blue-600"
                        : "text-gray-800"
                    }`}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}

              <hr className="my-2 border-gray-100" />

              {!isAuthenticated ? (
                /* Mobile ΓÇô Login */
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
                /* Mobile ΓÇô Dashboard CTA */
                <li>
                  <div className="space-y-3 pt-1">
                    {/* User pill */}
                    <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
                      <span className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white shrink-0">
                        <FiUser className="text-base" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-800 truncate">
                          {user?.displayName || user?.email || "Student"}
                        </p>
                        {user?.role && (
                          <p className="text-[11px] text-blue-600 font-medium uppercase tracking-wide">
                            {user.role.replace(/_/g, " ")}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Dashboard button */}
                    <button
                      onClick={() => {
                        navigate(getDashboardPath());
                        setIsOpen(false);
                      }}
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl
                                 bg-gradient-to-r from-blue-600 to-indigo-600
                                 text-white text-base font-bold shadow-md
                                 hover:from-blue-700 hover:to-indigo-700
                                 active:scale-95 transition-all duration-150"
                    >
                      <FiGrid className="text-lg" />
                      Student Dashboard
                    </button>

                    {/* Logout */}
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsOpen(false);
                      }}
                      className="flex items-center gap-2 w-full py-2.5 px-3 rounded-xl
                                 text-red-500 text-base font-semibold
                                 hover:bg-red-50 transition-colors"
                    >
                      <FiLogOut />
                      Logout
                    </button>
                  </div>
                </li>
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

export default Navbar;
