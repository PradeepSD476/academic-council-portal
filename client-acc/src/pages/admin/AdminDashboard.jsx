import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; 
import { Users, BookOpen, FileText, Megaphone, TrendingUp, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    userCount: 0,
    courseCount: 0,
    resourceCount: 0,
    announcementCount: 0,
    liveUserCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/v1/dashboard/admin`,
          {
            withCredentials: true,
          },
        );

        if (response.data && response.data.data) {
          toast.success("Dashboard stats fetched successfully.");
          setStats(response.data.data);
        }
      } catch (error) {
        toast.error("Failed to fetch Dashboard stats");
        console.error("Failed to fetch dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-950 tracking-tight">
              Dashboard Overview
            </h1>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm">
            Welcome back, Admin. System metrics and quick actions for today.
          </p>
        </div>
        <div className="text-xs font-bold text-slate-700 bg-white shadow-2xs px-3.5 py-1.5 rounded-lg border border-slate-200 self-start sm:self-auto flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>
            {new Date().toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Users"
          count={stats.userCount}
          icon={<Users size={20} />}
          colorStyle="bg-indigo-50 text-indigo-600 border-indigo-100"
          loading={loading}
        />
        <StatCard
          title="Active Courses"
          count={stats.courseCount}
          icon={<BookOpen size={20} />}
          colorStyle="bg-blue-50 text-blue-600 border-blue-100"
          loading={loading}
        />
        <StatCard
          title="Resources"
          count={stats.resourceCount}
          icon={<FileText size={20} />}
          colorStyle="bg-amber-50 text-amber-600 border-amber-100"
          loading={loading}
        />
        <StatCard
          title="Announcements"
          count={stats.announcementCount}
          icon={<Megaphone size={20} />}
          colorStyle="bg-rose-50 text-rose-600 border-rose-100"
          loading={loading}
        />
        <StatCard
          title="Online Users"
          count={stats.liveUserCount}
          icon={<Activity size={20} />}
          colorStyle="bg-emerald-50 text-emerald-600 border-emerald-100"
          loading={loading}
        />
      </div>

      {/* Quick Actions / System Status Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
                <TrendingUp size={14} />
              </div>
              <span>System Activity</span>
            </h3>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>All Systems Operational</span>
            </span>
          </div>

          <div className="h-52 flex flex-col items-center justify-center text-slate-500 bg-slate-50 rounded-xl border border-slate-200/80 p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-blue-600 mb-2 shadow-2xs">
              <Activity size={24} />
            </div>
            <p className="text-xs font-bold text-slate-800">Live Academic Council Telemetry</p>
            <p className="text-[11px] text-slate-500 mt-1 max-w-sm">
              Real-time course queries, student registrations, and administrative logs are monitored.
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
          <h3 className="font-bold text-slate-900 text-sm sm:text-base mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            <span>Quick Management</span>
          </h3>
          <div className="space-y-2">
            <AddQuickAction
              title="Create New Announcement"
              navigateTo="/admin/manage-announcements"
              accentColor="bg-rose-50 text-rose-700"
            />
            <AddQuickAction
              title="Add New User Account"
              navigateTo="/admin/manage-users"
              accentColor="bg-indigo-50 text-indigo-700"
            />
            <AddQuickAction
              title="Manage Course Content"
              navigateTo="/admin/manage-courses"
              accentColor="bg-blue-50 text-blue-700"
            />
            <AddQuickAction
              title="Manage Career Posts"
              navigateTo="/admin/manage-posts"
              accentColor="bg-teal-50 text-teal-700"
            />
            <AddQuickAction
              title="Manage Finance Vault"
              navigateTo="/admin/finance-vault"
              accentColor="bg-purple-50 text-purple-700"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, count, icon, colorStyle, loading }) => {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            {title}
          </p>
          {loading ? (
            <div className="h-7 w-14 bg-slate-100 animate-pulse rounded"></div>
          ) : (
            <h2 className="text-2xl font-black text-slate-950">{count}</h2>
          )}
        </div>
        <div
          className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 shadow-2xs ${colorStyle}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};

const AddQuickAction = ({ title, navigateTo, accentColor }) => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(navigateTo)}
      className="w-full text-left px-3.5 py-2.5 bg-slate-50 hover:bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-950 transition-all cursor-pointer flex items-center justify-between group shadow-2xs"
    >
      <div className="flex items-center gap-2">
        <span className={`w-1.5 h-1.5 rounded-full ${accentColor || "bg-slate-400"}`} />
        <span>{title}</span>
      </div>
      <span className="text-blue-600 font-bold text-xs opacity-0 group-hover:opacity-100 transition-opacity">
        →
      </span>
    </button>
  );
};

export default AdminDashboard;