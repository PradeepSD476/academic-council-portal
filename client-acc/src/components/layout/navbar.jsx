import React, { useState, useContext, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FiMenu,
  FiX,
  FiLogOut,
  FiGrid,
  FiChevronDown,
  FiUser,
  FiSettings,
  FiArrowRight,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import AuthContext from "../../context/auth/authContext";

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdown, setDropdown] = useState(false);
  const { user, logout, isAuthenticated } = useContext(AuthContext);
  const dropdownRef = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { name: "Home", path: "/" },
    { name: "Wings", path: "/wings" },
    { name: "ACC Team", path: "/team" },
    { name: "Academic Administrators", path: "/administrators" },
    { name: "FAQs", path: "/faq" },
    { name: "SMP Portal", path: "/smp/", external: true },
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

  const displayName =
    user?.displayName?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "Student";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200/80 transition-all duration-200">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-12">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Institute Identity */}
          <div className="shrink-0">
            <Link to="/" className="flex items-center gap-3 group">
              <img
                src="/logo.png"
                alt="ACC IIT Patna Logo"
                className="h-10 w-auto object-contain shrink-0 group-hover:scale-105 transition-transform"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
              <div className="flex flex-col">
                <span className="font-bold text-slate-950 text-[14.5px] sm:text-[15px] tracking-tight leading-tight group-hover:text-slate-900 transition-colors">
                  Academic &amp; Career Council
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-6 xl:gap-8">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              if (item.external) {
                return (
                  <a
                    key={item.name}
                    href={item.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[13.5px] py-1 transition-colors duration-150 relative cursor-pointer text-slate-600 hover:text-slate-950 font-medium"
                  >
                    <span>{item.name}</span>
                  </a>
                );
              }
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`text-[13.5px] py-1 transition-colors duration-150 relative cursor-pointer ${isActive
                      ? "text-slate-950 font-bold"
                      : "text-slate-600 hover:text-slate-950 font-medium"
                    }`}
                >
                  <span>{item.name}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute -bottom-1.5 left-0 right-0 h-[2px] bg-blue-600 rounded-full"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Desktop Auth Section */}
          <div className="flex items-center shrink-0">
            <div className="hidden lg:flex items-center gap-2.5">
              {!isAuthenticated ? (
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold shadow-xs hover:shadow transition-all duration-200 cursor-pointer"
                >
                  <span>Portal Login</span>
                  <FiArrowRight className="text-xs" />
                </Link>
              ) : (
                <div className="relative" ref={dropdownRef}>
                  {/* User Profile Pill Toggle */}
                  <button
                    onClick={() => setDropdown((prev) => !prev)}
                    className="flex items-center gap-2 pl-2 pr-3 py-1.5 bg-white/90 border border-slate-200 text-slate-900 text-xs rounded-lg hover:border-slate-300 hover:bg-white transition-all cursor-pointer shadow-2xs"
                    aria-haspopup="true"
                    aria-expanded={dropdown}
                  >
                    <span className="flex items-center justify-center w-6 h-6 rounded-md bg-blue-50 text-blue-600 border border-blue-100 font-bold text-[11px] shrink-0">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                    <span className="font-semibold text-slate-800 text-xs truncate max-w-[120px]">
                      {displayName}
                    </span>
                    <FiChevronDown
                      className={`text-slate-400 text-xs transition-transform duration-150 ${dropdown ? "rotate-180" : "rotate-0"
                        }`}
                    />
                  </button>

                  <AnimatePresence>
                    {dropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: 4, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden text-slate-800 z-50"
                      >
                        {/* User info */}
                        <div className="px-3.5 py-3 bg-slate-50 border-b border-slate-100">
                          <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                            Signed In
                          </p>
                          <p className="text-xs font-bold text-slate-950 truncate mt-0.5">
                            {user?.displayName || user?.email || "Student Scholar"}
                          </p>
                          {user?.role && (
                            <span className="inline-block mt-1 px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-semibold rounded">
                              {user.role.replace(/_/g, " ")}
                            </span>
                          )}
                        </div>

                        {/* Menu list */}
                        <div className="p-1 space-y-0.5 text-xs">
                          <button
                            onClick={() => {
                              navigate(getDashboardPath());
                              setDropdown(false);
                            }}
                            className="flex items-center gap-2.5 w-full px-2.5 py-2 font-medium text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-md transition-colors text-left cursor-pointer"
                          >
                            <FiGrid className="text-sm text-blue-600" />
                            <span>My Dashboard</span>
                          </button>

                          <div className="h-px bg-slate-100 my-1" />

                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-2.5 w-full px-2.5 py-2 font-medium text-rose-600 hover:bg-rose-50 rounded-md transition-colors text-left cursor-pointer"
                          >
                            <FiLogOut className="text-sm" />
                            <span>Sign Out</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Mobile Hamburger toggle */}
            <div className="lg:hidden flex items-center ml-2">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-slate-700 hover:text-slate-950 focus:outline-none rounded-md hover:bg-slate-100 transition-colors"
                aria-label="Toggle menu"
              >
                {isOpen ? <FiX className="text-xl" /> : <FiMenu className="text-xl" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden bg-white/95 backdrop-blur-xl border-b border-slate-200/80 overflow-hidden"
          >
            <ul className="px-5 py-4 space-y-1">
              {menuItems.map((item) => (
                <li key={item.name}>
                  {item.external ? (
                    <a
                      href={item.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setIsOpen(false)}
                      className="block py-2 text-sm font-medium transition-colors text-slate-600 hover:text-slate-950"
                    >
                      {item.name}
                    </a>
                  ) : (
                    <Link
                      to={item.path}
                      onClick={() => setIsOpen(false)}
                      className={`block py-2 text-sm font-medium transition-colors ${location.pathname === item.path
                          ? "text-slate-950 font-bold border-l-2 border-blue-600 pl-2.5"
                          : "text-slate-600 hover:text-slate-950"
                        }`}
                    >
                      {item.name}
                    </Link>
                  )}
                </li>
              ))}

              <li className="pt-4 border-t border-slate-100">
                {!isAuthenticated ? (
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="w-full text-center block py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold transition-colors"
                  >
                    Login to Portal
                  </Link>
                ) : (
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        navigate(getDashboardPath());
                        setIsOpen(false);
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      <FiGrid className="text-sm" />
                      <span>Open Dashboard</span>
                    </button>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsOpen(false);
                      }}
                      className="academic-btn-outline w-full text-rose-600 border-rose-200 hover:bg-rose-50"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

export default Navbar;

