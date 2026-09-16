import {
  BookOpen,
  Bell,
  Users,
  Layers,
  Settings,
  LogOut,
  Repeat,
  User,
  ChevronRight,
  ChevronLeft,
  Briefcase,
  Landmark,
  TrendingUp,
} from "lucide-react";
import { useContext, useEffect, useState } from "react";
import AuthContext from "../context/auth/authContext";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";

export default function DashboardLayout() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin =
    user?.role === "SUPER_ADMIN" ||
    user?.role === "FACULTY" ||
    user?.role === "ANNOUNCEMENT_ADMIN" ||
    user?.role === "RESOURCE_ADMIN" ||
    user?.role === "CAREER_ADMIN" ||
    user?.role === "FINANCE_ADMIN";
  const isCareerAdmin = user?.role === "CAREER_ADMIN";
  const isFinanceAdmin = user?.role === "FINANCE_ADMIN";
  const isSTUDENT = user?.role === "STUDENT";
  const isFaculty = user?.role === "FACULTY";

  const [open, setOpen] = useState(false);
  const [viewRole, setViewRole] = useState("STUDENT");

  useEffect(() => {
    if (window.innerWidth < 768) setOpen(false);

    if (isFaculty) {
      setViewRole("admin");
      return;
    }

    if (isAdmin) {
      if (location.pathname.startsWith("/admin")) {
        setViewRole("admin");
      } else {
        setViewRole("STUDENT");
      }
    }
  }, [location.pathname, isAdmin, isFaculty, isCareerAdmin]);

  return (
    <div className="flex h-[calc(100vh-64px)] bg-[#F8FAFC] text-slate-800 relative overflow-hidden">
      {/* Mobile Sidebar Toggle Button */}
      <button
        onClick={() => setOpen(!open)}
        className={`
            fixed top-20 z-[60] md:hidden
            flex items-center justify-center
            w-9 h-9 bg-white border border-slate-200 text-slate-800 rounded-r-lg shadow-md
            hover:bg-slate-50 transition-all cursor-pointer
            ${open ? "left-64" : "left-0"}
        `}
        aria-label={open ? "Close sidebar" : "Open sidebar"}
      >
        {open ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
      </button>

      {/* Mobile Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
            fixed top-16 left-0 h-[calc(100vh-64px)] w-64 z-50
            md:static md:h-full md:z-auto
            bg-white border-r border-slate-200 flex flex-col shrink-0
            transition-transform duration-200 ease-in-out
            ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Header / Brand */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div>
            <h1 className="text-sm font-bold text-slate-950 tracking-tight leading-tight">
              Portal Dashboard
            </h1>
          </div>
        </div>

        {/* User Card */}
        <div className="bg-gradient-to-br from-slate-50 via-white to-slate-50 rounded-xl mx-3.5 p-3.5 my-3 border border-slate-200/90 shadow-2xs relative">
          {(isAdmin || isCareerAdmin || isFinanceAdmin) && !isFaculty && (
            <button
              onClick={() => {
                const target =
                  viewRole === "STUDENT"
                    ? isCareerAdmin
                      ? "/admin/manage-posts"
                      : isFinanceAdmin
                        ? "/admin/finance-vault"
                        : "/admin/dashboard"
                    : "/dashboard/courses";
                setViewRole(viewRole === "STUDENT" ? "admin" : "STUDENT");
                navigate(target);
              }}
              title="Switch View"
              className="absolute top-2.5 right-2.5 p-1.5 bg-white border border-slate-200 rounded-md text-slate-500 hover:text-slate-950 hover:bg-slate-100 transition-colors cursor-pointer shadow-2xs"
            >
              <Repeat size={13} />
            </button>
          )}

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
              {user?.displayName?.charAt(0)?.toUpperCase() || "S"}
            </div>
            <div className="overflow-hidden min-w-0 pr-4">
              <p className="text-xs font-bold text-slate-950 truncate leading-tight">
                {user?.displayName || "Student Scholar"}
              </p>
              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-slate-700 mt-1 uppercase tracking-wider bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                <span>
                  {isAdmin
                    ? viewRole === "admin"
                      ? "Admin Mode"
                      : "Student View"
                    : "Student"}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto scrollbar-thin">
          {(isSTUDENT ||
            ((isAdmin || isCareerAdmin) && viewRole === "STUDENT")) && (
              <>
                <p className="px-3 text-[10px] font-bold text-slate-400 uppercase my-2 tracking-wider">
                  Student Navigation
                </p>
                <SidebarItem
                  to="/dashboard/courses"
                  icon={<Layers size={16} />}
                  iconColor="text-blue-600 bg-blue-50 border-blue-100"
                  label="My Courses"
                  onClick={() => setOpen(false)}
                />
                <SidebarItem
                  to="/dashboard/announcements"
                  icon={<Bell size={16} />}
                  iconColor="text-amber-600 bg-amber-50 border-amber-100"
                  label="Announcements"
                  onClick={() => setOpen(false)}
                />
                <SidebarItem
                  to="/dashboard/career-vault"
                  icon={<Briefcase size={16} />}
                  iconColor="text-emerald-600 bg-emerald-50 border-emerald-100"
                  label="Career Vault"
                  onClick={() => setOpen(false)}
                />
                <SidebarItem
                  to="/dashboard/finance-vault"
                  icon={<Landmark size={16} />}
                  iconColor="text-purple-600 bg-purple-50 border-purple-100"
                  label="Finance Vault"
                  onClick={() => setOpen(false)}
                />
                <SidebarItem
                  to="/dashboard/level-up"
                  icon={<TrendingUp size={16} />}
                  iconColor="text-blue-600 bg-blue-50 border-blue-100"
                  label="Level Up"
                  onClick={() => setOpen(false)}
                />
              </>
            )}

          {isAdmin && !isCareerAdmin && viewRole === "admin" && (
            <>
              <p className="px-3 text-[10px] font-bold text-slate-400 uppercase my-2 tracking-wider">
                Admin Panel
              </p>
              <SidebarItem
                to="/admin/dashboard"
                icon={<Layers size={16} />}
                iconColor="text-indigo-600 bg-indigo-50 border-indigo-100"
                label="Overview"
                onClick={() => setOpen(false)}
              />
              <SidebarItem
                to="/admin/manage-courses"
                icon={<BookOpen size={16} />}
                iconColor="text-blue-600 bg-blue-50 border-blue-100"
                label="Courses"
                onClick={() => setOpen(false)}
              />
              <SidebarItem
                to="/admin/manage-users"
                icon={<Users size={16} />}
                iconColor="text-emerald-600 bg-emerald-50 border-emerald-100"
                label="Users"
                onClick={() => setOpen(false)}
              />
              <SidebarItem
                to="/admin/manage-resources"
                icon={<Settings size={16} />}
                iconColor="text-amber-600 bg-amber-50 border-amber-100"
                label="Resources"
                onClick={() => setOpen(false)}
              />
              <SidebarItem
                to="/admin/manage-announcements"
                icon={<Bell size={16} />}
                iconColor="text-rose-600 bg-rose-50 border-rose-100"
                label="Announcements"
                onClick={() => setOpen(false)}
              />
              <SidebarItem
                to="/admin/manage-posts"
                icon={<Briefcase size={16} />}
                iconColor="text-teal-600 bg-teal-50 border-teal-100"
                label="Career Vault"
                onClick={() => setOpen(false)}
              />
              <SidebarItem
                to="/admin/finance-vault"
                icon={<Landmark size={16} />}
                iconColor="text-purple-600 bg-purple-50 border-purple-100"
                label="Finance Vault"
                onClick={() => setOpen(false)}
              />
              <SidebarItem
                to="/admin/level-up"
                icon={<TrendingUp size={16} />}
                iconColor="text-blue-600 bg-blue-50 border-blue-100"
                label="Level Up"
                onClick={() => setOpen(false)}
              />
            </>
          )}

          {isAdmin && isCareerAdmin && viewRole === "admin" && (
            <>
              <p className="px-3 text-[10px] font-bold text-slate-400 uppercase my-2 tracking-wider">
                Career Admin
              </p>
              <SidebarItem
                to="/admin/manage-posts"
                icon={<Briefcase size={16} />}
                iconColor="text-teal-600 bg-teal-50 border-teal-100"
                label="Career Vault"
                onClick={() => setOpen(false)}
              />
              <SidebarItem
                to="/admin/level-up"
                icon={<TrendingUp size={16} />}
                iconColor="text-blue-600 bg-blue-50 border-blue-100"
                label="Level Up"
                onClick={() => setOpen(false)}
              />
            </>
          )}

          {isAdmin && isFinanceAdmin && viewRole === "admin" && (
            <>
              <p className="px-3 text-[10px] font-bold text-slate-400 uppercase my-2 tracking-wider">
                Finance Admin
              </p>
              <SidebarItem
                to="/admin/finance-vault"
                icon={<Landmark size={16} />}
                iconColor="text-purple-600 bg-purple-50 border-purple-100"
                label="Finance Vault"
                onClick={() => setOpen(false)}
              />
              <SidebarItem
                to="/admin/level-up"
                icon={<TrendingUp size={16} />}
                iconColor="text-blue-600 bg-blue-50 border-blue-100"
                label="Level Up"
                onClick={() => setOpen(false)}
              />
            </>
          )}
        </nav>

        {/* Footer / Sign Out */}
        <div className="p-3 border-t border-slate-100">
          <button
            onClick={logout}
            className="flex items-center w-full gap-2.5 text-rose-600 font-semibold px-3 py-2 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer text-xs"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 h-full bg-[#F8FAFC] overflow-y-auto" data-lenis-prevent>
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function SidebarItem({ to, icon, iconColor, label, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `
        flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer group
        ${isActive
          ? "bg-white text-slate-950 font-bold border border-slate-200/90 shadow-xs"
          : "text-slate-600 hover:bg-white/80 hover:text-slate-950"
        }
      `
      }
    >
      {({ isActive }) => (
        <>
          <div
            className={`w-7 h-7 rounded-md flex items-center justify-center border transition-colors ${isActive
              ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
              : iconColor || "text-slate-600 bg-slate-100 border-slate-200"
              }`}
          >
            {icon}
          </div>
          <span className="flex-1">{label}</span>
          {isActive && (
            <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
          )}
        </>
      )}
    </NavLink>
  );
}