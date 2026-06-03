import React, { useState, useContext, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown, ChevronUp, MessageSquare, ArrowBigUp,
  PenSquare, X, Trash2, ChevronLeft, ChevronRight, MessageCircle,
} from "lucide-react";
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

const DOMAINS = [
  { value: "CS", label: "CS" },
  { value: "ME", label: "ME" },
  { value: "ECE", label: "ECE" },
  { value: "EE", label: "EE" },
  { value: "Quant", label: "Quant" },
  { value: "Civil", label: "Civil" },
  { value: "Chemical", label: "Chemical" },
  { value: "Consulting", label: "Consulting" },
  { value: "Product", label: "Product" },
  { value: "Other", label: "Other" }
];

// ─── Create Post Modal ────────────────────────────────────────────────────────
const CreatePostModal = ({ onClose, onSubmitted }) => {
  const [title, setTitle] = useState("");
  const [experienceType, setExperienceType] = useState("");
  const [domain, setDomain] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return toast.error("Please enter a title.");
    if (!experienceType) return toast.error("Please select an experience type.");
    if (!domain) return toast.error("Please select a domain.");
    const strippedDesc = description.replace(/<[^>]*>/g, "").trim();
    if (!strippedDesc) return toast.error("Please write something in the description.");

    setSubmitting(true);
    try {
      await forumApi.submitPost({ title: title.trim(), description, experienceType, domain, status: "DRAFT" });
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

            {/* Domain */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="post-domain" className="text-sm font-semibold text-gray-700">
                Domain <span className="text-red-500">*</span>
              </label>
              <select
                id="post-domain"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white transition"
              >
                <option value="" disabled>Select domain...</option>
                {DOMAINS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>

            {/* Rich Text Editor */}
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

// ─── FEATURE 3: Compact Comment Preview ──────────────────────────────────────
const CommentPreview = ({ postId, commentCount, onViewAll }) => {
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await forumApi.getComments(postId, 1, 2);
        if (!cancelled && res.data.success) {
          setPreviews(
            res.data.data.map((c) => ({
              id: c.id,
              userName: c.user?.displayName || "Unknown",
              text: c.content,
            }))
          );
        }
      } catch {
        // silently fail – preview is non-critical
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [postId]);

  const stripHtml = (html) => html?.replace(/<[^>]*>/g, "") || "";

  if (loading) {
    return (
      <div className="px-5 pb-3">
        <div className="animate-pulse flex gap-2 items-center">
          <div className="h-2 bg-gray-200 rounded w-24" />
          <div className="h-2 bg-gray-200 rounded w-40" />
        </div>
      </div>
    );
  }

  if (previews.length === 0) {
    return (
      <div className="px-5 pb-4">
        <p className="text-xs text-gray-400 italic">No comments yet. Be the first!</p>
      </div>
    );
  }

  return (
    <div className="px-5 pb-4 space-y-2">
      {previews.map((c) => (
        <div
          key={c.id}
          className="flex items-start gap-2 group cursor-pointer"
          onClick={onViewAll}
          title="Click to view all comments"
        >
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600 uppercase">
            {c.userName?.[0] || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-semibold text-gray-700 mr-1.5">{c.userName}</span>
            <span className="text-xs text-gray-500 truncate block leading-snug">
              {stripHtml(c.text).slice(0, 120)}{stripHtml(c.text).length > 120 ? "…" : ""}
            </span>
          </div>
        </div>
      ))}

      {commentCount > 2 && (
        <button
          onClick={onViewAll}
          className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors mt-1 flex items-center gap-1"
        >
          <MessageCircle size={12} />
          View all {commentCount} comments
        </button>
      )}
    </div>
  );
};

// ─── Main CareerVault Page ────────────────────────────────────────────────────
const CareerVault = () => {
  const { user } = useContext(AuthContext);
  const [experiences, setExperiences] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [expandedComments, setExpandedComments] = useState({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [domainFilter, setDomainFilter] = useState("All");

  // FEATURE 1: spam prevention ref for in-flight like requests
  const likePendingRef = useRef({});

  // FEATURE 2: refs for comment sections (keyed by post id) for smooth scroll
  const commentSectionRefs = useRef({});

  // Always hold latest filter state so bare fetchPosts() calls read current values
  const filterRef = useRef({ page, domainFilter });
  filterRef.current = { page, domainFilter };

  const currentUserId = user?.id;
  const currentUserName = user?.displayName || "Student";

  const fetchPosts = useCallback(async (targetPage, targetDomain) => {
    // Fall back to current filter state via ref when called without args
    const pg = targetPage ?? filterRef.current.page;
    const dm = targetDomain ?? filterRef.current.domainFilter;
    setIsLoading(true);
    try {
      const response = await forumApi.getPosts(pg, 10, 'PUBLISHED', dm);
      if (response.data.success) {
        const mapped = response.data.data.map((p) => ({
          ...p,
          authorName: p.uploadedBy?.displayName || p.authorName || "Unknown",
          likes: p._count?.likes ?? 0,
          // Map array of like objects to array of userIds for local liked state
          likedBy: p.likes?.map((l) => l.userId) || [],
        }));
        setExperiences(mapped);
        setTotalPages(response.data.pagination.totalPages);
        setPage(response.data.pagination.page);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast.error("Could not load experiences. Please try again later.");

      setExperiences([]);
      setTotalPages(1);
      setPage(1);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts(page, domainFilter);
  }, [page, domainFilter]);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // FEATURE 1: Optimistic upvote with spam prevention + rollback
  const toggleLike = async (id) => {
    if (likePendingRef.current[id]) return;
    likePendingRef.current[id] = true;

    let previousExperiences;

    // Optimistically update UI immediately
    setExperiences((prev) => {
      previousExperiences = prev;
      return prev.map((exp) => {
        if (exp.id !== id) return exp;
        const hasLiked = exp.likedBy?.includes(currentUserId);
        return {
          ...exp,
          likes: hasLiked ? exp.likes - 1 : exp.likes + 1,
          likedBy: hasLiked
            ? exp.likedBy.filter((uid) => uid !== currentUserId)
            : [...(exp.likedBy || []), currentUserId],
        };
      });
    });

    try {
      const res = await forumApi.toggleLike(id);
      // Sync with authoritative count from server
      if (res.data.success) {
        setExperiences((prev) =>
          prev.map((exp) =>
            exp.id === id ? { ...exp, likes: res.data.likesCount } : exp
          )
        );
      }
    } catch (err) {
      console.error("Like failed:", err);
      // Rollback to previous state on failure
      setExperiences(previousExperiences);
      toast.error("Failed to update vote. Please try again.");
    } finally {
      likePendingRef.current[id] = false;
    }
  };

  // FEATURE 2: Comments click → expand + smooth scroll
  const handleCommentsClick = (id) => {
    setExpandedComments((prev) => {
      const isNowExpanded = !prev[id];
      if (isNowExpanded) {
        setTimeout(() => {
          const el = commentSectionRefs.current[id];
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "nearest" });
          }
        }, 150);
      }
      return { ...prev, [id]: isNowExpanded };
    });
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
      {showCreateModal && (
        <CreatePostModal
          onClose={() => setShowCreateModal(false)}
          onSubmitted={fetchPosts}
        />
      )}

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
              Career Vault
            </h1>
            <p className="text-gray-500 mt-2">
              Learn from the experiences of seniors and alumni.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <select
              value={domainFilter}
              onChange={(e) => {
                setDomainFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
            >
              <option value="All">All Domains</option>
              {DOMAINS.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
              <option value="Uncategorized">Uncategorized (Legacy)</option>
            </select>
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
        </div>

        <div className="space-y-4">
          <AnimatePresence>
            {experiences?.map((exp) => {
              const isExpanded = expandedId === exp.id;
              // FEATURE 1: derive local liked state
              const hasLiked = exp.likedBy?.includes(currentUserId);
              const commentCount = exp._count?.comments ?? 0;

              return (
                <motion.div
                  key={exp.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                >
                  <div className="p-5 hover:bg-gray-50 transition-colors">
                    {/* Post Header */}
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
                            {new Date(exp.date || exp.createdAt).toLocaleDateString()}
                          </span>
                          <>
                            <span>•</span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              {exp.domain || 'Uncategorized'}
                            </span>
                          </>
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

                    {/* Action Row */}
                    <div className="flex items-center gap-6 text-gray-500">

                      {/* FEATURE 1: Upvote button — optimistic + filled state */}
                      <button
                        id={`upvote-btn-${exp.id}`}
                        onClick={() => toggleLike(exp.id)}
                        disabled={!!likePendingRef.current[exp.id]}
                        aria-pressed={hasLiked}
                        aria-label={hasLiked ? "Remove upvote" : "Upvote"}
                        className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 transition-all duration-150 select-none ${
                          hasLiked
                            ? "bg-pink-100 text-pink-600 font-semibold"
                            : "hover:bg-pink-50 hover:text-pink-600"
                        }`}
                      >
                        <ArrowBigUp
                          size={20}
                          strokeWidth={hasLiked ? 0 : 1.5}
                          fill={hasLiked ? "currentColor" : "none"}
                          className={`transition-transform duration-150 ${hasLiked ? "scale-110" : ""}`}
                        />
                        {/* FEATURE 1: Use local optimistic count */}
                        <span className="font-medium text-sm">{exp.likes ?? 0}</span>
                      </button>

                      {/* FEATURE 2: Clickable comment count → scrolls to comments */}
                      <button
                        id={`comments-btn-${exp.id}`}
                        onClick={() => handleCommentsClick(exp.id)}
                        className="flex items-center gap-1.5 text-gray-500 hover:text-blue-600 transition-colors"
                        aria-label={`View ${commentCount} comments`}
                      >
                        <MessageSquare size={18} />
                        <span className="font-medium text-sm">
                          {commentCount} Comment{commentCount !== 1 ? "s" : ""}
                        </span>
                      </button>

                      <button
                        onClick={() => {
                          setExpandedComments((prev) => ({ ...prev, [exp.id]: true }));
                          setTimeout(() => {
                            const el = commentSectionRefs.current[exp.id];
                            if (el) {
                              el.scrollIntoView({ behavior: "smooth", block: "nearest" });
                            }
                          }, 150);
                        }}
                        className="text-sm font-medium border border-gray-300 px-3 py-1.5 rounded-md hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
                      >
                        Share your thought
                      </button>
                    </div>
                  </div>

                  {/* FEATURE 3: Compact comment preview (visible when collapsed) */}
                  {!expandedComments[exp.id] && (
                    <div className="border-t border-gray-50 bg-gray-50/60 pt-3">
                      <CommentPreview
                        postId={exp.id}
                        commentCount={commentCount}
                        onViewAll={() => handleCommentsClick(exp.id)}
                      />
                    </div>
                  )}

                  {/* Expanded post body */}
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
                            className="text-gray-700 leading-relaxed quill-content"
                            dangerouslySetInnerHTML={{
                              __html: exp.content || exp.description,
                            }}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Expanded full comment section */}
                  <AnimatePresence>
                    {expandedComments[exp.id] && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pt-2 bg-gray-50/40 rounded-b-lg border-t border-gray-100">
                          <div
                            ref={(el) => { commentSectionRefs.current[exp.id] = el; }}
                            id={`comment-section-${exp.id}`}
                            className="max-h-[28rem] overflow-y-auto pr-2 custom-scrollbar bg-white border border-gray-200 rounded-xl shadow-sm p-4 mt-2"
                          >
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
