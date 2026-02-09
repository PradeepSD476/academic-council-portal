import { useEffect, useState, useContext } from "react";
import { Link, Outlet, useParams } from "react-router-dom";
import AuthContext from "../../context/auth/authContext";
import { BookOpen, Search, User2 } from "lucide-react";

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
        `${import.meta.env.VITE_API_URL}/api/v1/courses/my`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include"
        }
      );

      const data = await res.json();
      console.log(data);

      if (data.success) {
        setCourses(data.data);
        setFiltered(data.data);
      }
    } catch (error) {
      console.log("Error fetching courses:", error);
    }
    setLoading(false);
  };

  //search
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
  
  if(id){
    return <Outlet/>
  }

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">
        My Courses
      </h1>

      <p className="text-gray-600 mt-1 text-sm">
        Courses available for{" "}
        <span className="font-medium text-gray-800">{user?.branchName}</span>{" "}
        branch
      </p>

      <div className="relative mt-6 mb-6">
        <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />

        <input
          type="text"
          placeholder="Search courses by name, code, or instructor..."
          className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 
                     focus:border-blue-500 focus:ring-blue-500 outline-none shadow-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading && (
        <div className="text-center py-20 text-gray-500 animate-pulse">
          Loading courses...
        </div>
      )}

      {/* if no course  */}
      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-gray-500">
          <BookOpen size={40} className="text-gray-400 mb-3" />
          <p className="text-lg">No courses found matching your search.</p>
        </div>
      )}

      <div
        className="
        grid gap-6 mt-4
        grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3
      "
      >
        {filtered.map((course) => (
          <Link
            key={course.id}
            to={`/dashboard/courses/${course.id}`}
            className="block"
          >
            <CourseCard course={course} />
          </Link>
        ))}
      </div>
    </div>
  );
}

// course card
function CourseCard({ course }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <div className="bg-blue-50 p-3 rounded-lg shadow-sm">
          <BookOpen className="text-blue-600" size={24} />
        </div>

        <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded-full shadow-sm">
          {course.credits} Credits
        </span>
      </div>

      <h2 className="text-lg font-semibold text-gray-900 leading-tight">
        {course.name}
      </h2>
      <p className="text-gray-500 text-sm mt-1">{course.courseCode}</p>
      <p className="text-gray-600 text-sm mt-3 line-clamp-3">
        {course.description}
      </p>
      <div className="flex items-center gap-2 mt-4 text-gray-700 text-sm">
        <User2 size={16} className="text-gray-500" />
        <span className="font-medium">
          {course.instructor || "Unknown Instructor"}
        </span>
      </div>
    </div>
  );
}
