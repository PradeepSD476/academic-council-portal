import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Plus, Pencil, Trash2, Award, TrendingUp, CheckCircle, XCircle, Loader2 } from "lucide-react";

const CATEGORY_META = {
  SCHOLARSHIP:          { label: "Scholarship",           bg: "bg-purple-100 text-purple-800 border-purple-200" },
  FEE_WAIVER:           { label: "Fee Waiver",            bg: "bg-green-100 text-green-800 border-green-200" },
  EDUCATION_LOAN:       { label: "Education Loan",        bg: "bg-amber-100 text-amber-800 border-amber-200" },
  FINANCIAL_ASSISTANCE: { label: "Financial Assistance",  bg: "bg-red-100 text-red-800 border-red-200" },
  GRANT:                { label: "Grant",                 bg: "bg-blue-100 text-blue-800 border-blue-200" },
  OTHER:                { label: "Other",                 bg: "bg-gray-100 text-gray-800 border-gray-200" },
};

const Dashboard = () => {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/finance-vault`, {
        params: { page: 1, limit: 100 },
        withCredentials: true,
      });
      setOpportunities(data.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch finance opportunities.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOpportunities(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this opportunity?")) return;
    setDeletingId(id);
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/v1/finance-vault/${id}`, { withCredentials: true });
      toast.success("Opportunity deleted successfully.");
      setOpportunities(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete opportunity.");
    } finally {
      setDeletingId(null);
    }
  };

  const active = opportunities.filter(o => o.isActive).length;
  const inactive = opportunities.filter(o => !o.isActive).length;

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        
        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Award className="text-blue-600" /> Finance Vault Admin
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Manage scholarships, loans, grants and financial opportunities.
            </p>
          </div>
          <Link
            to="/admin/finance-vault/add"
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-colors"
          >
            <Plus size={16} /> Add Opportunity
          </Link>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[
            { icon: Award, label: "Total", value: opportunities.length, bg: "bg-purple-100", color: "text-purple-600", border: "border-purple-200" },
            { icon: CheckCircle, label: "Active", value: active, bg: "bg-green-100", color: "text-green-600", border: "border-green-200" },
            { icon: XCircle, label: "Inactive", value: inactive, bg: "bg-red-100", color: "text-red-600", border: "border-red-200" },
          ].map(({ icon: Icon, label, value, bg, color, border }) => (
            <div key={label} className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs flex items-center gap-4">
              <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon size={20} className={color} />
              </div>
              <div>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">{label}</p>
                <p className="text-gray-900 text-2xl font-extrabold leading-none mt-0.5">{loading ? "—" : value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Table Card ── */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <span className="font-bold text-sm text-gray-800">All Opportunities</span>
            {!loading && (
              <span className="text-xs font-semibold text-gray-500 bg-white border px-2.5 py-1 rounded-full shadow-xs">
                {opportunities.length} Total
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-2">
              <Loader2 className="animate-spin text-blue-500 w-8 h-8" />
              <span className="text-gray-500 text-sm font-medium">Loading opportunities...</span>
            </div>
          ) : opportunities.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Award size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-sm font-medium">No opportunities found. Add one to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {opportunities.map((item) => {
                    const cat = CATEGORY_META[item.category] || CATEGORY_META.OTHER;
                    const isDeleting = deletingId === item.id;
                    return (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 truncate max-w-xs">{item.title}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-0.5 text-xs font-semibold border rounded-full ${cat.bg}`}>
                            {cat.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.provider || <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.deadline
                            ? new Date(item.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                            : <span className="text-gray-300">No Deadline</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-0.5 inline-flex items-center text-xs font-semibold border rounded-full ${
                            item.isActive ? "bg-green-100 text-green-800 border-green-200" : "bg-red-100 text-red-800 border-red-200"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${item.isActive ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
                            {item.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                          <div className="flex justify-center gap-2">
                            <Link
                              to={`/admin/finance-vault/edit/${item.id}`}
                              className="inline-flex items-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                            >
                              <Pencil size={12} /> Edit
                            </Link>
                            <button
                              onClick={() => handleDelete(item.id)}
                              disabled={isDeleting}
                              className="inline-flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50 transition-colors"
                            >
                              {isDeleting ? <Loader2 className="animate-spin w-3 h-3" /> : <Trash2 size={12} />}
                              {isDeleting ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;