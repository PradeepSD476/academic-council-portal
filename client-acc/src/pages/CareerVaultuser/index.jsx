import React, { useState, useContext, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ChevronDown, ChevronUp, MessageSquare, ArrowBigUp, PenSquare, X, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import AuthContext from "../../context/auth/authContext";
import CommentSection from "./CommentSection";
import NativeRichTextEditor from "./NativeRichTextEditor";
import { forumApi } from "../../api/forumApi";

const EXPERIENCE_TYPES = [
  { value: "INTERNSHIP", label: "Internship" },
  { value: "PLACEMENT", label: "Placement" },
  { value: "STARTUP", label: "Startup" },
];

// ─── Create Post Modal ────────────────────────────────────────────────────────
const CreatePostModal = ({ onClose, onSubmitted }) => {
  const [title, setTitle] = useState("");
  const [experienceType, setExperienceType] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return toast.error("Please enter a title.");
    if (!experienceType) return toast.error("Please select an experience type.");
    const strippedDesc = description.replace(/<[^>]*>/g, "").trim();
    if (!strippedDesc) return toast.error("Please write something in the description.");

    setSubmitting(true);
    try {
      await forumApi.submitPost({ title: title.trim(), description, experienceType });
      toast.success("Post submitted! It will appear publicly after admin review.");
      onSubmitted();
      onClose();
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to submit post. Please try again.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden"
          initial={{ opacity: 0, scale: 0.94, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 24 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <PenSquare size={20} className="text-blue-600" />
              <h2 className="text-lg font-bold text-gray-800">Share Your Experience</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto p-6 gap-4">
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-sm text-blue-700">
              📋 Your post will be reviewed by an admin before it goes public. You will see it appear on the Career Vault once approved.
            </div>

            {/* Title */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="post-title" className="text-sm font-semibold text-gray-700">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                id="post-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. My internship experience at Google"
                maxLength={150}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
              />
            </div>

            {/* Experience Type */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="post-type" className="text-sm font-semibold text-gray-700">
                Experience Type <span className="text-red-500">*</span>
              </label>
              <select
                id="post-type"
                value={experienceType}
                onChange={(e) => setExperienceType(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white transition"
              >
                <option value="">Select type…</option>
                {EXPERIENCE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Rich Text Editor (same as comment editor) */}
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-sm font-semibold text-gray-700">
                Your Story <span className="text-red-500">*</span>
              </label>
              <NativeRichTextEditor
                value={description}
                onChange={setDescription}
                minHeight="220px"
                placeholder="Describe your experience in detail — preparation tips, interview process, key learnings…"
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                    Submitting…
                  </>
                ) : (
                  "Submit for Review"
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ─── Main CareerVault Page ────────────────────────────────────────────────────
const CareerVault = () => {
  const { user } = useContext(AuthContext);
  const [experiences, setExperiences] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const currentUserId = user?.id;
  const currentUserName = user?.displayName || "Student";

  const fetchPosts = async (targetPage = page) => {
    setIsLoading(true);
    try {
      const response = await forumApi.getPosts(targetPage, 10);
      if (response.data.success) {
        const mapped = response.data.data.map((p) => ({
          ...p,
          authorName: p.uploadedBy?.displayName || p.authorName || "Unknown",
        }));
        setExperiences(mapped);
        setTotalPages(response.data.pagination.totalPages);
        setPage(response.data.pagination.page);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast.error("Could not load experiences.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(page);
  }, [page]);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const toggleLike = async (id) => {
    setExperiences((prev) =>
      prev.map((exp) => {
        if (exp.id === id) {
          const hasLiked = exp.likedBy?.includes(currentUserId);
          return {
            ...exp,
            likes: hasLiked ? exp.likes - 1 : exp.likes + 1,
            likedBy: hasLiked
              ? exp.likedBy.filter((uid) => uid !== currentUserId)
              : [...(exp.likedBy || []), currentUserId],
          };
        }
        return exp;
      })
    );

    try {
      await forumApi.toggleLike(id);
      // fetchPosts(); // Removed redundant fetch to prevent jumpiness; state already updated optimismtically
    } catch (err) {
      console.error("Like failed:", err);
      fetchPosts();
    }
  };

  const handleDeletePost = async (id) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await forumApi.deletePost(id);
      toast.success("Post deleted!");
      fetchPosts();
    } catch (err) {
      toast.error("Failed to delete post.");
    }
  };

  const handleCommentAdd = async (expId, text) => {
    try {
      await forumApi.addComment({ content: text, postId: expId, parentId: null });
      toast.success("Comment added!");
      fetchPosts();
    } catch (error) {
      toast.error("Failed to add comment.");
      console.error(error);
    }
  };

  const handleCommentDelete = async (expId, commentId) => {
    try {
      await forumApi.deleteComment(commentId);
      toast.success("Comment deleted!");
      fetchPosts();
    } catch (error) {
      toast.error("Failed to delete comment.");
      console.error(error);
    }
  };

  const handleReplyDelete = async (expId, commentId, replyId) => {
    try {
      await forumApi.deleteComment(replyId);
      toast.success("Reply deleted!");
      fetchPosts();
    } catch (error) {
      toast.error("Failed to delete reply.");
      console.error(error);
    }
  };

  const handleReplyAdd = async (expId, commentId, text) => {
    try {
      await forumApi.addComment({ content: text, postId: expId, parentId: commentId });
      toast.success("Reply added!");
      fetchPosts();
    } catch (error) {
      toast.error("Failed to add reply.");
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* Create Post Modal */}
      {showCreateModal && (
        <CreatePostModal
          onClose={() => setShowCreateModal(false)}
          onSubmitted={fetchPosts}
        />
      )}

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
              Career Vault
            </h1>
            <p className="text-gray-500 mt-2">
              Learn from the experiences of seniors and alumni.
            </p>
          </div>

          {/* ── Create Post Button ── */}
          <motion.button
            id="create-post-btn"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-md transition-colors"
          >
            <PenSquare size={16} />
            Create Post
          </motion.button>
        </div>

        <div className="space-y-4">
          <AnimatePresence>
            {experiences?.map((exp) => {
              const isExpanded = expandedId === exp.id;

              return (
                <motion.div
                  key={exp.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                >
                  <div className="p-5 hover:bg-gray-50 transition-colors">
                    <div
                      className="flex justify-between items-start cursor-pointer group"
                      onClick={() => toggleExpand(exp.id)}
                    >
                      <div>
                        <h2 className="text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                          {exp.title}
                        </h2>
                        <div className="text-sm text-gray-500 flex items-center gap-2 mt-1 mb-4">
                          <span className="font-medium text-blue-600">
                            {exp.authorName}
                          </span>
                          <span>•</span>
                          <span>
                            {new Date(
                              exp.date || exp.createdAt
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {exp.uploadedById === currentUserId && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePost(exp.id);
                            }}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete Post"
                          >
                            <Trash2 size={20} />
                          </button>
                        )}
                        <div className="text-gray-400 ml-2 flex flex-col items-center gap-1 group-hover:text-blue-500 transition-colors">
                          {isExpanded ? (
                            <ChevronUp size={24} />
                          ) : (
                            <ChevronDown size={24} />
                          )}
                          <span className="text-[10px] font-bold uppercase tracking-wider">
                            {isExpanded ? "Close" : "Read More"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-gray-500">
                      <button
                        onClick={() => toggleLike(exp.id)}
                        className={`flex items-center gap-1.5 transition-colors ${
                          exp.likedBy?.includes(currentUserId)
                            ? "text-pink-600"
                            : "hover:text-pink-600"
                        }`}
                      >
                        <ArrowBigUp size={18} />
                        <span className="font-medium text-sm">
                          {exp._count.likes}
                        </span>
                      </button>

                      <div className="flex items-center gap-1.5 text-gray-500">
                        <MessageSquare size={18} />
                        <span className="font-medium text-sm">
                          {exp._count.comments || 0} Comments
                        </span>
                      </div>

                      <button
                        onClick={() => setExpandedId(exp.id)}
                        className="text-sm font-medium border border-gray-300 px-3 py-1.5 rounded-md hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
                      >
                        Share your thought
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 border-t border-gray-100 mt-4 pt-4">
                          <div
                            className="text-gray-700 pb-4 leading-relaxed quill-content border-b border-gray-100 mb-6"
                            dangerouslySetInnerHTML={{
                              __html: exp.content || exp.description,
                            }}
                          />

                          <CommentSection
                            experience={exp}
                            currentUserId={currentUserId}
                            currentUserName={currentUserName}
                            onCommentAdd={handleCommentAdd}
                            onReplyAdd={handleReplyAdd}
                            onCommentDelete={handleCommentDelete}
                            onReplyDelete={handleReplyDelete}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {(!experiences || experiences.length === 0) && !isLoading && (
            <div className="text-center py-12 text-gray-500">
              No posts out here yet!
            </div>
          )}

          {isLoading && (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-8">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft size={16} /> Previous
              </button>
              <span className="text-sm font-semibold text-gray-600">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CareerVault;
