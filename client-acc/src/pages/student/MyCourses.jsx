import { useEffect, useState, useContext } from "react";
import { Link, Outlet, useParams } from "react-router-dom";
import AuthContext from "../../context/auth/authContext";
import { BookOpen, Search, User2, ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function MyCourses() {
  const { firebaseUser, user } = useContext(AuthContext);

  const [courses, setCourses] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const { id } = useParams();

  useEffect(() => {
    fetchMyCourses();
  }, []);

  const fetchMyCourses = async () => {
    try {
      const token = await firebaseUser?.getIdToken();

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/v1/courses/my`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include"
        }
      );

      const data = await res.json();

      if (data.success) {
        setCourses(data.data);
        setFiltered(data.data);
      }
    } catch (error) {
      console.log("Error fetching courses:", error);
    }
    setLoading(false);
  };

  // Search filter
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      courses.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.courseCode.toLowerCase().includes(q) ||
          c.instructor?.toLowerCase().includes(q)
      )
    );
  }, [search, courses]);
  
  if (id) {
    return <Outlet />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-secondary)] shadow-[0_0_8px_var(--color-secondary)] animate-pulse" />
            <span className="text-xs font-black uppercase text-[var(--color-secondary)] tracking-widest">
              Academics &amp; Resources
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-[var(--color-primary)] tracking-tight">
            My Courses
          </h1>

          <p className="text-slate-600 text-sm mt-1 font-normal">
            Personalized academic courses and study material for{" "}
            <span className="font-bold text-[var(--color-primary)]">{user?.branchName || "your"}</span> branch
          </p>
        </div>

        {/* Course Count Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-md rounded-full border border-sky-200/80 shadow-xs text-xs font-black text-[var(--color-primary)] self-start md:self-auto">
          <BookOpen size={15} className="text-[var(--color-secondary)]" />
          <span>{courses.length} Registered Courses</span>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />

        <input
          type="text"
          placeholder="Search courses by name, course code, or faculty instructor..."
          className="w-full pl-11 pr-4 py-3.5 rounded-2xl border-2 border-slate-200/90 bg-white/95 text-[var(--color-primary)] placeholder-slate-400
                     focus:border-[var(--color-secondary)] focus:ring-4 focus:ring-[var(--color-secondary)]/15 outline-none shadow-xs transition-all text-sm font-medium"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <div className="w-10 h-10 border-3 border-sky-200 border-t-[var(--color-secondary)] rounded-full animate-spin mb-3" />
          <p className="text-sm font-bold text-[var(--color-primary)]">Loading registered courses...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 bg-white/90 border-2 border-slate-200/80 rounded-3xl p-8 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-[var(--color-secondary)] mb-3">
            <BookOpen size={32} />
          </div>
          <p className="text-base font-black text-[var(--color-primary)]">No courses found matching your query.</p>
          <p className="text-xs text-slate-500 mt-1">Try searching by full course name or department code.</p>
        </div>
      )}

      {/* Courses Grid */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((course, idx) => (
          <Link
            key={course.id}
            to={`/dashboard/courses/${course.id}`}
            className="block group"
          >
            <CourseCard course={course} index={idx} />
          </Link>
        ))}
      </div>
    </motion.div>
  );
}

// Course Card
function CourseCard({ course, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      whileHover={{ y: -6 }}
      className="h-full bg-gradient-to-b from-white/95 via-sky-50/25 to-blue-50/35 backdrop-blur-2xl p-6 sm:p-7 rounded-[2.2rem] border-2 border-[var(--color-secondary)]/40 hover:border-[var(--color-primary-accent)]/60 shadow-[0_12px_35px_rgba(11,30,63,0.06)] hover:shadow-[0_20px_50px_var(--color-secondary-glow)] transition-all duration-300 flex flex-col justify-between cursor-pointer relative overflow-hidden"
    >
      {/* Permanent Glow Aura inside Card */}
      <div className="absolute -top-10 -right-10 w-28 h-28 bg-[var(--color-secondary)]/20 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-100 border border-sky-200 text-[var(--color-primary)] group-hover:bg-[var(--color-primary)] group-hover:text-white transition-all duration-300 flex items-center justify-center shadow-xs">
            <BookOpen size={22} />
          </div>

          <span className="px-3 py-1 bg-white/95 text-[var(--color-primary)] border border-sky-200/80 text-[11px] font-black rounded-full uppercase tracking-wider shadow-xs">
            {course.credits} Credits
          </span>
        </div>

        <h2 className="text-lg font-black text-[var(--color-primary)] leading-snug group-hover:text-[var(--color-primary-accent)] transition-colors line-clamp-2">
          {course.name}
        </h2>
        <p className="text-[var(--color-secondary)] font-extrabold text-xs mt-1 uppercase tracking-wider">
          {course.courseCode}
        </p>
        
        {course.description && (
          <p className="text-slate-600 text-xs mt-3 line-clamp-2 leading-relaxed font-normal">
            {course.description}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200/80 text-slate-600 text-xs relative z-10">
        <div className="flex items-center gap-2 truncate pr-2">
          <User2 size={15} className="text-slate-400 shrink-0" />
          <span className="truncate font-semibold text-slate-700">
            {course.instructor || "Faculty Instructor"}
          </span>
        </div>

        <span className="text-[var(--color-secondary)] font-black text-xs group-hover:translate-x-1 transition-transform shrink-0">
          Explore →
        </span>
      </div>
    </motion.div>
  );
}
