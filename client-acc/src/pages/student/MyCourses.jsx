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
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-slate-200 shadow-2xs text-xs font-bold text-slate-900 self-start md:self-auto">
          <div className="w-5 h-5 rounded bg-blue-50 text-blue-600 flex items-center justify-center">
            <BookOpen size={13} />
          </div>
          <span>{courses.length} Registered Courses</span>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />

        <input
          type="text"
          placeholder="Search courses by name, course code, or faculty instructor..."
          className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400
                     focus:border-blue-600 focus:ring-3 focus:ring-blue-600/10 outline-none shadow-2xs transition-all text-sm font-medium"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <div className="w-9 h-9 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-3" />
          <p className="text-xs font-bold text-slate-700">Loading registered courses...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500 bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-xs">
          <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 mb-3">
            <BookOpen size={28} />
          </div>
          <p className="text-sm font-bold text-slate-900">No courses found matching your query.</p>
          <p className="text-xs text-slate-500 mt-1">Try searching by full course name or department code.</p>
        </div>
      )}

      {/* Courses Grid */}
      <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      whileHover={{ y: -3 }}
      className="h-full bg-white p-5 sm:p-6 rounded-xl border border-slate-200 hover:border-slate-300 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between cursor-pointer relative"
    >
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all duration-200 flex items-center justify-center shadow-2xs">
            <BookOpen size={18} />
          </div>

          <span className="px-2.5 py-1 bg-slate-100 text-slate-800 border border-slate-200 text-[11px] font-bold rounded-md uppercase tracking-wider shadow-2xs">
            {course.credits} Credits
          </span>
        </div>

        <h2 className="text-base font-bold text-slate-950 leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
          {course.name}
        </h2>
        <p className="text-blue-600 font-bold text-xs mt-1 uppercase tracking-wider flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
          <span>{course.courseCode}</span>
        </p>

        {course.description && (
          <p className="text-slate-500 text-xs mt-2.5 line-clamp-2 leading-relaxed">
            {course.description}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between mt-5 pt-3.5 border-t border-slate-100 text-slate-600 text-xs">
        <div className="flex items-center gap-1.5 truncate pr-2">
          <User2 size={14} className="text-slate-400 shrink-0" />
          <span className="truncate font-medium text-slate-700 text-[11px]">
            {course.instructor || "Faculty Instructor"}
          </span>
        </div>

        <span className="text-blue-600 font-bold text-xs group-hover:translate-x-1 transition-transform shrink-0 flex items-center gap-1">
          <span>View</span>
          <span>→</span>
        </span>
      </div>
    </motion.div>
  );
}
