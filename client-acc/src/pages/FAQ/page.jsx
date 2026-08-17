import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, BookOpen, Sparkles, FolderOpen, ChevronUp, ChevronDown, Search, Mail, HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";
import FAQAccordion from "../../components/faq/FAQAccordion";
import FAQSearchBar from "../../components/faq/FAQSearchBar";
import FAQSidebar from "../../components/faq/FAQSidebar";
import { getCategories, getFAQByCategory, searchFAQ, faqData } from "../../lib/fuseSearch";

/**
 * FAQ Page – categorized FAQ with sidebar navigation, search, and accordions in dark obsidian theme.
 */
export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      return searchFAQ(searchQuery, 25).map((r) => r.item);
    }
    return getFAQByCategory(activeCategory);
  }, [searchQuery, activeCategory]);

  const handleCategorySelect = useCallback((cat) => {
    setActiveCategory(cat);
    setSearchQuery("");
    setMobileMenuOpen(false);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--color-canvas)] text-[var(--color-primary)]">
      {/* ── Hero Header ─────────────────────────────────────────── */}
      <div className="relative pt-32 pb-16 px-4 overflow-hidden border-b border-slate-200">
        <div className="absolute inset-0 bg-radial-[circle_at_50%_0%] from-[var(--color-secondary)]/15 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/95 backdrop-blur-xl shadow-xs border border-[var(--color-secondary)]/30 rounded-full px-4 py-1.5 mb-6 shadow-[0_0_15px_rgba(232,93,37,0.2)]">
              <Sparkles className="w-3.5 h-3.5 text-[var(--color-secondary)]" />
              <span className="text-xs font-bold text-[var(--color-secondary)] uppercase tracking-wider">
                IIT Patna · Academic Council
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black mb-4 tracking-tight text-[var(--color-primary)] leading-tight">
              Frequently Asked Questions
            </h1>
            <p className="text-slate-500 text-sm sm:text-base max-w-2xl mx-auto mb-8 leading-relaxed">
              Find verified answers regarding course registrations, grading, branch change, academic resources, hostels, and financial opportunities.
            </p>

            {/* Search bar in hero */}
            <div className="max-w-2xl mx-auto">
              <FAQSearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                resultCount={displayedItems.length}
              />
            </div>
          </motion.div>

          {/* Stats bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto mt-10"
          >
            {[
              { label: "Questions Answered", value: `${faqData.length}+` },
              { label: "Categories", value: categories.length },
              { label: "Response Engine", value: "Instant Fuse" },
              { label: "Academic Session", value: "2025-26" },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/95 backdrop-blur-xl shadow-xs border border-slate-200 rounded-2xl p-4 text-center">
                <div className="text-xl sm:text-2xl font-black text-[var(--color-primary)]">{value}</div>
                <div className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mt-1">{label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 py-12">

        {/* Mobile category toggle */}
        <div className="lg:hidden mb-6">
          <button
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="flex items-center gap-2 text-xs font-bold text-[var(--color-primary)] bg-white/95 backdrop-blur-xl shadow-xs border border-slate-200 px-4 py-3 rounded-2xl w-full justify-between cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-[var(--color-secondary)]" />
              {activeCategory} ({displayedItems.length} items)
            </span>
            {mobileMenuOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22 }}
                className="overflow-hidden mt-2 bg-white/95 backdrop-blur-xl shadow-xs rounded-2xl border border-slate-200 shadow-2xl p-3"
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
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="hidden lg:block w-64 shrink-0 sticky top-24"
          >
            <div className="bg-white/95 backdrop-blur-xl shadow-xs border border-slate-200 rounded-3xl shadow-xl p-4">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 mb-3">
                FAQ Categories
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
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-extrabold text-[var(--color-primary)] flex items-center gap-2">
                  <HelpCircle size={20} className="text-[var(--color-secondary)]" />
                  {searchQuery
                    ? `Search Results for "${searchQuery}"`
                    : activeCategory === "All"
                    ? "All Questions"
                    : activeCategory}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Showing {displayedItems.length} question{displayedItems.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {/* Items */}
            <AnimatePresence mode="wait">
              {displayedItems.length > 0 ? (
                <motion.div
                  key={activeCategory + searchQuery}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22 }}
                  className="flex flex-col gap-3.5"
                >
                  {displayedItems.map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03, duration: 0.2 }}
                    >
                      <FAQAccordion item={item} defaultOpen={i === 0 && !!searchQuery} />
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-20 text-center bg-white/95 backdrop-blur-xl shadow-xs border border-slate-200 rounded-3xl p-8"
                >
                  <div className="w-16 h-16 rounded-full bg-white/90 border border-slate-200 flex items-center justify-center mx-auto mb-4">
                    <Search className="w-7 h-7 text-slate-500" />
                  </div>
                  <h3 className="text-base font-bold text-[var(--color-primary)] mb-1">
                    No matching FAQs found
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                    Try searching with different keywords or select another category from the sidebar.
                  </p>
                  <button
                    onClick={() => { setSearchQuery(""); setActiveCategory("All"); }}
                    className="inline-flex items-center gap-1.5 bg-[var(--color-secondary)] hover:opacity-90 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-[0_8px_20px_var(--color-secondary-glow)] cursor-pointer"
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
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-16 bg-white/95 backdrop-blur-xl shadow-xs border border-slate-200 rounded-3xl p-8 md:p-12 text-center text-[var(--color-primary)] shadow-2xl relative overflow-hidden"
        >
          <div className="w-12 h-12 rounded-2xl bg-sky-100 border border-slate-200 flex items-center justify-center mx-auto mb-4 text-[var(--color-secondary)]">
            <BookOpen className="w-6 h-6" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold mb-2 text-[var(--color-primary)] tracking-tight">
            Still Have Questions?
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mb-6 max-w-md mx-auto leading-relaxed">
            Our AskACC interactive chatbot is available 24/7 on the bottom right of your screen to provide instant academic assistance.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a
              href="mailto:acc@iitp.ac.in"
              className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-[var(--color-primary)] font-bold px-6 py-2.5 rounded-xl text-xs transition cursor-pointer"
            >
              <Mail className="w-4 h-4 text-[var(--color-secondary)]" />
              Email Academic Council
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
