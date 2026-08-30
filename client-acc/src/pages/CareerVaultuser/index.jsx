import React, { useState, useContext, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown, ChevronUp, MessageSquare, ArrowBigUp,
  PenSquare, X, Trash2, ChevronLeft, ChevronRight, MessageCircle, Search, Bookmark, BookmarkCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import AuthContext from "../../context/auth/authContext";
import CommentSection from "./CommentSection";
import NativeRichTextEditor from "./NativeRichTextEditor";
import { forumApi } from "../../api/forumApi";

void motion;

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
  { value: "Other", label: "Other" },
];

// ─── Create Post Modal ────────────────────────────────────────────────────────
const CreatePostModal = ({ onClose, onSubmitted }) => {
  const [title, setTitle] = useState("");
  const [experienceType, setExperienceType] = useState("");
  const [domain, setDomain] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Lock background body scroll when modal is active
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

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
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 overflow-clip"
        data-lenis-prevent
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.form
          onSubmit={handleSubmit}
          className="bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-2xl h-[88vh] max-h-[800px] flex flex-col overflow-clip text-[var(--color-primary)] my-auto"
          initial={{ opacity: 0, scale: 0.94, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 24 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Pinned Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 bg-white/90 backdrop-blur-md shrink-0">
            <div className="flex items-center gap-2">
              <PenSquare size={18} className="text-[var(--color-secondary)] sm:w-5 sm:h-5" />
              <h2 className="text-base sm:text-lg font-bold text-[var(--color-primary)]">Share Your Experience</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-sky-50 text-slate-500 hover:text-[var(--color-primary)] transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X size={18} className="sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Scrollable Content Body and Pinned Sticky Footer */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin">
              <div className="bg-[var(--color-secondary)]/10 border border-[var(--color-secondary)]/20 rounded-xl px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs text-[var(--color-secondary)]">
                📋 Your post will be reviewed by an admin before it goes public. You will see it appear on the Career Vault once approved.
              </div>

              {/* Section 1: Basic Information */}
              <div className="p-3.5 sm:p-4 rounded-2xl border border-slate-200 bg-white/90 flex flex-col gap-3.5 sm:gap-4">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">1. Basic Information</h3>
                
                {/* Title */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="post-title" className="text-xs font-semibold text-slate-600">
                    Title <span className="text-[var(--color-secondary)]">*</span>
                  </label>
                  <input
                    id="post-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. My internship experience at Google"
                    maxLength={150}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-[var(--color-primary)] placeholder-slate-400 focus:outline-none focus:border-[var(--color-secondary)] transition bg-sky-50/50"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {/* Experience Type */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="post-type" className="text-xs font-semibold text-slate-600">
                      Experience Type <span className="text-[var(--color-secondary)]">*</span>
                    </label>
                    <select
                      id="post-type"
                      value={experienceType}
                      onChange={(e) => setExperienceType(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-[var(--color-primary)] focus:outline-none focus:border-[var(--color-secondary)] bg-sky-50/50 transition"
                    >
                      <option value="" className="bg-sky-100 text-slate-500">Select type…</option>
                      {EXPERIENCE_TYPES.map((t) => (
                        <option key={t.value} value={t.value} className="bg-sky-100 text-[var(--color-primary)]">{t.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Domain */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="post-domain" className="text-xs font-semibold text-slate-600">
                      Domain <span className="text-[var(--color-secondary)]">*</span>
                    </label>
                    <select
                      id="post-domain"
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-[var(--color-primary)] focus:outline-none focus:border-[var(--color-secondary)] bg-sky-50/50 transition"
                    >
                      <option value="" disabled className="bg-sky-100 text-slate-500">Select domain...</option>
                      {DOMAINS.map((d) => (
                        <option key={d.value} value={d.value} className="bg-sky-100 text-[var(--color-primary)]">{d.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Story Content */}
              <div className="p-3.5 sm:p-4 rounded-2xl border border-slate-200 bg-white/90 flex flex-col gap-3.5 sm:gap-4">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">2. Story Content</h3>
                
                {/* Rich Text Editor */}
                <div className="flex flex-col gap-1.5">
                  <NativeRichTextEditor
                    value={description}
                    onChange={setDescription}
                    minHeight="160px"
                    placeholder="Describe your experience in detail — preparation tips, interview process, key learnings…"
                  />
                </div>
              </div>
            </div>

            {/* Pinned Sticky Footer */}
            <div className="flex items-center justify-end gap-3 px-4 sm:px-6 py-3 border-t border-slate-200 bg-white/95 backdrop-blur-md shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-sky-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 text-xs font-bold bg-[var(--color-secondary)] hover:opacity-90 text-white rounded-xl shadow-xs transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
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
          </motion.form>
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
          <div className="h-2 bg-slate-200 rounded w-24" />
          <div className="h-2 bg-slate-200 rounded w-40" />
        </div>
      </div>
    );
  }

  if (previews.length === 0) {
    return (
      <div className="px-5 pb-4">
        <p className="text-xs text-slate-500 italic">No comments yet. Be the first!</p>
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
          <div className="shrink-0 w-6 h-6 rounded-full bg-[var(--color-secondary)]/10 border border-[var(--color-secondary)]/20 flex items-center justify-center text-[10px] font-bold text-[var(--color-secondary)] uppercase">
            {c.userName?.[0] || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-semibold text-slate-600 mr-1.5">{c.userName}</span>
            <span className="text-xs text-slate-500 truncate block leading-snug">
              {stripHtml(c.text).slice(0, 120)}{stripHtml(c.text).length > 120 ? "…" : ""}
            </span>
          </div>
        </div>
      ))}

      {commentCount > 2 && (
        <button
          onClick={onViewAll}
          className="text-xs font-bold text-[var(--color-secondary)] hover:underline transition-colors mt-1 flex items-center gap-1 cursor-pointer"
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
  const [allExperiences, setAllExperiences] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [expandedComments, setExpandedComments] = useState({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [domainFilter, setDomainFilter] = useState("All");
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const pageSize = 10;

  // FEATURE 1: spam prevention ref for in-flight like requests
  const likePendingRef = useRef({});
  const bookmarkPendingRef = useRef({});

  // FEATURE 2: refs for comment sections (keyed by post id) for smooth scroll
  const commentSectionRefs = useRef({});

  const currentUserId = user?.id;
  const currentUserName = user?.displayName || "Student";

  const normalizePost = useCallback((p) => ({
    ...p,
    authorName: p.uploadedBy?.displayName || p.authorName || "Unknown",
    likes: p._count?.likes ?? 0,
    likedBy: p.likes?.map((l) => l.userId) || [],
    isBookmarked: (p.bookmarks?.length || 0) > 0,
  }), []);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await forumApi.getPosts(1, 1000, 'PUBLISHED');
      if (response.data.success) {
        const mapped = response.data.data.map(normalizePost);
        setAllExperiences(mapped);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast.error("Could not load experiences. Please try again later.");

      setAllExperiences([]);
    } finally {
      setIsLoading(false);
    }
  }, [normalizePost]);

  useEffect(() => {
    fetchPosts();
    setPage(1);
  }, [fetchPosts]);

  const filteredExperiences = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const domainFiltered = allExperiences.filter((exp) => {
      if (showBookmarkedOnly && !exp.isBookmarked) {
        return false;
      }

      if (domainFilter === "All") return true;

      return (exp.domain || "").toLowerCase() === domainFilter.toLowerCase();
    });

    if (!q) return domainFiltered;

    return domainFiltered.filter((exp) => {
      const titleMatch = (exp.title || "").toLowerCase().includes(q);
      const authorMatch = (exp.authorName || "").toLowerCase().includes(q);
      return titleMatch || authorMatch;
    });
  }, [allExperiences, searchTerm, domainFilter, showBookmarkedOnly]);

  const paginatedExperiences = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredExperiences.slice(start, start + pageSize);
  }, [filteredExperiences, page, pageSize]);

  useEffect(() => {
    const nextTotalPages = Math.max(1, Math.ceil(filteredExperiences.length / pageSize));
    setTotalPages(nextTotalPages);
    if (page > nextTotalPages) {
      setPage(1);
    }
  }, [filteredExperiences, page, pageSize]);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // FEATURE 1: Optimistic upvote with spam prevention + rollback
  const toggleLike = async (id) => {
    if (likePendingRef.current[id]) return;
    likePendingRef.current[id] = true;

    let previousExperiences;

    // Optimistically update UI immediately
    setAllExperiences((prev) => {
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
        setAllExperiences((prev) =>
          prev.map((exp) =>
            exp.id === id ? { ...exp, likes: res.data.likesCount } : exp
          )
        );
      }
    } catch (err) {
      console.error("Like failed:", err);
      // Rollback to previous state on failure
      setAllExperiences(previousExperiences);
      toast.error("Failed to update vote. Please try again.");
    } finally {
      likePendingRef.current[id] = false;
    }
  };

  const toggleBookmark = async (id) => {
    if (bookmarkPendingRef.current[id]) return;
    bookmarkPendingRef.current[id] = true;

    let previousExperiences;

    setAllExperiences((prev) => {
      previousExperiences = prev;
      return prev.map((exp) => (
        exp.id === id ? { ...exp, isBookmarked: !exp.isBookmarked } : exp
      ));
    });

    try {
      const res = await forumApi.toggleBookmark(id);
      if (res.data.success) {
        setAllExperiences((prev) => prev.map((exp) => (
          exp.id === id ? { ...exp, isBookmarked: res.data.bookmarked } : exp
        )));
      }
    } catch (error) {
      console.error("Bookmark failed:", error);
      setAllExperiences(previousExperiences);
      toast.error("Failed to update bookmark. Please try again.");
    } finally {
      bookmarkPendingRef.current[id] = false;
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
    } catch {
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
    <div className="space-y-6">
      {showCreateModal && (
        <CreatePostModal
          onClose={() => setShowCreateModal(false)}
          onSubmitted={fetchPosts}
        />
      )}

      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-[3px] h-6 bg-[var(--color-secondary)] rounded-full shadow-[0_0_8px_var(--color-secondary)]" />
          <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--color-primary)] tracking-tight">
            Career Vault
          </h1>
        </div>
        <p className="text-slate-500 text-sm ml-4">
          Learn from interview and internship experiences shared by seniors and alumni.
        </p>
      </div>

      {/* Search & Filter Controls */}
      <div className="space-y-3">
        <div className="relative w-full">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder="Search experiences by company, title, or author..."
            className="w-full rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-xl shadow-xs py-3.5 pl-11 pr-4 text-sm text-[var(--color-primary)] placeholder-slate-400 shadow-sm outline-none transition focus:border-[var(--color-secondary)] focus:ring-1 focus:ring-[var(--color-secondary)]"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <select
            value={domainFilter}
            onChange={(e) => {
              setDomainFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2.5 bg-white/95 backdrop-blur-xl shadow-xs border border-slate-200 rounded-xl text-xs font-semibold text-[var(--color-primary)] shadow-sm focus:outline-none focus:border-[var(--color-secondary)] transition cursor-pointer"
          >
            <option value="All" className="bg-sky-100 text-[var(--color-primary)]">All Domains</option>
            {DOMAINS.map((d) => (
              <option key={d.value} value={d.value} className="bg-sky-100 text-[var(--color-primary)]">{d.label}</option>
            ))}
          </select>

          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setShowBookmarkedOnly(!showBookmarkedOnly);
                setPage(1);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                showBookmarkedOnly
                  ? "bg-[var(--color-secondary)] border-[var(--color-secondary)] text-white shadow-[0_8px_20px_var(--color-secondary-glow)]"
                  : "bg-sky-50 border-sky-100 text-slate-600 hover:text-[var(--color-primary)] hover:bg-sky-100"
              }`}
            >
              {showBookmarkedOnly ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
              <span>Bookmarked</span>
            </motion.button>

            <motion.button
              id="create-post-btn"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-[var(--color-secondary)] hover:opacity-90 text-white text-xs font-bold rounded-xl shadow-[0_8px_20px_var(--color-secondary-glow)] transition-all cursor-pointer"
            >
              <PenSquare size={15} />
              <span>Share Experience</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Experience Feed */}
      <div className="space-y-4">
        <AnimatePresence>
          {paginatedExperiences?.map((exp) => {
            const isExpanded = expandedId === exp.id;
            const hasLiked = exp.likedBy?.includes(currentUserId);
            const commentCount = exp._count?.comments ?? 0;

            return (
              <motion.div
                key={exp.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white/95 backdrop-blur-xl shadow-xs rounded-2xl shadow-md border border-slate-200/90 overflow-hidden hover:border-[var(--color-secondary)]/40 transition-all duration-300"
              >
                <div className="p-5">
                  {/* Post Header */}
                  <div
                    className="flex justify-between items-start cursor-pointer group"
                    onClick={() => toggleExpand(exp.id)}
                  >
                    <div>
                      <h2 className="text-base md:text-lg font-bold text-[var(--color-primary)] group-hover:text-[var(--color-secondary)] transition-colors leading-snug">
                        {exp.title}
                      </h2>
                      <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2 mt-1.5 mb-3">
                        <span className="font-semibold text-slate-600">
                          {exp.authorName}
                        </span>
                        <span>•</span>
                        <span>
                          {new Date(exp.date || exp.createdAt).toLocaleDateString()}
                        </span>
                        <span>•</span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--color-secondary)]/10 text-[var(--color-secondary)] border border-[var(--color-secondary)]/20 uppercase">
                          {exp.domain || 'Uncategorized'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleBookmark(exp.id);
                        }}
                        disabled={!!bookmarkPendingRef.current[exp.id]}
                        className={`p-2 rounded-xl transition-all cursor-pointer ${
                          exp.isBookmarked
                            ? "text-[var(--color-secondary)] bg-[var(--color-secondary)]/10 border border-[var(--color-secondary)]/20"
                            : "text-slate-500 hover:text-[var(--color-primary)] bg-white/5 border border-white/10 hover:bg-white/10"
                        }`}
                        title={exp.isBookmarked ? "Remove bookmark" : "Bookmark post"}
                        aria-label={exp.isBookmarked ? "Remove bookmark" : "Bookmark post"}
                      >
                        {exp.isBookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                      </button>

                      {exp.uploadedById === currentUserId && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePost(exp.id);
                          }}
                          className="p-2 text-slate-500 hover:text-red-400 bg-white/5 border border-white/10 hover:bg-red-950/30 rounded-xl transition-colors cursor-pointer"
                          title="Delete Post"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}

                      <div className="text-slate-500 ml-1 flex flex-col items-center gap-0.5 group-hover:text-[var(--color-secondary)] transition-colors">
                        {isExpanded ? (
                          <ChevronUp size={20} />
                        ) : (
                          <ChevronDown size={20} />
                        )}
                        <span className="text-[9px] font-bold uppercase tracking-wider">
                          {isExpanded ? "Close" : "Read"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Row */}
                  <div className="flex flex-wrap items-center gap-4 text-slate-500 pt-3 border-t border-slate-200/60 text-xs">
                    {/* Upvote Button */}
                    <button
                      id={`upvote-btn-${exp.id}`}
                      onClick={() => toggleLike(exp.id)}
                      disabled={!!likePendingRef.current[exp.id]}
                      aria-pressed={hasLiked}
                      aria-label={hasLiked ? "Remove upvote" : "Upvote"}
                      className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 transition-all select-none cursor-pointer ${
                        hasLiked
                          ? "bg-[var(--color-secondary)]/20 text-[var(--color-secondary)] border border-[var(--color-secondary)]/30 font-bold"
                          : "bg-white/5 border border-white/10 text-slate-600 hover:text-[var(--color-primary)] hover:bg-white/10"
                      }`}
                    >
                      <ArrowBigUp
                        size={16}
                        strokeWidth={hasLiked ? 0 : 1.5}
                        fill={hasLiked ? "currentColor" : "none"}
                      />
                      <span>{exp.likes ?? 0}</span>
                    </button>

                    {/* Comments count */}
                    <button
                      id={`comments-btn-${exp.id}`}
                      onClick={() => handleCommentsClick(exp.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-600 hover:text-[var(--color-primary)] hover:bg-white/10 transition-colors cursor-pointer"
                      aria-label={`View ${commentCount} comments`}
                    >
                      <MessageSquare size={14} />
                      <span>
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
                      className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-600 hover:text-[var(--color-secondary)] hover:border-[var(--color-secondary)]/30 transition-colors cursor-pointer"
                    >
                      Share thoughts
                    </button>
                  </div>
                </div>

                {/* Compact Comment Preview */}
                {!expandedComments[exp.id] && (
                  <div className="border-t border-slate-200/80 bg-slate-50/50 pt-3 rounded-b-2xl">
                    <CommentPreview
                      postId={exp.id}
                      commentCount={commentCount}
                      onViewAll={() => handleCommentsClick(exp.id)}
                    />
                  </div>
                )}

                {/* Expanded Post Body */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <div className="px-5 pb-5 border-t border-slate-200 mt-2 pt-4 bg-slate-50/50 rounded-b-2xl">
                        <div
                          className="text-slate-600 leading-relaxed quill-content text-sm"
                          dangerouslySetInnerHTML={{
                            __html: exp.content || exp.description,
                          }}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Expanded Full Comment Section */}
                <AnimatePresence>
                  {expandedComments[exp.id] && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 bg-slate-50/50 border-t border-slate-200 rounded-b-2xl">
                        <div
                          ref={(el) => { commentSectionRefs.current[exp.id] = el; }}
                          id={`comment-section-${exp.id}`}
                          className="max-h-112 overflow-y-auto pr-2 custom-scrollbar"
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

        {(!filteredExperiences || filteredExperiences.length === 0) && !isLoading && (
          <div className="text-center py-16 text-slate-500 bg-white/95 backdrop-blur-xl shadow-xs border border-slate-200 rounded-2xl p-8">
            <p className="text-sm font-semibold text-slate-600">
              {searchTerm.trim() || domainFilter !== "All"
                ? "No posts match your current filters."
                : "No experiences shared yet. Be the first!"}
            </p>
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-3 border-[var(--color-secondary)] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between bg-white/95 backdrop-blur-xl shadow-xs border border-slate-200 rounded-2xl p-4 text-xs text-slate-500 mt-6">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-50 border border-sky-100 text-slate-600 hover:text-[var(--color-primary)] hover:bg-sky-100 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer font-semibold"
            >
              <ChevronLeft size={14} /> Previous
            </button>
            <span className="font-bold text-[var(--color-primary)]">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-50 border border-sky-100 text-slate-600 hover:text-[var(--color-primary)] hover:bg-sky-100 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer font-semibold"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CareerVault;
