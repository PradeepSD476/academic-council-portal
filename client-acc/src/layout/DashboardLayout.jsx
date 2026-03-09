import {
    BookOpen, Bell, Users, Layers, Settings, LogOut,
    Repeat, User, ChevronRight, ChevronLeft
} from "lucide-react";
import { useContext, useEffect, useState } from "react";
import AuthContext from "../context/auth/authContext";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";

export default function DashboardLayout() {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    const isAdmin = (user?.role === "SUPER_ADMIN") || (user?.role === "FACULTY") || (user?.role === "ANNOUNCEMENT_ADMIN") || (user?.role === "RESOURCE_ADMIN");
    const isSTUDENT = user?.role === "STUDENT";
    const isFaculty = user?.role === "FACULTY";
    
    const [open, setOpen] = useState(false);
    const [viewRole, setViewRole] = useState("STUDENT");

    useEffect(() => {
        if (window.innerWidth < 768) setOpen(false);

        if(isFaculty){
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
    }, [location.pathname, isAdmin, isFaculty]);

    return (
        <div className="flex h-screen bg-white overflow-hidden relative mt-[0.5rem]">
            
            <button
                onClick={() => setOpen(!open)}
                className={`
                    fixed top-20 z-[60] md:hidden
                    flex items-center justify-center
                    w-10 h-10 bg-blue-900 text-white rounded-r-md shadow-lg
                    transition-all duration-300 ease-in-out
                    ${open ? "left-80" : "left-0"}
                `}
                aria-label={open ? "Close sidebar" : "Open sidebar"}
            >
                {open ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
            </button>

            {open && (
                <div 
                    className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setOpen(false)}
                />
            )}

            <aside
                className={`
                    fixed md:static top-0 left-0 h-full w-80 bg-white shadow-2xl md:shadow-none flex flex-col z-50 
                    transition-transform duration-300 ease-in-out
                    ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
                `}
            >
                <div className="flex items-center gap-3 px-6 pt-8 pb-4 border-b border-gray-50">
                    <div className="bg-blue-600 p-2.5 rounded-lg shadow-sm">
                        <BookOpen size={20} color="white" />
                    </div>
                    <h1 className="text-lg font-bold text-gray-900 tracking-tight">Academic Portal</h1>
                </div>

                <div className="relative bg-blue-50/50 rounded-xl mx-4 p-5 my-6 border border-blue-100/50">
                    {isAdmin && !isFaculty && (
                        <button
                            onClick={() => {
                                const target = viewRole === "STUDENT" ? "/admin/dashboard" : "/dashboard/courses";
                                setViewRole(viewRole === "STUDENT" ? "admin" : "STUDENT");
                                navigate(target);
                            }}
                            className="absolute top-3 right-3 p-1.5 bg-white rounded-full text-blue-600 hover:shadow-md transition-all"
                        >
                            <Repeat size={16} />
                        </button>
                    )}

                    <div className="flex items-start gap-3">
                        <div className="bg-white p-2 rounded-full shadow-sm">
                            <User size={24} className="text-gray-600" />
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold text-gray-800 truncate leading-tight">
                                {user?.displayName}
                            </p>
                            <p className="text-xs text-gray-500 truncate mt-0.5">{user?.email}</p>
                            <p className="text-[10px] font-bold text-blue-700 mt-2 uppercase tracking-wider">
                                {isAdmin ? (viewRole === "admin" ? "Administrator" : "Student View") : "Student"}
                            </p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
                    {(isSTUDENT || (isAdmin && viewRole === "STUDENT")) && (
                        <>
                            <p className="px-4 text-[11px] font-bold text-gray-400 uppercase mb-2 tracking-widest">Main Menu</p>
                            <SidebarItem to="/dashboard/courses" icon={<Layers size={18} />} label="My Courses" />
                            <SidebarItem to="/dashboard/announcements" icon={<Bell size={18} />} label="Announcements" />
                        </>
                    )}

                    {isAdmin && viewRole === "admin" && (
                        <>
                            <p className="px-4 text-[11px] font-bold text-gray-400 uppercase mb-2 tracking-widest">Admin Tools</p>
                            <SidebarItem to="/admin/dashboard" icon={<Layers size={18} />} label="Overview" />
                            <SidebarItem to="/admin/manage-courses" icon={<BookOpen size={18} />} label="Courses" />
                            <SidebarItem to="/admin/manage-users" icon={<Users size={18} />} label="Users" />
                            <SidebarItem to="/admin/manage-resources" icon={<Settings size={18} />} label="Resources" />
                            <SidebarItem to="/admin/manage-announcements" icon={<Bell size={18} />} label="Announcements" />
                        </>
                    )}
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <button
                        onClick={logout}
                        className="flex items-center w-full gap-3 text-red-500 font-semibold px-4 py-3 rounded-xl hover:bg-red-50 transition-colors"
                    >
                        <LogOut size={20} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            <main className="flex-1 overflow-y-auto bg-slate-50">
                <div className="p-6 md:p-10 max-w-screen-2xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

function SidebarItem({ to, icon, label }) {
    return (
        <NavLink
            to={to}
            className={({ isActive }) =>
                `
                flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200
                ${isActive 
                    ? "bg-blue-600 text-white shadow-blue-200 shadow-lg" 
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}
            `
            }
        >
            {icon}
            {label}
        </NavLink>
    );
}