import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FileText,
  Loader2,
  ExternalLink,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  Sparkles,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";

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
        return "bg-indigo-50 text-indigo-700 border border-indigo-200";
      case "NOTES":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200";
      case "LECTURE_SLIDE":
        return "bg-sky-50 text-[var(--color-primary)] border border-sky-200";
      default:
        return "bg-slate-50 text-slate-700 border border-slate-200";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Back Button */}
      <Link
        to={`/dashboard/courses/${id}`}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[var(--color-primary)] transition-all px-4 py-2 rounded-full bg-white/90 border border-slate-200 shadow-xs hover:shadow-sm hover:scale-105"
      >
        <ArrowLeft size={14} className="text-[var(--color-secondary)]" />
        <span>Back to Categories</span>
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-secondary)] shadow-[0_0_8px_var(--color-secondary)]" />
            <h1 className="text-2xl sm:text-3xl font-black text-[var(--color-primary)] flex items-center gap-2.5 uppercase tracking-wide">
              <FileText className="text-[var(--color-secondary)] w-6 h-6" /> {key?.replace(/_/g, " ")}
            </h1>
          </div>
          <p className="text-slate-600 text-xs sm:text-sm mt-1 ml-5 font-normal">
            Verified study materials, previous exams, and curriculum documents.
          </p>
        </div>
      </div>

      <div className="bg-white/95 backdrop-blur-2xl rounded-[2rem] border-2 border-slate-200/90 shadow-[0_12px_35px_rgba(11,30,63,0.05)] overflow-hidden">
        {loading && resources.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <Loader2 className="animate-spin text-[var(--color-secondary)] w-8 h-8 mb-2" />
            <p className="text-sm font-bold text-[var(--color-primary)]">Loading documents...</p>
          </div>
        ) : resources.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400 p-6 text-center">
            <FileText size={40} className="mb-2 text-slate-300" />
            <p className="text-base font-bold text-[var(--color-primary)]">No documents uploaded for this category yet.</p>
            <p className="text-xs text-slate-500 mt-1">Please check back soon or contact your course representative.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/90">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-black text-[var(--color-primary)] uppercase tracking-wider">
                      Title &amp; Description
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-black text-[var(--color-primary)] uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-black text-[var(--color-primary)] uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {resources.map((res) => (
                    <tr key={res.id} className="hover:bg-sky-50/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-black text-[var(--color-primary)] leading-snug">
                          {res.title}
                        </div>
                        {res.description && (
                          <div className="text-xs text-slate-500 truncate max-w-md mt-0.5 font-normal">
                            {res.description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-[11px] font-black rounded-full uppercase tracking-wider ${getTypeStyle(res.resourceType)}`}>
                          {res.resourceType?.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        {res.fileURL && (
                          <a
                            href={res.fileURL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] text-white hover:opacity-95 text-xs font-bold transition-all shadow-xs cursor-pointer"
                          >
                            <span>Open File</span>
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-slate-100">
              {resources.map((res) => (
                <div key={res.id} className="p-5 hover:bg-sky-50/40 transition-colors">
                  <div className="flex justify-between items-start mb-2.5 gap-2">
                    <span className={`px-2.5 py-0.5 text-[10px] font-black rounded-full uppercase ${getTypeStyle(res.resourceType)}`}>
                      {res.resourceType?.replace(/_/g, " ")}
                    </span>
                    {res.fileURL && (
                      <a
                        href={res.fileURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--color-secondary)] hover:text-[var(--color-primary)] flex items-center gap-1 text-xs font-black transition-colors"
                      >
                        OPEN <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                  <h3 className="text-sm font-black text-[var(--color-primary)] mb-1 leading-snug">
                    {res.title}
                  </h3>
                  {res.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 font-normal">
                      {res.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination Bar */}
        <div className="bg-slate-50/90 px-6 py-4 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-slate-200 disabled:opacity-40 text-xs font-bold text-[var(--color-primary)] hover:bg-slate-100 transition-all cursor-pointer disabled:cursor-not-allowed shadow-xs"
          >
            <ChevronLeft size={14} />
            <span className="hidden xs:inline">Previous</span>
          </button>

          <span className="text-xs font-black text-[var(--color-primary)] bg-sky-100/90 border border-sky-200 px-3.5 py-1 rounded-full shadow-xs">
            Page {page}
          </span>

          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasMore}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-slate-200 disabled:opacity-40 text-xs font-bold text-[var(--color-primary)] hover:bg-slate-100 transition-all cursor-pointer disabled:cursor-not-allowed shadow-xs"
          >
            <span className="hidden xs:inline">Next</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default CourseResources;