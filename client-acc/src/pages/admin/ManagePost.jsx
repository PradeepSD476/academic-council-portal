import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Edit2, FileText, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { deletePost, getAllPosts } from "../../lib/Post_Functions";
import { forumApi } from "../../api/forumApi";
import { getFilePath } from "../../lib/getFilePath";
import toast from "react-hot-toast";

const PAGE_SIZE = 10;

const stripHtml = (value = "") => value.replace(/<[^>]*>/g, "").trim();

const ManagePost = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [posts, setPosts] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Resume Modal State
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [activeResumePost, setActiveResumePost] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadPosts = async () => {
      setIsLoading(true);
      const response = await getAllPosts(page, PAGE_SIZE);

      if (!isMounted) {
        return;
      }

      setPosts(Array.isArray(response?.data) ? response.data : []);
      setTotalPages(response?.pagination?.totalPages || 1);
      setTotalResults(response?.pagination?.total || 0);
      setIsLoading(false);
    };

    void loadPosts();

    return () => {
      isMounted = false;
    };
  }, [page]);

  const openEditorForId = (postId) => {
    navigate("/admin/editor", { state: { postId } });
  };

  const handleDeletePost = async (postId) => {
    const response = await deletePost(postId);

    if (response?.success) {
      setPosts((prev) => prev.filter((item) => item.id !== postId));
    }
  };

  const handleOpenResumeModal = (post) => {
    setActiveResumePost(post);
    setResumeFile(null);
    setShowResumeModal(true);
  };

  const handleResumeSubmit = async () => {
    if (!resumeFile) return toast.error("Please select a PDF file.");
    if (resumeFile.type !== "application/pdf") return toast.error("File must be PDF.");
    if (resumeFile.size > 5 * 1024 * 1024) return toast.error("File size must be < 5MB.");
    
    setIsUploading(true);
    try {
      const uploadResult = await getFilePath({ file: resumeFile, folder: "resumes" });
      if (uploadResult?.filePath) {
        await forumApi.addOrUpdateResume(activeResumePost.id, uploadResult.filePath);
        toast.success("Resume updated successfully!");
        setPosts((prev) => prev.map(p => p.id === activeResumePost.id ? { ...p, resumeUrl: uploadResult.filePath } : p));
        setShowResumeModal(false);
      } else {
        toast.error("Failed to upload resume to storage.");
      }
    } catch (err) {
      toast.error("Error updating resume.");
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteResume = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this resume?")) return;
    try {
      await forumApi.deleteResume(postId);
      toast.success("Resume deleted successfully!");
      setPosts((prev) => prev.map(p => p.id === postId ? { ...p, resumeUrl: null } : p));
    } catch (err) {
      toast.error("Failed to delete resume.");
      console.error(err);
    }
  };

  
  

  const startItem = totalResults === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(page * PAGE_SIZE, totalResults);

  return (
    <div className="space-y-6">
      {/*Headers*/}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-[3px] h-6 bg-[var(--color-secondary)] rounded-full shadow-[0_0_8px_var(--color-secondary)]" />
            <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--color-primary)] tracking-tight flex items-center gap-2.5">
              <FileText className="text-[var(--color-secondary)]" size={24} /> Manage Posts
            </h1>
          </div>
          <p className="text-slate-500 text-sm ml-4">
            Review, edit, draft, and moderate student career experiences.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="text-xs font-semibold text-slate-500 bg-white/95 backdrop-blur-xl shadow-xs border border-slate-200 rounded-xl px-3.5 py-2">
            Total Posts:{" "}
            <span className="font-bold text-[var(--color-primary)] ml-1">{totalResults || posts.length}</span>
          </div>

          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            onClick={() => {
              openEditorForId(-1);
            }}
          >
            <span>+ New Post</span>
          </button>
        </div>
      </div>

      {/* Pagination Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Title &amp; Summary
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Posted By
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Engagement
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Resume
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3.5 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Actions
                </th> 
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {posts.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-16 text-center text-sm text-slate-500"
                  >
                    {isLoading ? "Loading posts..." : "No career posts found."}
                  </td>
                </tr>
              ) : (
                posts.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    {/* Title and Description */}
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-slate-900 leading-snug">
                        {item.title}
                      </div>
                      <div className="text-xs text-slate-500 truncate max-w-xs mt-0.5">
                        {stripHtml(item.description)}
                      </div>
                    </td>

                    {/* Types */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-0.5 inline-flex text-[11px] font-semibold rounded-md bg-blue-50 border border-blue-100 text-blue-700">
                        {item.experienceType || "INTERVIEW"}
                      </span>
                    </td>

                    {/*Posted By*/}
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-slate-600">
                      {item.uploadedBy?.displayName || "Anonymous"}
                    </td>

                    {/*Likes/Comments*/}
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 font-medium">
                      ♥ {item._count?.likes || 0} &nbsp;·&nbsp; 💬 {item._count?.comments || 0}
                    </td>
                    
                    {/*Post Data*/}
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 font-medium">
                      {new Date(item.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>

                    {/*Resume*/}
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 font-medium">
                      {item.resumeUrl ? (
                        <div className="flex flex-col gap-1">
                          <span className="text-emerald-600 font-semibold text-[10px] uppercase">Attached</span>
                          <div className="flex gap-2">
                            <button onClick={() => handleOpenResumeModal(item)} className="text-blue-600 hover:underline" title="Update Resume">Update</button>
                            <button onClick={() => handleDeleteResume(item.id)} className="text-red-600 hover:underline" title="Delete Resume">Delete</button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => handleOpenResumeModal(item)} className="text-slate-600 hover:text-[var(--color-primary)] bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded text-[10px] font-bold uppercase transition" title="Add Resume">
                          + Add
                        </button>
                      )}
                    </td>

                    {/*Status*/}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 inline-flex text-[10px] font-bold border rounded-full uppercase tracking-wider ${
                        item.status === 'PUBLISHED'
                          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                          : item.status === 'DRAFT'
                          ? 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                          : 'bg-rose-950/60 text-rose-300 border-rose-800/60'
                      }`}>
                        {item.status || "DRAFT"}
                      </span>
                    </td>

                    {/*Editing Options for a Single Post*/}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          className="p-1.5 text-slate-500 hover:text-[var(--color-primary)] bg-white/5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                          aria-label={`Edit ${item.title}`}
                          onClick={() => {
                            openEditorForId(item.id);
                          }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          className="p-1.5 text-slate-500 hover:text-red-400 bg-white/5 hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                          aria-label={`Delete ${item.title}`}
                          onClick={() => {
                            void handleDeletePost(item.id);
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                    
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5 border-t border-slate-200 bg-white/90 text-xs text-slate-500">
          <p>
            Showing <span className="font-bold text-[var(--color-primary)]">{startItem}</span> to <span className="font-bold text-[var(--color-primary)]">{endItem}</span> of <span className="font-bold text-[var(--color-primary)]">{totalResults}</span>
          </p>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page === 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-600 hover:text-[var(--color-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition font-semibold cursor-pointer"
            >
              <ChevronLeft size={14} /> Prev
            </button>

            {Array.from({ length: totalPages }, (_, index) => index + 1).map(
              (pageNo) => (
                <button
                  key={pageNo}
                  onClick={() => setPage(pageNo)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    pageNo === page
                      ? "bg-[var(--color-secondary)] text-white shadow-[0_0_10px_rgba(232,93,37,0.3)]"
                      : "bg-white/5 border border-white/10 text-slate-500 hover:text-[var(--color-primary)]"
                  }`}
                >
                  {pageNo}
                </button>
              ),
            )}

            <button
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page === totalPages}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-600 hover:text-[var(--color-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition font-semibold cursor-pointer"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Resume Modal */}
      {showResumeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">
              {activeResumePost?.resumeUrl ? "Update Resume" : "Add Resume"}
            </h2>
            <p className="text-sm text-slate-500 mb-4">
              Post: <span className="font-semibold text-slate-700">{activeResumePost?.title}</span>
            </p>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setResumeFile(e.target.files[0] || null)}
              className="w-full text-sm mb-4 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[var(--color-primary)]/10 file:text-[var(--color-primary)] hover:file:bg-[var(--color-primary)]/20"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowResumeModal(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleResumeSubmit}
                disabled={isUploading}
                className="px-4 py-2 text-sm font-bold text-white bg-[var(--color-secondary)] hover:opacity-90 rounded-lg transition disabled:opacity-50"
              >
                {isUploading ? "Uploading..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagePost;
