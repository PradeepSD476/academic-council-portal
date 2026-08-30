import React, { useState, useEffect } from "react";
import { MessageCircle, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import NativeRichTextEditor from "./NativeRichTextEditor";
import { forumApi } from "../../api/forumApi";

const CommentSection = ({ experience, currentUserId, currentUserName, onCommentAdd, onReplyAdd, onCommentDelete, onReplyDelete }) => {
  const [comments, setComments] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [replyInputs, setReplyInputs] = useState({});
  const [replyingTo, setReplyingTo] = useState(null);
  const [expandedReplies, setExpandedReplies] = useState({});
  const limit = 10;

  const fetchComments = async (pageNum) => {
    setIsLoading(true);
    try {
      const res = await forumApi.getComments(experience.id, pageNum, limit);
      if (res.data.success) {
        const data = res.data.data;
        // Map API fields to component fields
        const mapped = data.map((c) => ({
          ...c,
          text: c.content,
          userName: c.user?.displayName || "Unknown",
          ownerId: c.userId,
          date: c.createdAt,
          repliesCount: c._count?.replies ?? 0,
          replies: [],
        }));
        setComments(mapped);
        setHasMore(data.length === limit);
      }
    } catch (err) {
      console.error("Failed to fetch comments:", err);
      toast.error("Could not load comments.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComments(1);
    setPage(1);
  }, [experience.id, experience._count?.comments]);

  const fetchReplies = async (commentId) => {
    try {
      const res = await forumApi.getComments(experience.id, 1, 100, commentId);
      if (res.data.success) {
        const replies = res.data.data.map((r) => ({
          ...r,
          text: r.content,
          userName: r.user?.displayName || "Unknown",
          ownerId: r.userId,
          date: r.createdAt,
        }));
        setComments((prev) =>
          prev.map((c) =>
            c.id === commentId ? { ...c, replies, repliesCount: replies.length } : c
          )
        );
      }
    } catch (err) {
      console.error("Failed to fetch replies:", err);
    }
  };

  const toggleRepliesExpansion = (commentId) => {
    if (!expandedReplies[commentId]) {
      fetchReplies(commentId);
    }
    setExpandedReplies((prev) => ({ ...prev, [commentId]: !prev[commentId] }));
  };

  const handleCommentSubmit = async () => {
    if (!commentInput?.trim() || commentInput === "<br>") return;
    await onCommentAdd(experience.id, commentInput.trim());
    setCommentInput("");
    fetchComments(1);
    setPage(1);
  };

  const handleReplySubmit = async (commentId) => {
    const text = replyInputs[commentId];
    if (!text?.trim() || text === "<br>") return;
    await onReplyAdd(experience.id, commentId, text.trim());
    setReplyInputs((prev) => ({ ...prev, [commentId]: "" }));
    setReplyingTo(null);
    setExpandedReplies((prev) => ({ ...prev, [commentId]: true }));
    fetchReplies(commentId);
  };

  const handleNextPage = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchComments(nextPage);
  };

  const handlePrevPage = () => {
    if (page > 1) {
      const prevPage = page - 1;
      setPage(prevPage);
      fetchComments(prevPage);
    }
  };

  return (
    <div className="bg-sky-50/50 rounded-2xl p-4 border border-slate-200/80" data-lenis-prevent>
      {/* Comments List */}
      <div className="space-y-4 mb-4">
        {comments.map((comment) => (
          <div key={comment.id} className="text-sm bg-white/90 p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2">
            <div className="flex justify-between items-start">
              <span className="font-bold text-[var(--color-primary)] text-xs md:text-sm">{comment.userName}</span>
              <span className="text-[11px] text-slate-500">
                {comment.date && new Date(comment.date).toLocaleDateString()}
              </span>
            </div>

            <div className="text-slate-600 leading-relaxed quill-content text-xs md:text-sm" dangerouslySetInnerHTML={{ __html: comment.text }} />

            <div className="flex items-center gap-4 mt-2 pt-2 border-t border-slate-200/60">
              <button
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                className="text-xs font-semibold text-slate-500 hover:text-[var(--color-secondary)] flex items-center gap-1 transition-colors cursor-pointer"
              >
                <MessageCircle size={13} /> {replyingTo === comment.id ? "Cancel" : "Reply"}
              </button>
              {comment.ownerId === currentUserId && (
                <button
                  onClick={async () => {
                    await onCommentDelete(experience.id, comment.id);
                    fetchComments(page);
                  }}
                  className="text-xs font-semibold text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Trash2 size={13} /> Delete
                </button>
              )}
            </div>

            {/* Nested Replies */}
            {comment.repliesCount > 0 && (
              <div className="mt-3 space-y-3 pl-3 md:pl-4 border-l-2 border-slate-200 pb-1">
                {expandedReplies[comment.id] && comment.replies && comment.replies.map((reply) => (
                  <div key={reply.id} className="bg-white/95 backdrop-blur-xl shadow-xs p-3 rounded-xl border border-slate-200">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-[var(--color-primary)] text-xs">{reply.userName}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500">
                          {reply.date && new Date(reply.date).toLocaleDateString()}
                        </span>
                        {reply.ownerId === currentUserId && (
                          <button
                            onClick={async () => {
                              await onReplyDelete(experience.id, comment.id, reply.id);
                              fetchReplies(comment.id);
                            }}
                            className="text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                            title="Delete reply"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="text-slate-600 text-xs quill-content leading-relaxed" dangerouslySetInnerHTML={{ __html: reply.text }} />
                  </div>
                ))}

                <button
                  onClick={() => toggleRepliesExpansion(comment.id)}
                  className="text-xs font-bold text-[var(--color-secondary)] hover:underline transition-colors mt-2 block cursor-pointer"
                >
                  {expandedReplies[comment.id] ? "Hide replies" : `View ${comment.repliesCount} repl${comment.repliesCount === 1 ? "y" : "ies"}`}
                </button>
              </div>
            )}

            {/* Inline Reply Editor */}
            {replyingTo === comment.id && (
              <div className="mt-3">
                <NativeRichTextEditor
                  value={replyInputs[comment.id] || ""}
                  onChange={(val) => setReplyInputs({ ...replyInputs, [comment.id]: val })}
                  minHeight="100px"
                  placeholder="Write a reply..."
                  autoFocus
                />
                <div className="flex justify-end gap-2 mt-[-10px]">
                  <button
                    onClick={() => handleReplySubmit(comment.id)}
                    className="bg-[var(--color-secondary)] hover:opacity-90 text-white font-bold text-xs px-4 py-1.5 rounded-lg transition-colors cursor-pointer shadow-sm"
                  >
                    Submit Reply
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {comments.length === 0 && !isLoading && (
          <p className="text-xs text-slate-500 text-center py-4">No comments yet. Be the first to start the discussion!</p>
        )}

        {isLoading && (
          <p className="text-xs text-slate-500 text-center py-4">Loading comments...</p>
        )}

        {/* Pagination Controls */}
        {(page > 1 || hasMore) && (
          <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-200">
            <button
              onClick={handlePrevPage}
              disabled={page === 1 || isLoading}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 bg-sky-50 text-slate-600 hover:text-[var(--color-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="text-xs text-slate-500 font-medium">Page {page}</span>
            <button
              onClick={handleNextPage}
              disabled={!hasMore || isLoading}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 bg-sky-50 text-slate-600 hover:text-[var(--color-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Leave a Comment Editor */}
      <div className="pt-3 border-t border-slate-200">
        <label className="block text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wider">Leave a comment</label>
        <NativeRichTextEditor
          value={commentInput}
          onChange={setCommentInput}
          minHeight="100px"
          placeholder="Share your thoughts on this..."
        />
        <div className="flex justify-end mt-[-10px]">
          <button
            onClick={handleCommentSubmit}
            disabled={isLoading}
            className="px-5 py-2 bg-[var(--color-secondary)] hover:opacity-90 text-white rounded-xl transition-all text-xs font-bold shadow-xs disabled:opacity-50 cursor-pointer"
          >
            Post Comment
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommentSection;
