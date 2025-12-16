import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; 
import { Users, BookOpen, FileText, Megaphone, TrendingUp } from 'lucide-react';
import { getAuth } from 'firebase/auth'; 

const AdminDashboard = () => {
  const navigate = useNavigate(); 
  
  const [stats, setStats] = useState({
    userCount: 0,
    courseCount: 0,
    resourceCount: 0,
    announcementCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        const token = user ? await user.getIdToken() : localStorage.getItem('token');

        const response = await axios.get('http://localhost:5000/api/v1/dashboard/admin', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data && response.data.data) {
          setStats(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back, Admin. Here's what's happening today.</p>
        </div>
        <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-lg border shadow-sm">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Users" 
          count={stats.userCount} 
          icon={<Users size={24} />} 
          color="bg-blue-500" 
          loading={loading}
        />
        <StatCard 
          title="Active Courses" 
          count={stats.courseCount} 
          icon={<BookOpen size={24} />} 
          color="bg-emerald-500" 
          loading={loading}
        />
        <StatCard 
          title="Resources" 
          count={stats.resourceCount} 
          icon={<FileText size={24} />} 
          color="bg-amber-500" 
          loading={loading}
        />
        <StatCard 
          title="Announcements" 
          count={stats.announcementCount} 
          icon={<Megaphone size={24} />} 
          color="bg-rose-500" 
          loading={loading}
        />
      </div>

      {/* Quick Actions / Placeholder Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-gray-400"/> System Status
          </h3>
          <div className="h-48 flex items-center justify-center text-gray-400 bg-gray-50 rounded-lg border border-dashed">
            <p>Activity Chart / Analytics Placeholder</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            
            {/* 3. Updated Buttons with Navigation */}
            <button 
              onClick={() => navigate('/admin/manage-announcements')}
              className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 transition-colors"
            >
              + Create New Announcement
            </button>
            
            <button 
              onClick={() => navigate('/admin/manage-users')}
              className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 transition-colors"
            >
              + Add New User
            </button>
            
            <button 
              onClick={() => navigate('/admin/manage-courses')}
              className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 transition-colors"
            >
              Manage Course Content
            </button>

          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, count, icon, color, loading }) => {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          {loading ? (
            <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
          ) : (
            <h2 className="text-3xl font-bold text-gray-800">{count}</h2>
          )}
        </div>
        <div className={`p-3 rounded-lg text-white shadow-lg ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;