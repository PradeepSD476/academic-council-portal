import React, { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import ScholarshipCard from "./components/ScholarshipCard";
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  Award,
  Filter,
  Check,
  RotateCcw,
  Sparkles,
} from "lucide-react";

const CATEGORIES = [
  { id: "", label: "All Opportunities" },
  { id: "SCHOLARSHIP", label: "Scholarships" },
  { id: "FEE_WAIVER", label: "Fee Waivers" },
  { id: "EDUCATION_LOAN", label: "Education Loans" },
  { id: "FINANCIAL_ASSISTANCE", label: "Financial Assistance" },
  { id: "GRANT", label: "Grants" },
  { id: "FEE_REIMBURSEMENT", label: "Fee Reimbursement" },
  { id: "OTHER", label: "Other" },
];

const BRANCHES = [
  "ALL", "CSE", "ECE", "EE", "ME", "CE", "AI", "MNC", "MME", "CBE", "EP", "ES"
];

const SUBCATEGORIES = ["SC", "ST", "OBC", "EWS", "PwD", "General"];

const Index = () => {
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [advancedDrawerOpen, setAdvancedDrawerOpen] = useState(false);
  const debounceRef = useRef(null);

  // Debounced search: updates searchTerm 400ms after user stops typing
  const handleSearchChange = useCallback((value) => {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchTerm(value);
      setPage(1);
    }, 400);
  }, []);

  // Debounced filter change for text inputs (state, income)
  const debouncedFilterRef = useRef(null);
  const handleDebouncedFilterChange = useCallback((name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
    if (debouncedFilterRef.current) clearTimeout(debouncedFilterRef.current);
    debouncedFilterRef.current = setTimeout(() => {
      setPage(1);
    }, 400);
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (debouncedFilterRef.current) clearTimeout(debouncedFilterRef.current);
    };
  }, []);

  const [filters, setFilters] = useState({
    category: "",
    subCategory: "",
    state: "",
    gender: "",
    income: "",
    branch: "",
    activeStatus: "",
  });

  // Lock background body scroll when drawer is open
  useEffect(() => {
    if (advancedDrawerOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [advancedDrawerOpen]);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchScholarships = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const { data } = await axios.get(
        `${import.meta.env.VITE_API_URL}/v1/finance-vault`,
        {
          params: {
            page,
            limit: 10,
            search: searchTerm,
            category: filters.category,
            subCategory: filters.subCategory,
            state: filters.state,
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

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(1);
  };

  const clearAllFilters = () => {
    setFilters({
      category: "",
      subCategory: "",
      state: "",
      gender: "",
      income: "",
      branch: "",
      activeStatus: "",
    });
    setSearchTerm("");
    setSearchInput("");
    setPage(1);
  };

  const activeNonCategoryFilterCount = Object.entries(filters).filter(
    ([k, v]) => k !== "category" && Boolean(v)
  ).length;

  return (
    <div className="space-y-6 text-[var(--color-primary)] pb-12">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-[3px] h-6 bg-[var(--color-secondary)] rounded-full shadow-[0_0_8px_var(--color-secondary)]" />
            <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--color-primary)] tracking-tight flex items-center gap-2.5">
              <Award className="text-[var(--color-secondary)]" size={26} /> Finance Vault
            </h1>
          </div>
          <p className="text-slate-500 text-sm ml-4">
            Discover institutional scholarships, government fee waivers, financial assistance, and education loans.
          </p>
        </div>
      </div>

      {/* ── Category Quick Tabs (Horizontal) ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const isActive = filters.category === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => handleFilterChange("category", cat.id)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                isActive
                  ? "bg-[var(--color-secondary)] text-white shadow-[0_4px_16px_var(--color-secondary-glow)] scale-[1.02]"
                  : "bg-white/95 backdrop-blur-xl shadow-xs border border-slate-200 text-slate-500 hover:text-[var(--color-primary)] hover:border-slate-300 hover:bg-white/90"
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* ── Search & Filter Control Toolbar ── */}
      <div className="bg-white/95 backdrop-blur-xl shadow-xs border border-slate-200 rounded-3xl p-3 sm:p-4 shadow-lg flex flex-col md:flex-row items-stretch md:items-center gap-3 justify-between">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by title, provider, or keywords..."
            className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 bg-white/90 text-[var(--color-primary)] placeholder-slate-400 focus:outline-none focus:border-[var(--color-secondary)] text-xs transition"
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchInput("");
                setSearchTerm("");
                setPage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[var(--color-primary)] p-0.5 cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Quick Dropdowns & Advanced Filters Trigger */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Branch Filter */}
          <select
            value={filters.branch}
            onChange={(e) => handleFilterChange("branch", e.target.value)}
            className="bg-white/90 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-[var(--color-primary)] focus:outline-none focus:border-[var(--color-secondary)] cursor-pointer"
          >
            <option value="" className="bg-sky-100 text-slate-500">All Branches</option>
            {BRANCHES.filter(b => b !== "ALL").map((b) => (
              <option key={b} value={b} className="bg-sky-100 text-[var(--color-primary)]">
                Branch: {b}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filters.activeStatus}
            onChange={(e) => handleFilterChange("activeStatus", e.target.value)}
            className="bg-white/90 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-[var(--color-primary)] focus:outline-none focus:border-[var(--color-secondary)] cursor-pointer"
          >
            <option value="" className="bg-sky-100 text-slate-500">All Statuses</option>
            <option value="true" className="bg-sky-100 text-[var(--color-primary)]">Active Listings</option>
            <option value="false" className="bg-sky-100 text-[var(--color-primary)]">Closed / Inactive</option>
          </select>

          {/* More Filters Button */}
          <button
            onClick={() => setAdvancedDrawerOpen(true)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
              activeNonCategoryFilterCount > 0
                ? "bg-[var(--color-secondary)]/15 border-[var(--color-secondary)]/40 text-[var(--color-secondary)]"
                : "bg-white/90 border-slate-200 text-slate-600 hover:text-[var(--color-primary)] hover:border-slate-300"
            }`}
          >
            <SlidersHorizontal size={13} />
            <span>More Filters</span>
            {activeNonCategoryFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-[var(--color-secondary)] text-white text-[10px] flex items-center justify-center font-bold">
                {activeNonCategoryFilterCount}
              </span>
            )}
          </button>

          {/* Clear All Filters Button */}
          {(activeNonCategoryFilterCount > 0 || filters.category || searchTerm) && (
            <button
              onClick={clearAllFilters}
              title="Reset all filters"
              className="p-2.5 text-slate-500 hover:text-[var(--color-secondary)] bg-white/90 hover:bg-white/5 border border-slate-200 rounded-xl transition cursor-pointer"
            >
              <RotateCcw size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ── Active Filter Badges Strip ── */}
      {(filters.category || filters.branch || filters.subCategory || filters.gender || filters.income || filters.state || filters.activeStatus || searchTerm) && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Active Filters:</span>
          {filters.category && (
            <FilterTag
              label={`Category: ${CATEGORIES.find(c => c.id === filters.category)?.label || filters.category}`}
              onRemove={() => handleFilterChange("category", "")}
            />
          )}
          {filters.branch && (
            <FilterTag
              label={`Branch: ${filters.branch}`}
              onRemove={() => handleFilterChange("branch", "")}
            />
          )}
          {filters.subCategory && (
            <FilterTag
              label={`Social Category: ${filters.subCategory}`}
              onRemove={() => handleFilterChange("subCategory", "")}
            />
          )}
          {filters.gender && (
            <FilterTag
              label={`Gender: ${filters.gender}`}
              onRemove={() => handleFilterChange("gender", "")}
            />
          )}
          {filters.income && (
            <FilterTag
              label={`Income: ${filters.income}`}
              onRemove={() => handleFilterChange("income", "")}
            />
          )}
          {filters.state && (
            <FilterTag
              label={`State: ${filters.state}`}
              onRemove={() => handleFilterChange("state", "")}
            />
          )}
          {filters.activeStatus && (
            <FilterTag
              label={`Status: ${filters.activeStatus === "true" ? "Active" : "Closed"}`}
              onRemove={() => handleFilterChange("activeStatus", "")}
            />
          )}
          {searchTerm && (
            <FilterTag
              label={`Query: "${searchTerm}"`}
              onRemove={() => setSearchTerm("")}
            />
          )}
        </div>
      )}

      {/* ── Results Count Bar ── */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs text-slate-500 font-medium">
          {loading ? (
            "Fetching opportunities..."
          ) : (
            <>
              Showing <span className="font-bold text-[var(--color-primary)]">{scholarships.length}</span> of{" "}
              <span className="font-bold text-[var(--color-secondary)]">{total}</span> opportunities
            </>
          )}
        </p>
      </div>

      {/* ── Opportunities Grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="animate-pulse bg-white/95 backdrop-blur-xl shadow-xs border border-slate-200 rounded-3xl p-6 shadow-md space-y-4"
            >
              <div className="flex justify-between items-center">
                <div className="h-5 bg-neutral-800 rounded-full w-24" />
                <div className="h-5 bg-neutral-800 rounded-full w-16" />
              </div>
              <div className="h-6 bg-neutral-800 rounded-md w-4/5" />
              <div className="h-4 bg-neutral-800 rounded-md w-1/2" />
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="h-12 bg-neutral-800/60 rounded-xl" />
                <div className="h-12 bg-neutral-800/60 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-950/40 border border-red-800/60 rounded-3xl p-8 text-center max-w-lg mx-auto">
          <p className="text-red-300 font-semibold mb-3 text-sm">{error}</p>
          <button
            onClick={fetchScholarships}
            className="bg-[var(--color-secondary)] hover:opacity-90 text-white text-xs font-bold px-5 py-2 rounded-xl transition cursor-pointer"
          >
            Retry Fetching
          </button>
        </div>
      ) : scholarships.length === 0 ? (
        <div className="bg-white/95 backdrop-blur-xl shadow-xs border border-slate-200 rounded-3xl p-16 text-center shadow-lg">
          <Award size={48} className="mx-auto text-slate-500 mb-3" />
          <h3 className="text-base font-bold text-[var(--color-primary)] mb-1">No Matching Opportunities</h3>
          <p className="text-slate-500 text-xs max-w-sm mx-auto mb-4">
            We couldn't find any financial opportunities matching your selected criteria.
          </p>
          <button
            onClick={clearAllFilters}
            className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-[var(--color-primary)] text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer"
          >
            <RotateCcw size={13} />
            <span>Reset All Filters</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {scholarships.map((s) => (
              <ScholarshipCard key={s.id || s._id} scholarship={s} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white/95 backdrop-blur-xl shadow-xs border border-slate-200 rounded-2xl p-4 shadow-md flex items-center justify-between text-xs text-slate-500">
              <button
                disabled={page === 1 || loading}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-600 hover:text-[var(--color-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition font-semibold cursor-pointer"
              >
                <ChevronLeft size={14} /> Previous
              </button>
              <span className="font-bold text-[var(--color-primary)]">
                Page <span className="text-[var(--color-secondary)]">{page}</span> of {totalPages}
              </span>
              <button
                disabled={page === totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
                className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-600 hover:text-[var(--color-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition font-semibold cursor-pointer"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Advanced Filters Drawer ── */}
      {advancedDrawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="flex-1 bg-black/80 backdrop-blur-xs"
            onClick={() => setAdvancedDrawerOpen(false)}
          />
          <div className="w-full max-w-md bg-white/95 backdrop-blur-xl shadow-xs border-l border-slate-200 h-full overflow-y-auto p-6 shadow-2xl flex flex-col text-[var(--color-primary)]">
            <div className="flex justify-between items-center pb-4 mb-6 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={16} className="text-[var(--color-secondary)]" />
                <h2 className="text-base font-extrabold text-[var(--color-primary)]">Advanced Filters</h2>
              </div>
              <button
                onClick={() => setAdvancedDrawerOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-full text-slate-500 hover:text-[var(--color-primary)] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 space-y-5">
              {/* Sub Category */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Social Category / Reservation
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["", ...SUBCATEGORIES].map((sc) => {
                    const isSelected = filters.subCategory === sc;
                    return (
                      <button
                        key={sc || "ALL"}
                        onClick={() => handleFilterChange("subCategory", sc)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                          isSelected
                            ? "bg-[var(--color-secondary)]/15 border-[var(--color-secondary)]/50 text-[var(--color-secondary)]"
                            : "bg-white/90 border-slate-200 text-slate-500 hover:text-[var(--color-primary)]"
                        }`}
                      >
                        {sc || "All Categories"}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Gender Eligibility */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Gender Eligibility
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: "", label: "All" },
                    { val: "MALE", label: "Male" },
                    { val: "FEMALE", label: "Female" },
                  ].map((g) => {
                    const isSelected = filters.gender === g.val;
                    return (
                      <button
                        key={g.val}
                        onClick={() => handleFilterChange("gender", g.val)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                          isSelected
                            ? "bg-[var(--color-secondary)]/15 border-[var(--color-secondary)]/50 text-[var(--color-secondary)]"
                            : "bg-white/90 border-slate-200 text-slate-500 hover:text-[var(--color-primary)]"
                        }`}
                      >
                        {g.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Domicile / State */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  State / Domicile
                </label>
                <input
                  type="text"
                  value={filters.state}
                  onChange={(e) => handleDebouncedFilterChange("state", e.target.value)}
                  placeholder="e.g. Bihar, UP, All India"
                  className="w-full bg-white/90 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-[var(--color-primary)] placeholder-slate-400 focus:outline-none focus:border-[var(--color-secondary)]"
                />
              </div>

              {/* Income Eligibility */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Family Income Limit (Max)
                </label>
                <input
                  type="text"
                  value={filters.income}
                  onChange={(e) => handleDebouncedFilterChange("income", e.target.value)}
                  placeholder="e.g. 800000 or 8 LPA"
                  className="w-full bg-white/90 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-[var(--color-primary)] placeholder-slate-400 focus:outline-none focus:border-[var(--color-secondary)]"
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-6 border-t border-slate-200 flex items-center justify-between gap-3 mt-6">
              <button
                onClick={clearAllFilters}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-600 transition cursor-pointer"
              >
                Reset
              </button>
              <button
                onClick={() => setAdvancedDrawerOpen(false)}
                className="flex-1 bg-[var(--color-secondary)] hover:opacity-90 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-[0_8px_20px_var(--color-secondary-glow)] transition cursor-pointer text-center"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const FilterTag = ({ label, onRemove }) => (
  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-white/90 border border-slate-200 text-slate-600">
    <span>{label}</span>
    <button
      onClick={onRemove}
      className="p-0.5 hover:bg-white/10 rounded-full text-slate-500 hover:text-[var(--color-primary)] cursor-pointer"
    >
      <X size={12} />
    </button>
  </span>
);

export default Index;