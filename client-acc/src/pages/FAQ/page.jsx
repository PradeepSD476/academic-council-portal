import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, BookOpen, Sparkles, FolderOpen, ChevronUp, ChevronDown, Search, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import FAQAccordion from "../../components/faq/FAQAccordion";
import FAQSearchBar from "../../components/faq/FAQSearchBar";
import FAQSidebar from "../../components/faq/FAQSidebar";
import { getCategories, getFAQByCategory, searchFAQ, faqData } from "../../lib/fuseSearch";

/**
 * FAQ Page – categorized FAQ with sidebar navigation, search, and accordions.
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
      // Fuse.js search ignores category filter
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
      {/* ── Hero Header ─────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-14 sm:py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-6">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span className="text-xs font-semibold text-white/90 uppercase tracking-wider">
                IIT Patna · Academic Council
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black mb-4 leading-tight">
              Frequently Asked Questions
            </h1>
            <p className="text-blue-100 text-base sm:text-lg max-w-2xl mx-auto mb-10">
              Find instant answers to all your questions about campus life,
              academics, hostel, fees, placements, and more.
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
            transition={{ delay: 0.3, duration: 0.4 }}
            className="flex flex-wrap justify-center gap-6 mt-10 text-center"
          >
            {[
              { label: "Questions Answered", value: faqData.length + "+" },
              { label: "Categories", value: categories.length },
              { label: "Response Time", value: "Instant" },
              { label: "Last Updated", value: "2025" },
            ].map(({ label, value }) => (
              <div key={label} className="text-white/80">
                <div className="text-2xl font-black text-white">{value}</div>
                <div className="text-xs text-blue-200 mt-0.5">{label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Mobile category toggle */}
        <div className="lg:hidden mb-5">
          <button
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="flex items-center gap-2 text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-4 py-2.5 rounded-xl w-full justify-between"
          >
            <span className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4" />
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
                className="overflow-hidden mt-2 bg-white rounded-2xl border border-gray-200 shadow-lg p-3"
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

        <div className="flex gap-7">
          {/* ── Sidebar (desktop) ──────────────────────────────── */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="hidden lg:block w-60 flex-shrink-0"
          >
            <div className="sticky top-24 bg-white border border-gray-200 rounded-2xl shadow-sm p-3">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-3">
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
          <main className="flex-1 min-w-0">
            {/* Section heading */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {searchQuery
                    ? `Results for "${searchQuery}"`
                    : activeCategory === "All"
                    ? "All Questions"
                    : activeCategory}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {displayedItems.length} question{displayedItems.length !== 1 ? "s" : ""}
                </p>
              </div>

              {/* Ask chatbot CTA */}
              <Link
                to="/"
                className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-2 rounded-xl transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Ask AskACC
              </Link>
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
                  className="flex flex-col gap-3"
                >
                  {displayedItems.map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.2 }}
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
                  className="flex flex-col items-center justify-center py-20 text-center"
                >
                  <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-5">
                    <Search className="w-7 h-7 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-700 mb-2">
                    No results found
                  </h3>
                  <p className="text-sm text-gray-500 max-w-xs">
                    Try different keywords or browse a category. You can also
                    ask AskACC directly.
                  </p>
                  <Link
                    to="/"
                    className="mt-5 flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Ask AskACC
                  </Link>
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
          className="mt-16 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 rounded-3xl p-8 text-center text-white shadow-xl"
        >
          <BookOpen className="w-10 h-10 mx-auto mb-4 opacity-80" />
          <h2 className="text-2xl font-black mb-2">
            Still have questions?
          </h2>
          <p className="text-blue-100 text-sm mb-6 max-w-md mx-auto">
            Our AskACC chatbot is available 24/7 to help you with any
            question about IIT Patna.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-white text-blue-700 font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-blue-50 transition-colors shadow-sm"
            >
              <MessageCircle className="w-4 h-4" />
              Open AskACC
            </Link>
            <a
              href="mailto:acc@iitp.ac.in"
              className="inline-flex items-center gap-2 bg-white/15 border border-white/30 text-white font-semibold px-6 py-2.5 rounded-xl text-sm hover:bg-white/25 transition-colors"
            >
              <Mail className="w-4 h-4" />
              Email ACC
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
