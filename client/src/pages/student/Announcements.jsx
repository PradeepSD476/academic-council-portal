import { useEffect, useState, useContext } from "react";
import { Bell, User2, Calendar, AlertCircle, FileDown, ExternalLink } from "lucide-react";
import AuthContext from "../../context/auth/authContext";

export default function Announcements() {
  const { firebaseUser } = useContext(AuthContext);

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 6;

  useEffect(() => {
    fetchAnnouncements();
  }, [page]);

  // ---------------- FETCH ANNOUNCEMENTS ----------------
  const fetchAnnouncements = async () => {
    try {
      const token = await firebaseUser?.getIdToken();

      const res = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/api/v1/announcements?page=${page}&limit=${limit}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();
      console.log("Announcements:", data);

      if (data.success) {
        // pinned announcements first
        const sorted = [
          ...data.data.filter((a) => a.isPinned),
          ...data.data.filter((a) => !a.isPinned),
        ];

        setAnnouncements(sorted);
      }
    } catch (error) {
      console.log("Error fetching announcements:", error);
    }

    setLoading(false);
  };

  /* ===================================
      PRIORITY BADGE UI
  ==================================== */
  const PriorityBadge = ({ priority }) => {
    const styles = {
      HIGH: "bg-red-100 text-red-600 border border-red-200",
      MEDIUM: "bg-yellow-100 text-yellow-800 border border-yellow-200",
      LOW: "bg-blue-100 text-blue-700 border border-blue-200",
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[priority]}`}
      >
        {priority || "LOW"}
      </span>
    );
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return "Unknown date";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="p-4 md:p-6">
      {/* ---------- PAGE HEADER ---------- */}
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-blue-600 p-3 rounded-xl shadow-md">
          <Bell size={26} className="text-white" />
        </div>

        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">
            Announcements
          </h1>
          <p className="text-gray-600 text-sm">
            Stay updated with the latest updates & notices
          </p>
        </div>
      </div>

      {/* ---------- LOADING ---------- */}
      {loading && (
        <p className="text-center py-12 text-gray-500 animate-pulse">
          Loading announcements...
        </p>
      )}

      {/* ---------- LIST ---------- */}
      <div className="space-y-6 mt-6">
        {announcements.map((a) => (
          <div
            key={a.id}
            className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition"
          >
            {/* -------- TITLE + PRIORITY + ALERT ICON -------- */}
            <div className="flex items-start justify-between w-full">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-gray-900">
                  {a.title}
                </h2>

                {/* Priority badge EXACT UI */}
                {/* <span
                  className={`
              px-3 py-1 rounded-full text-xs font-semibold
              ${
                a.priority === "HIGH"
                  ? "bg-red-100 text-red-600"
                  : a.priority === "MEDIUM"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-blue-100 text-blue-600"
              }
            `}
                >
                  {a.priority}
                </span> */}
              </div>

              {/* Right-side alert icon for HIGH priority */}
              <div className="px-6 py-1 whitespace-nowrap text-sm">
                {a.fileURL && a.filePath ? (
                  <a
                    href={a.fileURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-600 hover:underline"
                  >
                    View File <ExternalLink size={14} />
                  </a>
                ) : (
                  <span className="text-gray-400 text-xs">No Attachment</span>
                )}
              </div>
              {/* {a.priority === "HIGH" && (
                <AlertCircle size={20} className="text-red-600" />
              )} */}
            </div>

            {/* -------- DESCRIPTION -------- */}
            <p className="text-gray-700 text-sm mt-3 leading-relaxed">
              {a.description}
            </p>

            {/* -------- FOOTER (department + date) -------- */}
            <div className="flex items-center gap-8 mt-5 text-sm text-gray-600">
              {/* Uploaded By */}
              <div className="flex items-center gap-2">
                <User2 size={16} className="text-gray-500" />
                <span>{a.uploadedBy?.displayName || "Academic Office"}</span>
              </div>

              {/* Date */}
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-gray-500" />
                <span>{formatDate(a.updatedAt)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ---------- PAGINATION ---------- */}
      <div className="flex justify-between items-center mt-8 text-sm text-gray-600">
        <p>
          Showing {announcements.length} of {limit} announcements
        </p>

        <div className="flex items-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className={`px-3 py-1.5 rounded-lg border ${
              page === 1
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "hover:bg-gray-100"
            }`}
          >
            &lt;
          </button>

          <span className="px-4 py-1.5 rounded-lg bg-blue-600 text-white font-medium">
            {page}
          </span>

          <button
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 rounded-lg border hover:bg-gray-100"
          >
            &gt;
          </button>
        </div>
      </div>
    </div>
  );
}
