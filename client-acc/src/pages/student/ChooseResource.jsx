import { useParams, Link, Outlet } from "react-router-dom";
import { RESOURCE_TYPES } from "./resourceTypes.js";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import axios from "axios";
import { useState } from "react";

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

  }, [id])


  const fetchResourceCount = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/v1/dashboard/public/resource-count/${id}`,
        {
          withCredentials: true,
        }
      );
      if (response.data && response.data.data) {
        setCounts(response.data.data);
        console.log(response.data.data)
      }
    } catch (error) {
      console.error("Failed to fetch resource count:", error);
    }
  }

  const fetchCourse = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/v1/courses/${id}`,
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
    <div className="p-6 space-y-8">
      {/* Back */}
      <Link
        to="/dashboard/courses"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft size={16} />
        Back to Courses
      </Link>
      {loading ? (
        <div className="text-center py-20 text-gray-500 animate-pulse">
          Loading course info...
        </div>
      ) : (
        <div className="bg-white rounded-xl border p-6 space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                {course.name}
              </h1>
              <p className="text-sm text-gray-500 mt-1">{course.courseCode}</p>
            </div>

            <span className="px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-sm font-medium">
              {course.credits}
            </span>
          </div>

          <p className="text-gray-600 max-w-3xl">{course.description}</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 pt-4">
            <div>
              <span className="text-gray-400 block">Instructor</span>
              {course.instructor}
            </div>
            <div>
              <span className="text-gray-400 block">Allowed Branches</span>
              <p className="text-gray-700">
                {course?.allowedBranch?.join(", ") || "Not specified"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Resource Types */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Course Resources
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {RESOURCE_TYPES.map(({ key, label, icon: Icon, color }) => (
            <Link
              key={key}
              to={`${key}`}
              className={`
        rounded-xl p-6 border transition
        bg-${color}-50 border-${color}-100
        hover:shadow-md hover:border-${color}-300
      `}
            >
              <div className="flex items-start justify-between">
                <Icon className={`text-${color}-600`} size={28} />
              </div>

              <h3 className={`mt-4 text-${color}-700 font-semibold`}>
                {label}
              </h3>

              <p className={`text-sm mt-1 text-${color}-600`}>
                {counts[key] ?? 0} resources
              </p>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}
