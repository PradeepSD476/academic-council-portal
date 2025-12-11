import {
    BookOpen, Bell, Users, Layers, Settings, LogOut,
    Menu, Repeat, User, X
} from "lucide-react";
import { useContext, useEffect, useState } from "react";
import AuthContext from "../context/auth/authContext";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";


export default function DashboardLayout() {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    const isAdmin = user?.role === "SUPER_ADMIN";
    const isStudent = user?.role === "student";
    const [open, setOpen] = useState(false);
    const [viewRole, setViewRole] = useState("student");

    useEffect(() => {
        if (isAdmin) {
            if (location.pathname.startsWith("/admin")) {
                setViewRole("admin");
            } else {
                setViewRole("student");
            }
        }
    }, [location.pathname]);

    useEffect(() => {
        console.log("User:", user);
    }, [user]);


    return (
        <div className="flex h-[92vh] bg-gray-100">


            {/*SIDEBAR */}
            <aside
                className={`
                    fixed md:static top-0 left-0 h-full w-72 bg-white border-r shadow-lg flex flex-col z-40 
                    transition-transform duration-300
                    ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
                `}
            >

                <div className="md:hidden flex justify-end p-4">
                    <button onClick={() => setOpen(false)}>
                        <X size={28} className="text-gray-500" />
                    </button>
                </div>

                <div className="hidden md:flex items-center gap-3 px-6 pt-8 pb-4">
                    <div className="bg-blue-600 p-3 rounded-xl shadow-md">
                        <BookOpen size={22} color="white" />
                    </div>
                    <h1 className="text-xl font-semibold text-gray-900">Academic Portal</h1>
                </div>

                {/* USER INFO CARD */}
                <div className="relative bg-gray-50 rounded-xl mx-4 p-5 mb-6 shadow-sm">
                    {isAdmin && (
                        <button
                            onClick={() => {
                                if (viewRole === "student") {
                                    setViewRole("admin");
                                    navigate("/admin/dashboard");
                                } else {
                                    setViewRole("student");
                                    navigate("/dashboard/courses");
                                }
                            }}
                            className="absolute top-3 right-3 text-gray-600 hover:text-blue-600"
                        >
                            <Repeat size={20} />
                        </button>
                    )}

                    <div className="flex items-start gap-3">
                        <User size={28} className="text-gray-700 mt-1" />

                        <div>
                            <p className="text-base font-semibold text-gray-800">
                                {user?.displayName}
                            </p>

                            <p className="text-sm text-gray-600">{user?.email}</p>
                            {user?.rollNo && (
                                <p className="text-sm font-medium text-gray-700 mt-1">
                                    {user.rollNo}
                                </p>
                            )}
                            <p className="text-xs font-semibold text-blue-600 mt-1">
                                {isAdmin
                                    ? viewRole === "admin"
                                        ? "Admin"
                                        : "Student"
                                    : "Student"}
                            </p>


                        </div>
                    </div>
                </div>

                {/* MENU */}
                <nav className="flex-1 px-4 space-y-1 text-lg">

                    {/* STUDENT MENU */}
                    {(isStudent || (isAdmin && viewRole === "student")) && (
                        <>
                            <SidebarItem to="/dashboard/courses" icon={<BookOpen size={18} />} label="My Courses" />
                            <SidebarItem to="/dashboard/announcements" icon={<Bell size={18} />} label="Announcements" />
                        </>
                    )}

                    {/* ADMIN MENU */}
                    {isAdmin && viewRole === "admin" && (
                        <>
                            <SidebarItem to="/admin/dashboard" icon={<BookOpen size={18} />} label="Dashboard" />
                            <SidebarItem to="/admin/manage-courses" icon={<Layers size={18} />} label="Manage Courses" />
                            <SidebarItem to="/admin/manage-users" icon={<Users size={18} />} label="Manage Users" />
                            <SidebarItem to="/admin/manage-resources" icon={<Settings size={18} />} label="Manage Resources" />
                            <SidebarItem to="/admin/manage-announcements" icon={<Bell size={18} />} label="Manage Announcements" />
                        </>
                    )}
                </nav>

                <button
                    onClick={logout}
                    className="flex items-center gap-3 text-red-600 font-semibold px-6 py-4 hover:bg-red-50 "
                >
                    <LogOut size={22} />
                    Logout
                </button>
            </aside>

            <main className="flex-1 overflow-y-auto  mt-16 md:mt-0">
                <div className="bg-white rounded-xl shadow p-6 ">
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
                flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium
                ${isActive ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-100"}
            `
            }
        >
            {icon}
            {label}
        </NavLink>
    );
}
