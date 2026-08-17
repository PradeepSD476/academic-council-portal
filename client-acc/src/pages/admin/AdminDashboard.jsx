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
          <div className="flex items-center gap-3 mb-2">
            <div className="w-[3px] h-6 bg-[var(--color-secondary)] rounded-full shadow-[0_0_8px_var(--color-secondary)]" />
            <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--color-primary)] tracking-tight">
              Dashboard Overview
            </h1>
          </div>
          <p className="text-slate-500 text-sm ml-4">
            Welcome back, Admin. System metrics and quick actions for today.
          </p>
        </div>
        <div className="text-xs font-semibold text-slate-500 bg-white/95 backdrop-blur-xl shadow-xs px-4 py-2 rounded-xl border border-slate-200 self-start sm:self-auto">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Users"
          count={stats.userCount}
          icon={<Users size={22} className="text-[var(--color-secondary)]" />}
          loading={loading}
        />
        <StatCard
          title="Active Courses"
          count={stats.courseCount}
          icon={<BookOpen size={22} className="text-emerald-400" />}
          loading={loading}
        />
        <StatCard
          title="Resources"
          count={stats.resourceCount}
          icon={<FileText size={22} className="text-amber-400" />}
          loading={loading}
        />
        <StatCard
          title="Announcements"
          count={stats.announcementCount}
          icon={<Megaphone size={22} className="text-rose-400" />}
          loading={loading}
        />
        <StatCard
          title="Online Users"
          count={stats.liveUserCount}
          icon={<Activity size={22} className="text-cyan-400" />}
          loading={loading}
        />
      </div>

      {/* Quick Actions / System Status Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white/95 backdrop-blur-xl shadow-xs p-6 rounded-2xl border border-slate-200 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[var(--color-primary)] text-base flex items-center gap-2">
              <TrendingUp size={18} className="text-[var(--color-secondary)]" /> System Activity
            </h3>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              ● All Systems Operational
            </span>
          </div>

          <div className="h-56 flex flex-col items-center justify-center text-slate-500 bg-white/90 rounded-xl border border-slate-200/80 p-6 text-center">
            <Activity size={36} className="text-slate-500 mb-2 animate-pulse" />
            <p className="text-xs font-semibold text-slate-500">Live Academic Council Telemetry</p>
            <p className="text-[11px] text-slate-500 mt-1">Real-time resource access and student query metrics logged.</p>
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-xl shadow-xs p-6 rounded-2xl border border-slate-200 shadow-md">
          <h3 className="font-bold text-[var(--color-primary)] text-base mb-4 flex items-center gap-2">
            Quick Actions
          </h3>
          <div className="space-y-2.5">
            <AddQuickAction title="+ Create New Announcement" navigateTo="/admin/manage-announcements" />
            <AddQuickAction title="+ Add New User" navigateTo="/admin/manage-users" />
            <AddQuickAction title="Manage Course Content" navigateTo="/admin/manage-courses" />
            <AddQuickAction title="Manage Career Posts" navigateTo="/admin/manage-posts" />
            <AddQuickAction title="Manage Finance Vault" navigateTo="/admin/finance-vault" />
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, count, icon, loading }) => {
  return (
    <div className="bg-white/95 backdrop-blur-xl shadow-xs p-5 rounded-2xl border border-slate-200/90 shadow-md hover:border-[var(--color-secondary)]/40 hover:shadow-[0_10px_30px_rgba(232,93,37,0.1)] transition-all duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">{title}</p>
          {loading ? (
            <div className="h-8 w-16 bg-slate-200 animate-pulse rounded-lg"></div>
          ) : (
            <h2 className="text-2xl md:text-3xl font-black text-[var(--color-primary)]">{count}</h2>
          )}
        </div>
        <div className="p-2.5 rounded-xl bg-sky-100 border border-slate-200 shrink-0">
          {icon}
        </div>
      </div>
    </div>
  );
};

const AddQuickAction = ({ title, navigateTo }) => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(navigateTo)}
      className="w-full text-left px-4 py-3 bg-white/90 hover:bg-sky-50 border border-slate-200 hover:border-[var(--color-secondary)]/40 rounded-xl text-xs font-semibold text-slate-600 hover:text-[var(--color-primary)] transition-all cursor-pointer flex items-center justify-between group"
    >
      <span>{title}</span>
      <span className="text-[var(--color-secondary)] opacity-0 group-hover:opacity-100 transition-opacity font-bold">→</span>
    </button>
  );
};

export default AdminDashboard;