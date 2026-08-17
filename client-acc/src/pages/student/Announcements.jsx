import { useEffect, useState } from "react";
import { Bell, User2, Calendar, AlertCircle, FileDown, ExternalLink, Pin, Sparkles } from "lucide-react";
import AuthContext from "../../context/auth/authContext";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 6;
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
  }, [page]);

  // ---------------- FETCH ANNOUNCEMENTS ----------------
  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/v1/announcements?page=${page}&limit=${limit}`,
        {
          credentials: "include",
        }
      );

      const data = await res.json();

      if (data.success) {
        // pinned announcements first
        const sorted = [
          ...data.data.filter((a) => a.isPinned),
          ...data.data.filter((a) => !a.isPinned),
        ];

        setAnnouncements(sorted);
        setHasMore(data.data.length === limit);
      }
    } catch (error) {
      toast.error("Unable to fetch announcements");
      console.log("Error fetching announcements:", error);
      setHasMore(false);
    }

    setLoading(false);
  };

  /* ===================================
      PRIORITY BADGE UI
  ==================================== */
  const PriorityBadge = ({ priority }) => {
    const styles = {
      HIGH: "bg-rose-50 text-rose-700 border-rose-200",
      MEDIUM: "bg-amber-50 text-amber-700 border-amber-200",
      LOW: "bg-sky-50 text-[var(--color-primary)] border-sky-200",
    };

    return (
      <span
        className={`px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider border shadow-xs ${styles[priority] || styles.LOW}`}
      >
        {priority || "LOW"}
      </span>
    );
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return "Recent";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {/* ---------- PAGE HEADER ---------- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-secondary)] shadow-[0_0_8px_var(--color-secondary)] animate-pulse" />
            <span className="text-xs font-black uppercase text-[var(--color-secondary)] tracking-widest">
              Campus Bulletins
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-[var(--color-primary)] tracking-tight flex items-center gap-3">
            <Bell className="text-[var(--color-secondary)] w-8 h-8" /> Announcements
          </h1>

          <p className="text-slate-600 text-sm mt-1 font-normal">
            Official academic circulars, council notifications, and critical deadlines.
          </p>
        </div>

        {/* Count Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-md rounded-full border border-sky-200/80 shadow-xs text-xs font-black text-[var(--color-primary)] self-start md:self-auto">
          <Sparkles size={15} className="text-[var(--color-secondary)]" />
          <span>{announcements.length} Active Notices</span>
        </div>
      </div>

      {/* ---------- LOADING ---------- */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <div className="w-10 h-10 border-3 border-sky-200 border-t-[var(--color-secondary)] rounded-full animate-spin mb-3" />
          <p className="text-sm font-bold text-[var(--color-primary)]">Loading announcements...</p>
        </div>
      )}

      {/* ---------- EMPTY STATE ---------- */}
      {!loading && announcements.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 bg-white/90 border-2 border-slate-200/80 rounded-3xl p-8 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-[var(--color-secondary)] mb-3">
            <Bell size={32} />
          </div>
          <p className="text-base font-black text-[var(--color-primary)]">No announcements found.</p>
          <p className="text-xs text-slate-500 mt-1">New updates and council circulars will be published here.</p>
        </div>
      )}

      {/* ---------- LIST ---------- */}
      <div className="space-y-5">
        {announcements.map((a, idx) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05, duration: 0.3 }}
            className={`p-6 sm:p-7 rounded-[2.2rem] border-2 backdrop-blur-2xl transition-all duration-300 relative overflow-hidden ${
              a.isPinned
                ? "bg-gradient-to-r from-white/95 via-sky-50/50 to-blue-50/40 border-[var(--color-secondary)]/60 shadow-[0_12px_35px_var(--color-secondary-glow)]"
                : "bg-white/95 border-slate-200/90 shadow-[0_8px_25px_rgba(11,30,63,0.04)] hover:border-sky-300"
            }`}
          >
            {/* Pinned Glow Indicator */}
            {a.isPinned && (
              <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-secondary)]/15 rounded-full blur-2xl pointer-events-none" />
            )}

            {/* -------- TITLE + BADGES + ATTACHMENT -------- */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full relative z-10">
              <div className="flex flex-wrap items-center gap-2.5">
                {a.isPinned && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary)] text-white px-3 py-1 text-[10.5px] font-black uppercase tracking-wider shadow-xs">
                    <Pin size={12} className="text-[var(--color-secondary-soft)] rotate-45" />
                    <span>Pinned Notice</span>
                  </span>
                )}

                <h2 className="text-lg sm:text-xl font-black text-[var(--color-primary)] leading-snug">
                  {a.title}
                </h2>

                <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-0.5 text-[10.5px] font-black text-slate-700 border border-slate-200 uppercase tracking-wider">
                  {a.type || "GENERAL"}
                </span>

                {a.priority && <PriorityBadge priority={a.priority} />}
              </div>

              {/* Attachment Link */}
              <div className="shrink-0 self-start sm:self-auto">
                {a.fileURL && a.filePath ? (
                  <a
                    href={a.fileURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] text-white hover:opacity-95 text-xs font-black transition-all shadow-xs cursor-pointer"
                  >
                    <span>View Circular</span>
                    <ExternalLink size={13} />
                  </a>
                ) : (
                  <span className="text-slate-400 text-xs italic font-medium">No Attachment</span>
                )}
              </div>
            </div>

            {/* -------- DESCRIPTION -------- */}
            <p className="text-slate-700 text-sm mt-4 leading-relaxed font-normal relative z-10">
              {a.description}
            </p>

            {/* -------- FOOTER (department + date) -------- */}
            <div className="flex flex-wrap items-center gap-6 mt-5 pt-4 border-t border-slate-100 text-xs text-slate-500 relative z-10">
              {/* Uploaded By */}
              <div className="flex items-center gap-2">
                <User2 size={15} className="text-[var(--color-secondary)]" />
                <span className="font-bold text-[var(--color-primary)]">
                  {a.uploadedBy?.displayName || "Academic Office"}
                </span>
              </div>

              {/* Date */}
              <div className="flex items-center gap-2">
                <Calendar size={15} className="text-[var(--color-secondary)]" />
                <span className="font-semibold text-slate-600">{formatDate(a.updatedAt)}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ---------- PAGINATION ---------- */}
      {announcements.length > 0 && (
        <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200/90 rounded-2xl p-4 flex justify-between items-center text-xs text-slate-600 shadow-xs">
          <p className="font-medium">
            Showing <span className="font-black text-[var(--color-primary)]">{announcements.length}</span> notices on page <span className="font-black text-[var(--color-primary)]">{page}</span>
          </p>

          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-700 hover:text-[var(--color-primary)] hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer font-bold shadow-xs"
            >
              Previous
            </button>

            <span className="px-3.5 py-1.5 rounded-full bg-[var(--color-primary)] text-white font-black text-xs shadow-xs">
              {page}
            </span>

            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasMore}
              className="px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-700 hover:text-[var(--color-primary)] hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer font-bold shadow-xs"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
