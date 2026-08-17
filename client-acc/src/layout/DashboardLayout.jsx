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
    Sparkles
} from "lucide-react";
import { useContext, useEffect, useState } from "react";
import AuthContext from "../context/auth/authContext";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export default function DashboardLayout() {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    const isAdmin = (user?.role === "SUPER_ADMIN") || (user?.role === "FACULTY") || (user?.role === "ANNOUNCEMENT_ADMIN") || (user?.role === "RESOURCE_ADMIN") || (user?.role === "CAREER_ADMIN") || (user?.role === "FINANCE_ADMIN");
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
        <div className="flex min-h-[calc(100vh-64px)] bg-[var(--color-canvas)] text-slate-800 relative">
            
            {/* Mobile Sidebar Toggle Button */}
            <button
                onClick={() => setOpen(!open)}
                className={`
                    fixed top-20 z-[60] md:hidden
                    flex items-center justify-center
                    w-10 h-10 bg-white/95 border-2 border-slate-200 text-[var(--color-primary)] rounded-r-2xl shadow-xl backdrop-blur-xl
                    hover:bg-[var(--color-primary)] hover:text-white hover:border-[var(--color-primary)]
                    transition-all duration-300 ease-in-out cursor-pointer
                    ${open ? "left-72" : "left-0"}
                `}
                aria-label={open ? "Close sidebar" : "Open sidebar"}
            >
                {open ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
            </button>

            {/* Mobile Backdrop */}
            {open && (
                <div 
                    className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-xs"
                    onClick={() => setOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed md:sticky top-16 left-0 h-[calc(100vh-64px)] w-72 bg-white/85 backdrop-blur-2xl border-r border-slate-200/90 flex flex-col z-50 shrink-0 shadow-[4px_0_24px_rgba(11,30,63,0.03)]
                    transition-transform duration-300 ease-in-out
                    ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
                `}
            >
                {/* Header / Brand */}
                <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-slate-100">
                    <div className="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-accent)] p-2.5 rounded-2xl shadow-sm flex items-center justify-center text-white">
                        <BookOpen size={18} />
                    </div>
                    <div>
                        <h1 className="text-base font-black text-[var(--color-primary)] tracking-tight leading-tight">Student Portal</h1>
                        <span className="text-[11px] text-slate-500 font-semibold">Academic &amp; Career Council</span>
                    </div>
                </div>

                {/* User Card */}
                <div className="relative bg-gradient-to-br from-white/95 via-sky-50/30 to-blue-50/40 rounded-2xl mx-4 p-4 my-4 border-2 border-[var(--color-secondary)]/30 shadow-[0_4px_20px_rgba(11,30,63,0.04)]">
                    {(isAdmin || isCareerAdmin || isFinanceAdmin) && !isFaculty && (
                        <button
                            onClick={() => {
                                const target = (viewRole === "STUDENT") 
                                    ? (isCareerAdmin ? "/admin/manage-posts" : (isFinanceAdmin ? "/admin/finance-vault" : "/admin/dashboard")) 
                                    : "/dashboard/courses";
                                setViewRole(viewRole === "STUDENT" ? "admin" : "STUDENT");
                                navigate(target);
                            }}
                            title="Switch View"
                            className="absolute top-3 right-3 p-1.5 bg-white border border-slate-200 rounded-full text-slate-500 hover:text-white hover:bg-[var(--color-primary)] hover:border-[var(--color-primary)] transition-all cursor-pointer shadow-xs"
                        >
                            <Repeat size={14} />
                        </button>
                    )}

                    <div className="flex items-start gap-3">
                        <div className="bg-white border border-slate-200 p-2 rounded-xl shrink-0 flex items-center justify-center text-[var(--color-primary)] shadow-xs">
                            <User size={20} />
                        </div>
                        <div className="overflow-hidden min-w-0 pr-4">
                            <p className="text-sm font-black text-[var(--color-primary)] truncate leading-tight">
                                {user?.displayName || "Student"}
                            </p>
                            <p className="text-xs text-slate-500 truncate mt-0.5 font-medium">{user?.email}</p>
                            <span className="inline-block text-[10px] font-black text-[var(--color-primary)] mt-1.5 uppercase tracking-wider bg-sky-100/90 px-2.5 py-0.5 rounded-full border border-sky-300/70 shadow-xs">
                                {isAdmin ? (viewRole === "admin" ? "Administrator" : "Student View") : "Student"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
                    {(isSTUDENT || ((isAdmin || isCareerAdmin) && viewRole === "STUDENT")) && (
                        <>
                            <p className="px-4 text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Main Navigation</p>
                            <SidebarItem to="/dashboard/courses" icon={<Layers size={18} />} label="My Courses" onClick={() => setOpen(false)} />
                            <SidebarItem to="/dashboard/announcements" icon={<Bell size={18} />} label="Announcements" onClick={() => setOpen(false)} />
                            <SidebarItem to="/dashboard/career-vault" icon={<Briefcase size={18} />} label="Career Vault" onClick={() => setOpen(false)} />
                            <SidebarItem to="/dashboard/finance-vault" icon={<Landmark size={18} />} label="Finance Vault" onClick={() => setOpen(false)} />
                        </>
                    )}

                    {isAdmin && !isCareerAdmin && viewRole === "admin" && (
                        <>
                            <p className="px-4 text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Admin Control Panel</p>
                            <SidebarItem to="/admin/dashboard" icon={<Layers size={18} />} label="Overview" onClick={() => setOpen(false)} />
                            <SidebarItem to="/admin/manage-courses" icon={<BookOpen size={18} />} label="Courses" onClick={() => setOpen(false)} />
                            <SidebarItem to="/admin/manage-users" icon={<Users size={18} />} label="Users" onClick={() => setOpen(false)} />
                            <SidebarItem to="/admin/manage-resources" icon={<Settings size={18} />} label="Resources" onClick={() => setOpen(false)} />
                            <SidebarItem to="/admin/manage-announcements" icon={<Bell size={18} />} label="Announcements" onClick={() => setOpen(false)} />
                            <SidebarItem to="/admin/manage-posts" icon={<Briefcase size={18} />} label="Career Vault" onClick={() => setOpen(false)} />
                            <SidebarItem to="/admin/finance-vault" icon={<Landmark size={18} />} label="Finance Vault" onClick={() => setOpen(false)} />
                        </>
                    )}

                    {isAdmin && isCareerAdmin && viewRole === "admin" && (
                        <>
                            <p className="px-4 text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Career Admin Panel</p>
                            <SidebarItem to="/admin/manage-posts" icon={<Briefcase size={18} />} label="Career Vault" onClick={() => setOpen(false)} />
                        </>
                    )}

                    {isAdmin && isFinanceAdmin && viewRole === "admin" && (
                        <>
                            <p className="px-4 text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Finance Admin Panel</p>
                            <SidebarItem to="/admin/finance-vault" icon={<Landmark size={18} />} label="Finance Vault" onClick={() => setOpen(false)} />
                        </>
                    )}
                </nav>

                {/* Footer / Sign Out */}
                <div className="p-4 border-t border-slate-100">
                    <button
                        onClick={logout}
                        className="flex items-center w-full gap-3 text-rose-600 font-bold px-4 py-3 rounded-2xl hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer text-sm"
                    >
                        <LogOut size={18} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 min-w-0 bg-[var(--color-canvas)] overflow-y-auto relative">
                {/* Subtle Ambient Aurora Light in Dashboard Canvas */}
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-[var(--color-secondary)]/15 rounded-full blur-[140px] pointer-events-none" />
                <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto relative z-10">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

function SidebarItem({ to, icon, label, onClick }) {
    return (
        <NavLink
            to={to}
            onClick={onClick}
            className={({ isActive }) =>
                `
                flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-200 cursor-pointer
                ${isActive 
                    ? "bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-primary-accent)] to-[var(--color-secondary)] text-white shadow-[0_8px_20px_var(--color-secondary-glow)] scale-[1.02]" 
                    : "text-slate-600 hover:bg-sky-50/80 hover:text-[var(--color-primary)]"}
            `
            }
        >
            {icon}
            <span>{label}</span>
        </NavLink>
    );
}