import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import ScholarshipCard from "./components/ScholarshipCard";
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight, Award } from "lucide-react";

const Index = () => {
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [filters, setFilters] = useState({
    category: "",
    gender: "",
    income: "",
    branch: "",
    activeStatus: "",
  });

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchScholarships = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const { data } = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/v1/finance-vault`,
        {
          params: {
            page,
            limit: 10,
            search: searchTerm,
            category: filters.category,
            gender: filters.gender,
            income: filters.income,
            branch: filters.branch,
            activeStatus: filters.activeStatus,
          },
          withCredentials: true,
        }
      );

      setScholarships(data.data || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
      setError("Failed to load scholarships. Please try again.");
      setScholarships([]);
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, filters]);

  useEffect(() => {
    fetchScholarships();
  }, [fetchScholarships]);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* ── Header / Title ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Award className="text-blue-600" /> Finance Vault
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Explore scholarships, fee waivers, education loans and grants available for IIT Patna students.
            </p>
          </div>
          <div className="text-sm font-medium text-gray-600 bg-white px-4 py-2 rounded-lg border shadow-sm">
            Page {page} of {totalPages}
          </div>
        </div>

        {/* ── Search Bar ── */}
        <div className="mb-6 relative w-full lg:w-96">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            placeholder="Search by title or provider..."
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm text-gray-900 shadow-sm"
          />
          {searchTerm && (
            <button
              onClick={() => { setSearchTerm(""); setPage(1); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-100 rounded-full text-gray-400"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* ── Main Content Grid ── */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          
          {/* Desktop Filter Panel (Sticky) */}
          <aside className="hidden lg:block w-64 shrink-0 sticky top-24 self-start max-h-[calc(100vh-120px)] overflow-y-auto">
            <FilterPanel filters={filters} setFilters={setFilters} setPage={setPage} />
          </aside>

          {/* Cards Area */}
          <div className="flex-1 w-full min-w-0">
            {/* Top Bar for Results count & Mobile Toggle */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                {loading ? (
                  "Loading..."
                ) : (
                  <>
                    Showing <span className="font-semibold text-gray-900">{scholarships.length}</span> of{" "}
                    <span className="font-semibold text-gray-900">{total}</span> opportunities
                  </>
                )}
              </p>
              
              <button
                onClick={() => setDrawerOpen(true)}
                className="lg:hidden flex items-center gap-1.5 bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm hover:bg-gray-50"
              >
                <SlidersHorizontal size={14} />
                Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
              </button>
            </div>

            {/* Skeleton Loader */}
            {loading && (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-3">
                    <div className="h-5 bg-gray-200 rounded-md w-3/5" />
                    <div className="h-4 bg-gray-100 rounded-md w-1/3" />
                    <div className="h-4 bg-gray-100 rounded-md w-4/5" />
                  </div>
                ))}
              </div>
            )}

            {/* Error Message */}
            {!loading && error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                <p className="text-red-700 font-semibold mb-3">{error}</p>
                <button
                  onClick={fetchScholarships}
                  className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-lg"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && scholarships.length === 0 && (
              <div className="bg-white border border-gray-200 border-dashed rounded-xl p-12 text-center shadow-sm">
                <Award size={48} className="mx-auto text-gray-300 mb-3" />
                <h3 className="text-lg font-bold text-gray-700 mb-1">No Opportunities Found</h3>
                <p className="text-gray-500 text-sm">Try adjusting your filters or search query.</p>
              </div>
            )}

            {/* Cards List */}
            {!loading && !error && scholarships.length > 0 && (
              <div className="space-y-4">
                {scholarships.map((s) => (
                  <ScholarshipCard key={s.id} scholarship={s} />
                ))}

                {/* Pagination Controls */}
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center justify-between mt-6">
                  <button
                    disabled={page === 1 || loading}
                    onClick={() => setPage(p => Math.max(p - 1, 1))}
                    className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={16} /> Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page <span className="font-semibold text-gray-900">{page}</span> of <span className="font-semibold text-gray-900">{totalPages}</span>
                  </span>
                  <button
                    disabled={page === totalPages || loading}
                    onClick={() => setPage(p => p + 1)}
                    className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile Filter Drawer ── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="flex-1 bg-black/40 backdrop-blur-xs"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="w-80 bg-white border-l border-gray-200 h-full overflow-y-auto p-5 shadow-2xl flex flex-col">
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-800">Filters</h2>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-full text-gray-400"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1">
              <FilterPanel filters={filters} setFilters={setFilters} setPage={setPage} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Filter Panel Component ── */
const FilterPanel = ({ filters, setFilters, setPage }) => {
  const handleChange = (e) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (setPage) setPage(1);
  };

  const clearFilters = () => {
    setFilters({ category: "", gender: "", income: "", branch: "", activeStatus: "" });
    if (setPage) setPage(1);
  };

  const activeCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
          <SlidersHorizontal size={14} className="text-blue-600" />
          Filters
          {activeCount > 0 && (
            <span className="bg-blue-600 text-white rounded-full text-[10px] font-bold px-1.5 py-0.5">
              {activeCount}
            </span>
          )}
        </h3>
        {activeCount > 0 && (
          <button
            onClick={clearFilters}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Category */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Category</label>
        <select
          name="category"
          value={filters.category}
          onChange={handleChange}
          className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
        >
          <option value="">All Categories</option>
          <option value="SCHOLARSHIP">Scholarship</option>
          <option value="FEE_WAIVER">Fee Waiver</option>
          <option value="EDUCATION_LOAN">Education Loan</option>
          <option value="FINANCIAL_ASSISTANCE">Financial Assistance</option>
          <option value="GRANT">Grant</option>
          <option value="OTHER">Other</option>
        </select>
      </div>

      {/* Gender */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Gender Eligibility</label>
        <select
          name="gender"
          value={filters.gender}
          onChange={handleChange}
          className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
        >
          <option value="">All</option>
          <option value="ALL">All Genders</option>
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
        </select>
      </div>

      {/* Income */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Family Income Limit</label>
        <input
          type="text"
          name="income"
          value={filters.income}
          onChange={handleChange}
          placeholder="e.g. 30000 or 8L"
          className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
        />
      </div>

      {/* Branch */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Branch</label>
        <select
          name="branch"
          value={filters.branch}
          onChange={handleChange}
          className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
        >
          <option value="">All Branches</option>
          <option value="CSE">CSE</option>
          <option value="ECE">ECE</option>
          <option value="EE">EE</option>
          <option value="ME">ME</option>
          <option value="CE">CE</option>
          <option value="AI">AI</option>
          <option value="MNC">MNC</option>
          <option value="MME">Metallurgy (MME)</option>
          <option value="CBE">Chemical (CBE)</option>
          <option value="EP">Engineering Physics (EP)</option>
          <option value="ES">Economics (ES)</option>
        </select>
      </div>

      {/* Status */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Status</label>
        <select
          name="activeStatus"
          value={filters.activeStatus}
          onChange={handleChange}
          className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
        >
          <option value="">All Statuses</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>
    </div>
  );
};

export default Index;