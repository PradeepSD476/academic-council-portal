import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Plus, Pencil, Trash2, Award, TrendingUp, CheckCircle, XCircle, Loader2 } from "lucide-react";

const CATEGORY_META = {
  SCHOLARSHIP:          { label: "Scholarship",           bg: "bg-purple-950/60 text-purple-300 border-purple-800/60" },
  FEE_WAIVER:           { label: "Fee Waiver",            bg: "bg-emerald-950/60 text-emerald-300 border-emerald-800/60" },
  EDUCATION_LOAN:       { label: "Education Loan",        bg: "bg-amber-950/60 text-amber-300 border-amber-800/60" },
  FINANCIAL_ASSISTANCE: { label: "Financial Assistance",  bg: "bg-rose-950/60 text-rose-300 border-rose-800/60" },
  GRANT:                { label: "Grant",                 bg: "bg-blue-950/60 text-blue-300 border-blue-800/60" },
  OTHER:                { label: "Other",                 bg: "bg-white/5 text-slate-600 border-white/10" },
};

const Dashboard = () => {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/v1/finance-vault`, {
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
      await axios.delete(`${import.meta.env.VITE_API_URL}/v1/finance-vault/${id}`, { withCredentials: true });
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
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-[3px] h-6 bg-[var(--color-secondary)] rounded-full shadow-[0_0_8px_var(--color-secondary)]" />
            <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--color-primary)] tracking-tight flex items-center gap-2.5">
              <Award className="text-[var(--color-secondary)]" size={24} /> Finance Vault Admin
            </h1>
          </div>
          <p className="text-slate-500 text-sm ml-4">
            Manage scholarships, fee waivers, education loans, and financial opportunities.
          </p>
        </div>
        <Link
          to="/admin/finance-vault/add"
          className="inline-flex items-center gap-2 bg-[var(--color-secondary)] hover:opacity-90 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-[0_8px_20px_var(--color-secondary-glow)] transition cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} /> Add Opportunity
        </Link>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Award, label: "Total Opportunities", value: opportunities.length, color: "text-[var(--color-secondary)]" },
          { icon: CheckCircle, label: "Active Listings", value: active, color: "text-emerald-400" },
          { icon: XCircle, label: "Inactive / Expired", value: inactive, color: "text-rose-400" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white/95 backdrop-blur-xl shadow-xs border border-slate-200 rounded-2xl p-5 shadow-md flex items-center gap-4 hover:border-[var(--color-secondary)]/40 transition">
            <div className="w-11 h-11 rounded-xl bg-sky-100 border border-slate-200 flex items-center justify-center shrink-0">
              <Icon size={20} className={color} />
            </div>
            <div>
              <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">{label}</p>
              <p className="text-[var(--color-primary)] text-2xl font-black leading-tight mt-0.5">{loading ? "—" : value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Table Card ── */}
      <div className="bg-white/95 backdrop-blur-xl shadow-xs border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
        {/* Table Header */}
        <div className="bg-white/90 px-6 py-3.5 border-b border-slate-200 flex items-center justify-between">
          <span className="font-bold text-xs text-slate-500 uppercase tracking-wider">All Financial Opportunities</span>
          {!loading && (
            <span className="text-xs font-bold text-slate-500 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
              {opportunities.length} Total
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-2">
            <Loader2 className="animate-spin text-[var(--color-secondary)] w-8 h-8" />
            <span className="text-slate-500 text-xs font-semibold">Loading opportunities...</span>
          </div>
        ) : opportunities.length === 0 ? (
          <div className="p-16 text-center text-slate-500">
            <Award size={48} className="mx-auto text-slate-500 mb-3" />
            <p className="text-sm font-semibold">No opportunities found. Add one to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-800">
              <thead className="bg-white/90">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Provider</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Deadline</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/70">
                {opportunities.map((item) => {
                  const cat = CATEGORY_META[item.category] || CATEGORY_META.OTHER;
                  const isDeleting = deletingId === item.id;
                  return (
                    <tr key={item.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-[var(--color-primary)] truncate max-w-xs">{item.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 text-xs font-bold border rounded-full uppercase tracking-wider ${cat.bg}`}>
                          {cat.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600 font-semibold">
                        {item.provider || <span className="text-slate-500">—</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 font-medium">
                        {item.deadline
                          ? new Date(item.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                          : <span className="text-slate-500">No Deadline</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 inline-flex items-center text-[10px] font-bold border rounded-full uppercase tracking-wider ${
                          item.isActive
                            ? "bg-emerald-950/60 text-emerald-300 border-emerald-800/60"
                            : "bg-rose-950/60 text-rose-300 border-rose-800/60"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${item.isActive ? "bg-emerald-400 animate-pulse" : "bg-rose-400"}`} />
                          {item.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/admin/finance-vault/edit/${item.id}`}
                            className="p-1.5 text-slate-500 hover:text-[var(--color-primary)] bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                            title="Edit Opportunity"
                          >
                            <Pencil size={14} />
                          </Link>
                          <button
                            onClick={() => handleDelete(item.id)}
                            disabled={isDeleting}
                            className="p-1.5 text-slate-500 hover:text-red-400 bg-white/5 hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                            title="Delete Opportunity"
                          >
                            {isDeleting ? <Loader2 className="animate-spin w-3.5 h-3.5" /> : <Trash2 size={14} />}
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
  );
};

export default Dashboard;