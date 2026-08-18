import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  BookOpen,
  FolderOpen,
  ChevronUp,
  ChevronDown,
  Search,
  Mail,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import FAQAccordion from "../../components/faq/FAQAccordion";
import FAQSearchBar from "../../components/faq/FAQSearchBar";
import FAQSidebar from "../../components/faq/FAQSidebar";
import { getCategories, getFAQByCategory, searchFAQ, faqData } from "../../lib/fuseSearch";

const ITEMS_PER_PAGE = 8;

/**
 * FAQ Page – categorized FAQ with professional sidebar navigation, search, accordions, and pagination.
 */
export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const categories = useMemo(() => getCategories(), []);

  /** Count of items per category */
  const categoryCounts = useMemo(() => {
    const counts = {};
    categories.forEach((cat) => {
      counts[cat] = faqData.filter((f) => f.category === cat).length;
    });
    return counts;
  }, [categories]);

  /** Displayed FAQ items after search or category filter */
  const displayedItems = useMemo(() => {
    if (searchQuery.trim().length > 0) {
      return searchFAQ(searchQuery, 100).map((r) => r.item);
    }
    return getFAQByCategory(activeCategory);
  }, [searchQuery, activeCategory]);

  const totalPages = Math.ceil(displayedItems.length / ITEMS_PER_PAGE) || 1;

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return displayedItems.slice(start, start + ITEMS_PER_PAGE);
  }, [displayedItems, currentPage]);

  const handleCategorySelect = useCallback((cat) => {
    setActiveCategory(cat);
    setSearchQuery("");
    setCurrentPage(1);
    setMobileMenuOpen(false);
  }, []);

  const handleSearchChange = useCallback((query) => {
    setSearchQuery(query);
    setCurrentPage(1);
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
      {/* ── Hero Header ─────────────────────────────────────────── */}
      <div className="relative pt-32 pb-14 px-4 overflow-hidden border-b border-slate-200/90 bg-white">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-3 tracking-tight text-slate-950 leading-tight">
              Frequently Asked Questions
            </h1>
            <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto mb-7 leading-relaxed">
              Find verified answers regarding course registrations, grading, branch change, academic resources, hostels, and financial opportunities.
            </p>

            {/* Search bar in hero */}
            <div className="max-w-2xl mx-auto">
              <FAQSearchBar
                value={searchQuery}
                onChange={handleSearchChange}
                resultCount={displayedItems.length}
              />
            </div>
          </motion.div>

          {/* Stats bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto mt-8"
          >
            {[
              { label: "Questions Answered", value: `${faqData.length}+` },
              { label: "Categories", value: categories.length },
              { label: "Response Engine", value: "Instant Fuse" },
              { label: "Academic Session", value: "2025-26" },
            ].map(({ label, value }) => (
              <div key={label} className="bg-[#F8FAFC] border border-slate-200/90 rounded-xl p-3.5 text-center shadow-2xs">
                <div className="text-xl sm:text-2xl font-black text-slate-950">{value}</div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">{label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Mobile category toggle */}
        <div className="lg:hidden mb-6">
          <button
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="flex items-center gap-2 text-xs font-bold text-slate-900 bg-white border border-slate-200 px-4 py-3 rounded-xl w-full justify-between cursor-pointer shadow-2xs"
          >
            <span className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-blue-600" />
              <span>{activeCategory} ({displayedItems.length} items)</span>
            </span>
            {mobileMenuOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden mt-2 bg-white rounded-xl border border-slate-200 shadow-lg p-3"
              >
                <FAQSidebar
                  categories={categories}
                  active={activeCategory}
                  onSelect={handleCategorySelect}
                  counts={categoryCounts}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* ── Sidebar (desktop) ──────────────────────────────── */}
          <motion.aside
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="hidden lg:block w-64 shrink-0 sticky top-24"
          >
            <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs p-3.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-2.5">
                Categories
              </p>
              <FAQSidebar
                categories={categories}
                active={activeCategory}
                onSelect={handleCategorySelect}
                counts={categoryCounts}
              />
            </div>
          </motion.aside>

          {/* ── FAQ list ────────────────────────────────────────── */}
          <main className="flex-1 min-w-0 w-full">
            {/* Section heading */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-slate-950 flex items-center gap-2">
                  <HelpCircle size={20} className="text-blue-600" />
                  <span>
                    {searchQuery
                      ? `Search Results for "${searchQuery}"`
                      : activeCategory === "All"
                      ? "All Questions"
                      : activeCategory}
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Showing {displayedItems.length} question{displayedItems.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {/* Items */}
            <AnimatePresence mode="wait">
              {paginatedItems.length > 0 ? (
                <motion.div
                  key={`${activeCategory}-${searchQuery}-${currentPage}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  className="flex flex-col gap-3"
                >
                  {paginatedItems.map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.025, duration: 0.2 }}
                    >
                      <FAQAccordion item={item} defaultOpen={i === 0 && !!searchQuery} />
                    </motion.div>
                  ))}

                  {/* ── Pagination Controls ───────────────────────────── */}
                  {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-5 border-t border-slate-200">
                      <p className="text-xs text-slate-500 font-medium">
                        Showing <span className="font-bold text-slate-900">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{" "}
                        <span className="font-bold text-slate-900">{Math.min(currentPage * ITEMS_PER_PAGE, displayedItems.length)}</span> of{" "}
                        <span className="font-bold text-slate-900">{displayedItems.length}</span> FAQs
                      </p>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setCurrentPage((prev) => Math.max(prev - 1, 1));
                            window.scrollTo({ top: 320, behavior: "smooth" });
                          }}
                          disabled={currentPage === 1}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                        >
                          <ChevronLeft size={14} />
                          <span>Prev</span>
                        </button>

                        {/* Page Numbers */}
                        <div className="flex items-center gap-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                            .map((pageNum, idx, arr) => {
                              const prev = arr[idx - 1];
                              return (
                                <React.Fragment key={pageNum}>
                                  {prev && pageNum - prev > 1 && (
                                    <span className="px-1 text-xs text-slate-400">…</span>
                                  )}
                                  <button
                                    onClick={() => {
                                      setCurrentPage(pageNum);
                                      window.scrollTo({ top: 320, behavior: "smooth" });
                                    }}
                                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                      currentPage === pageNum
                                        ? "bg-slate-900 text-white shadow-xs"
                                        : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                                    }`}
                                  >
                                    {pageNum}
                                  </button>
                                </React.Fragment>
                              );
                            })}
                        </div>

                        <button
                          onClick={() => {
                            setCurrentPage((prev) => Math.min(prev + 1, totalPages));
                            window.scrollTo({ top: 320, behavior: "smooth" });
                          }}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                        >
                          <span>Next</span>
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-16 text-center bg-white border border-slate-200 rounded-2xl p-8 shadow-2xs"
                >
                  <div className="w-14 h-14 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-3 text-slate-400">
                    <Search className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-950 mb-1">
                    No matching FAQs found
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                    Try searching with different keywords or select another category from the sidebar.
                  </p>
                  <button
                    onClick={() => { setSearchQuery(""); setActiveCategory("All"); setCurrentPage(1); }}
                    className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    Clear Filter
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>

        {/* ── Bottom CTA banner ────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mt-14 bg-white border border-slate-200/90 rounded-2xl p-8 text-center text-slate-900 shadow-2xs"
        >
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-3.5 text-blue-600 shadow-2xs">
            <BookOpen className="w-5 h-5" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mb-1.5 text-slate-950 tracking-tight">
            Still Have Questions?
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm mb-5 max-w-md mx-auto leading-relaxed">
            Our AskACC interactive assistant is available 24/7 on the portal to provide instant guidance.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a
              href="mailto:acc@iitp.ac.in"
              className="inline-flex items-center gap-2 bg-slate-900 hover:bg-blue-600 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition cursor-pointer shadow-xs"
            >
              <Mail className="w-4 h-4" />
              <span>Email Academic Council</span>
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
