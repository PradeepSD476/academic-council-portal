import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FileText,
  Loader2,
  ExternalLink,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";

const CourseResources = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 10;
  const [hasMore, setHasMore] = useState(true);

  const { id, key } = useParams();

  const fetchResources = async () => {
    setLoading(true);
    try {

      const response = await axios.get(
        `${
          import.meta.env.VITE_API_URL
        }/v1/resources/?page=${page}&limit=${limit}&resourceType=${key}&courseId=${id}`,
        {
          withCredentials: true
        }
      );

      if (response.data && response.data.data) {
        setResources(response.data.data);
        setHasMore(response.data.data.length === limit);
      }
    } catch (error) {
      console.error("Failed to fetch resources:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [page]);

  const getTypeStyle = (type) => {
    switch (type) {
      case "PYQ":
        return "bg-purple-100 text-purple-800";
      case "NOTES":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-4 md:p-6 min-h-screen bg-gray-50">
      <Link
        to={`/dashboard/courses/${id}`}
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors"
      >
        <ArrowLeft size={16} />
        <span>Back to Resources</span>
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2 uppercase">
            <FileText className="text-amber-500 w-5 h-5 md:w-6 md:h-6" /> {key}
          </h1>
          <p className="text-gray-500 text-xs md:text-sm mt-1">
            Available content for this course.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading && resources.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="animate-spin text-blue-500 w-8 h-8" />
          </div>
        ) : resources.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500 p-4 text-center">
            <FileText size={40} className="mb-2 opacity-20" />
            <p>No resources found for this category.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {resources.map((res) => (
                    <tr key={res.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {res.title}
                        </div>
                        <div className="text-xs text-gray-500 truncate max-w-xs">
                          {res.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeStyle(res.resourceType)}`}>
                          {res.resourceType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                        {res.fileURL && (
                          <a
                            href={res.fileURL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 hover:text-blue-800 transition-colors"
                          >
                            View <ExternalLink size={14} />
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-100">
              {resources.map((res) => (
                <div key={res.id} className="p-4 active:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${getTypeStyle(res.resourceType)}`}>
                      {res.resourceType}
                    </span>
                    {res.fileURL && (
                      <a
                        href={res.fileURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 flex items-center gap-1 text-xs font-bold"
                      >
                        VIEW <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 mb-1 leading-snug">
                    {res.title}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-2">
                    {res.description}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="bg-gray-50 px-4 md:px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1 px-3 py-1.5 md:px-4 md:py-2 border rounded-lg bg-white disabled:opacity-40 disabled:bg-gray-100 text-xs md:text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 shadow-sm"
          >
            <ChevronLeft size={16} />
            <span className="hidden xs:inline">Previous</span>
          </button>

          <span className="text-xs md:text-sm font-bold text-gray-600 bg-white border px-3 py-1 rounded-full shadow-inner">
             {page}
          </span>

          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasMore}
            className="flex items-center gap-1 px-3 py-1.5 md:px-4 md:py-2 border rounded-lg bg-white disabled:opacity-40 disabled:bg-gray-100 text-xs md:text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 shadow-sm"
          >
            <span className="hidden xs:inline">Next</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseResources;