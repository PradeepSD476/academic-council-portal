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

    const isAdmin = (user?.role === "SUPER_ADMIN") || (user?.role === "ANNOUNCEMENT_ADMIN") || (user?.role === "RESOURCE_ADMIN");
    const isSTUDENT = user?.role === "STUDENT";
    const [open, setOpen] = useState(false);
    const [viewRole, setViewRole] = useState("STUDENT");

    useEffect(() => {
        if (isAdmin) {
            if (location.pathname.startsWith("/admin")) {
                setViewRole("admin");
            } else {
                setViewRole("STUDENT");
            }
        }
    }, [location.pathname]);

    useEffect(() => {
        console.log("User:", user);
    }, [user]);


    return (
        <div className="flex h-[92vh] bg-white">


            {/*SIDEBAR */}
            <aside
                className={`
                    fixed md:static top-0 left-0 h-full w-80 bg-white  shadow-lg flex flex-col z-40 
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
                                if (viewRole === "STUDENT") {
                                    setViewRole("admin");
                                    navigate("/admin/dashboard");
                                } else {
                                    setViewRole("STUDENT");
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
                                        : "STUDENT"
                                    : "STUDENT"}
                            </p>


                        </div>
                    </div>
                </div>

                {/* MENU */}
                <nav className="flex-1 px-4 space-y-1 text-lg">

                    {/* STUDENT MENU */}
                    {(isSTUDENT || (isAdmin && viewRole === "STUDENT")) && (
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
                <div className="rounded-xl p-6 ">
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
