import React, { useState, useContext, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FiMenu, FiX, FiLogOut, FiGrid, FiChevronDown, FiUser, FiSettings } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
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

  const displayName = user?.displayName?.split(" ")[0] || user?.email?.split("@")[0] || "Student";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-2xl border-b border-slate-200/80 shadow-[0_4px_25px_rgba(15,23,42,0.05)] transition-all duration-300">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-16">
        <div className="flex justify-between items-center h-16">
          {/* Logo — bold typography with glowing accent dot */}
          <div className="shrink-0">
            <Link to="/" className="flex items-center gap-2.5 group">
              <span className="font-extrabold text-[var(--color-primary)] text-[15px] sm:text-[17px] tracking-tight leading-tight group-hover:text-[var(--color-primary-accent)] transition-colors">
                Academic &amp; Career Council
              </span>
              <span className="w-2 h-2 rounded-full bg-[var(--color-secondary)] shadow-[0_0_10px_var(--color-secondary)] animate-pulse" />
            </Link>
          </div>

          {/* Desktop Nav Links with animated sliding gradient underline */}
          <div className="hidden lg:flex items-center gap-6 xl:gap-8">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`relative py-1 text-[14px] lg:text-[15px] font-semibold transition-colors duration-200 group ${
                    isActive
                      ? "text-[var(--color-primary)] font-bold"
                      : "text-slate-600 hover:text-[var(--color-primary)]"
                  }`}
                >
                  <span>{item.name}</span>
                  {/* Animated Underline */}
                  <span
                    className={`absolute bottom-0 left-0 w-full h-[2.5px] bg-gradient-to-r from-[var(--color-secondary)] via-[var(--color-primary-accent)] to-[var(--color-primary)] rounded-full transition-transform duration-300 origin-left ${
                      isActive
                        ? "scale-x-100 shadow-[0_0_8px_var(--color-secondary)]"
                        : "scale-x-0 group-hover:scale-x-100"
                    }`}
                  />
                </Link>
              );
            })}
          </div>

          {/* Desktop Auth — right */}
          <div className="flex items-center shrink-0">
            <div className="hidden lg:flex items-center">
              {!isAuthenticated ? (
                <Link
                  to="/login"
                  className="relative text-[13px] sm:text-[14px] font-bold text-white px-5 py-2 rounded-full bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-primary-accent)] to-[var(--color-secondary)] hover:from-[var(--color-primary-accent)] hover:to-[var(--color-secondary-soft)] transition-all duration-300 shadow-sm hover:shadow-[0_8px_25px_var(--color-secondary-glow)] hover:scale-105 active:scale-95 tracking-wide flex items-center gap-1.5 group cursor-pointer"
                >
                  <span>Login</span>
                  <span className="text-[#E0F2FE] group-hover:translate-x-0.5 transition-transform">→</span>
                </Link>
              ) : (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdown((prev) => !prev)}
                    className="group flex items-center gap-2.5 px-4 py-1.5 bg-white/90 hover:bg-white border border-slate-200/90 text-[var(--color-primary)] font-semibold text-sm rounded-full backdrop-blur-md transition-all duration-200 focus:outline-none hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-xs"
                    aria-haspopup="true"
                    aria-expanded={dropdown}
                  >
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--color-primary)] text-[var(--color-secondary)] shrink-0 shadow-sm">
                      <FiUser className="text-xs" />
                    </span>
                    <span className="hidden lg:inline leading-none font-bold text-[var(--color-primary)]">{displayName}</span>
                    <span className="hidden sm:inline leading-none font-medium text-slate-500">
                      · Dashboard
                    </span>
                    <FiChevronDown
                      className={`text-slate-500 transition-transform duration-200 ${
                        dropdown ? "rotate-180" : "rotate-0"
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {dropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.18, ease: "easeOut" }}
                        className="absolute right-0 mt-2 w-56 bg-white/95 backdrop-blur-2xl shadow-[0_20px_50px_rgba(15,23,42,0.15)] border border-slate-200 rounded-2xl overflow-hidden text-slate-800"
                      >
                        {/* User info */}
                        <div className="px-4 py-3.5 bg-slate-50/80 border-b border-slate-100">
                          <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
                            Signed in as
                          </p>
                          <p className="text-sm font-bold text-[var(--color-primary)] truncate mt-0.5">
                            {user?.displayName || user?.email || "Student"}
                          </p>
                          {user?.role && (
                            <span className="inline-block mt-1 px-2 py-0.5 bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-[10px] font-bold uppercase rounded-full tracking-wider border border-[var(--color-primary)]/20">
                              {user.role.replace(/_/g, " ")}
                            </span>
                          )}
                        </div>

                        {/* Menu list */}
                        <div className="p-1.5 space-y-0.5">
                          <button
                            onClick={() => {
                              navigate(getDashboardPath());
                              setDropdown(false);
                            }}
                            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm font-medium text-slate-700 hover:text-[var(--color-primary)] hover:bg-slate-100 rounded-xl transition-colors text-left cursor-pointer"
                          >
                            <FiGrid className="text-base text-[#0284C7]" />
                            <span>My Dashboard</span>
                          </button>

                          <button
                            onClick={() => {
                              navigate("/dashboard/settings");
                              setDropdown(false);
                            }}
                            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm font-medium text-slate-700 hover:text-[var(--color-primary)] hover:bg-slate-100 rounded-xl transition-colors text-left cursor-pointer"
                          >
                            <FiSettings className="text-base text-slate-400" />
                            <span>Settings</span>
                          </button>

                          <div className="h-px bg-slate-100 my-1" />

                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-left cursor-pointer"
                          >
                            <FiLogOut className="text-base" />
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
            <div className="lg:hidden flex items-center ml-3">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-slate-700 hover:text-slate-950 focus:outline-none rounded-lg hover:bg-slate-100 transition-colors"
                aria-label="Toggle menu"
              >
                {isOpen ? <FiX className="text-2xl" /> : <FiMenu className="text-2xl" />}
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
            transition={{ duration: 0.25 }}
            className="lg:hidden bg-white/95 backdrop-blur-2xl border-b border-slate-200 overflow-hidden shadow-2xl"
          >
            <ul className="px-6 py-6 space-y-1">
              {menuItems.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center justify-between py-3 text-[16px] font-medium border-b border-slate-100 ${
                      location.pathname === item.path
                        ? "text-[var(--color-primary)] font-bold"
                        : "text-slate-600 hover:text-[var(--color-primary)]"
                    }`}
                  >
                    <span>{item.name}</span>
                    {location.pathname === item.path && (
                      <span className="w-2 h-2 rounded-full bg-[var(--color-secondary)] shadow-[0_0_8px_var(--color-secondary)]" />
                    )}
                  </Link>
                </li>
              ))}

              <li className="pt-5">
                {!isAuthenticated ? (
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="block text-center text-white bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-primary-accent)] to-[var(--color-secondary)] py-3.5 rounded-full text-[15px] font-bold tracking-wide shadow-md hover:shadow-lg transition-all"
                  >
                    Login to Portal
                  </Link>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="flex items-center justify-center w-9 h-9 rounded-full bg-[var(--color-primary)] text-[var(--color-secondary)] shrink-0 shadow-sm">
                        <FiUser className="text-base" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[var(--color-primary)] truncate">
                          {user?.displayName || user?.email || "Student"}
                        </p>
                        {user?.role && (
                          <p className="text-[11px] text-slate-600 font-semibold uppercase tracking-wide">
                            {user.role.replace(/_/g, " ")}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        navigate(getDashboardPath());
                        setIsOpen(false);
                      }}
                      className="flex items-center justify-center gap-2 w-full py-3.5 bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-primary-accent)] to-[var(--color-secondary)] text-white rounded-full text-[15px] font-bold hover:shadow-lg transition-all shadow-sm cursor-pointer"
                    >
                      <FiGrid className="text-lg text-[#E0F2FE]" />
                      Dashboard
                    </button>

                    <button
                      onClick={() => {
                        handleLogout();
                        setIsOpen(false);
                      }}
                      className="flex items-center justify-center gap-2 w-full py-2.5 px-3 text-rose-600 text-sm font-semibold hover:bg-rose-50 rounded-full transition-colors cursor-pointer"
                    >
                      <FiLogOut />
                      Logout
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
