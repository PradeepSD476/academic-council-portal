import { useParams, Link, Outlet } from "react-router-dom";
import { RESOURCE_TYPES } from "./resourceTypes.js";
import { ArrowLeft, BookOpen, Layers, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";

export default function ChooseResource() {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({});
  const { id, key } = useParams();

  useEffect(() => {
    fetchCourse();
  }, [id]);

  useEffect(() => {
    fetchResourceCount();
  }, [id]);

  const fetchResourceCount = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/v1/dashboard/public/resource-count/${id}`,
        {
          withCredentials: true,
        }
      );
      if (response.data && response.data.data) {
        setCounts(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch resource count:", error);
    }
  };

  const fetchCourse = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/v1/courses/${id}`,
        {
          withCredentials: true,
        }
      );
      if (response.data && response.data.data) {
        setCourse(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch course:", error);
    } finally {
      setLoading(false);
    }
  };

  if (id && key) {
    return <Outlet />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {/* Back Button */}
      <Link
        to="/dashboard/courses"
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[var(--color-primary)] transition-all px-4 py-2 rounded-full bg-white/90 border border-slate-200 shadow-xs hover:shadow-sm hover:scale-105"
      >
        <ArrowLeft size={14} className="text-[var(--color-secondary)]" />
        <span>Back to Courses</span>
      </Link>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <div className="w-10 h-10 border-3 border-sky-200 border-t-[var(--color-secondary)] rounded-full animate-spin mb-3" />
          <p className="text-sm font-bold text-[var(--color-primary)]">Loading course overview...</p>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-white/95 via-sky-50/25 to-blue-50/35 backdrop-blur-2xl rounded-[2.5rem] border-2 border-[var(--color-secondary)]/40 hover:border-[var(--color-primary-accent)]/60 p-6 md:p-8 space-y-5 shadow-[0_12px_35px_rgba(11,30,63,0.06)] relative overflow-hidden transition-all duration-300">
          {/* Ambient Glow */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-[var(--color-secondary)]/20 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-[var(--color-secondary)] shadow-[0_0_6px_var(--color-secondary)]" />
                <span className="text-xs font-black text-[var(--color-secondary)] uppercase tracking-wider">
                  {course?.courseCode}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-[var(--color-primary)] tracking-tight">
                {course?.name}
              </h1>
            </div>

            <span className="px-4 py-1.5 rounded-full bg-white/95 text-[var(--color-primary)] border border-sky-200 text-xs font-black shrink-0 shadow-xs">
              {course?.credits} Credits
            </span>
          </div>

          {course?.description && (
            <p className="text-slate-600 text-sm leading-relaxed max-w-4xl font-normal relative z-10">
              {course.description}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-slate-200/80 text-xs text-slate-600 relative z-10">
            <div className="bg-white/90 p-4 rounded-2xl border border-sky-100 shadow-xs">
              <span className="text-slate-400 block uppercase text-[10px] font-black tracking-wider mb-1">
                Faculty Instructor
              </span>
              <span className="font-bold text-[var(--color-primary)] text-sm">
                {course?.instructor || "Not specified"}
              </span>
            </div>
            <div className="bg-white/90 p-4 rounded-2xl border border-sky-100 shadow-xs">
              <span className="text-slate-400 block uppercase text-[10px] font-black tracking-wider mb-1">
                Eligible Branches
              </span>
              <span className="font-bold text-[var(--color-primary)] text-sm">
                {course?.allowedBranch?.join(", ") || "All Branches"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Resource Types */}
      <div>
        <div className="flex items-center gap-2.5 mb-6">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-secondary)] shadow-[0_0_8px_var(--color-secondary)]" />
          <h2 className="text-lg font-black text-[var(--color-primary)] uppercase tracking-wider">
            Available Resource Categories
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {RESOURCE_TYPES.map(({ key, label, icon: Icon }, index) => (
            <Link
              key={key}
              to={`${key}`}
              className="group block"
            >
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                whileHover={{ y: -6 }}
                className="bg-gradient-to-b from-white/95 via-sky-50/25 to-blue-50/35 border-2 border-[var(--color-secondary)]/40 hover:border-[var(--color-primary-accent)]/60 rounded-[2.2rem] p-6 shadow-[0_10px_30px_rgba(11,30,63,0.05)] hover:shadow-[0_20px_50px_var(--color-secondary-glow)] transition-all duration-300 flex flex-col justify-between cursor-pointer relative overflow-hidden"
              >
                <div className="flex items-start justify-between relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-sky-100 border border-sky-200 text-[var(--color-primary)] group-hover:bg-[var(--color-primary)] group-hover:text-white transition-all duration-300 flex items-center justify-center shadow-xs">
                    <Icon size={22} />
                  </div>
                  <span className="text-[11px] font-black px-3 py-1 rounded-full bg-white/95 border border-sky-200/80 text-[var(--color-primary)] group-hover:border-[var(--color-secondary)] shadow-xs">
                    {counts[key] ?? 0} files
                  </span>
                </div>

                <div className="mt-5 relative z-10">
                  <h3 className="text-[var(--color-primary)] font-black text-lg group-hover:text-[var(--color-primary-accent)] transition-colors leading-snug">
                    {label}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 font-medium">
                    Access official slides, notes, PYQs &amp; study papers
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 flex justify-between items-center text-xs font-black text-[var(--color-secondary)] relative z-10">
                  <span>Browse Category</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
