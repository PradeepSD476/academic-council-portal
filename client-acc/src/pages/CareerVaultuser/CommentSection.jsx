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
    <div className="bg-gray-50 rounded-lg p-4">
      {/* Comments List */}
      <div className="space-y-4 mb-4">
        {comments.map((comment) => (
          <div key={comment.id} className="text-sm bg-white p-3 rounded-lg border border-gray-100 shadow-sm flex flex-col gap-2">
            <div className="flex justify-between items-start">
              <span className="font-bold text-gray-800">{comment.userName}</span>
              <span className="text-xs text-gray-400">
                {comment.date && new Date(comment.date).toLocaleDateString()}
              </span>
            </div>

            <div className="text-gray-600 leading-relaxed quill-content" dangerouslySetInnerHTML={{ __html: comment.text }} />

            <div className="flex items-center gap-4 mt-1">
              <button
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                className="text-xs font-semibold text-gray-500 hover:text-blue-600 flex items-center gap-1 transition-colors"
              >
                <MessageCircle size={14} /> {replyingTo === comment.id ? "Cancel" : "Reply"}
              </button>
              {comment.ownerId === currentUserId && (
                <button
                  onClick={async () => {
                    await onCommentDelete(experience.id, comment.id);
                    fetchComments(page);
                  }}
                  className="text-xs font-semibold text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors"
                >
                  <Trash2 size={14} /> Delete
                </button>
              )}
            </div>

            {/* Nested Replies */}
            {comment.repliesCount > 0 && (
              <div className="mt-3 space-y-3 pl-4 border-l-2 border-gray-100 pb-1">
                {expandedReplies[comment.id] && comment.replies && comment.replies.map((reply) => (
                  <div key={reply.id} className="bg-gray-50 p-3 rounded border border-gray-100">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-gray-800 text-xs">{reply.userName}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">
                          {reply.date && new Date(reply.date).toLocaleDateString()}
                        </span>
                        {reply.ownerId === currentUserId && (
                          <button
                            onClick={async () => {
                              await onReplyDelete(experience.id, comment.id, reply.id);
                              fetchReplies(comment.id);
                            }}
                            className="text-red-500 hover:text-red-700 transition-colors"
                            title="Delete reply"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="text-gray-600 text-xs quill-content leading-relaxed" dangerouslySetInnerHTML={{ __html: reply.text }} />
                  </div>
                ))}

                <button
                  onClick={() => toggleRepliesExpansion(comment.id)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors mt-2 block"
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
                  minHeight="120px"
                  placeholder="Write a reply..."
                  autoFocus
                />
                <div className="flex justify-end gap-2 mt-[-10px]">
                  <button
                    onClick={() => handleReplySubmit(comment.id)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs px-4 py-1.5 rounded transition-colors"
                  >
                    Submit Reply
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {comments.length === 0 && !isLoading && (
          <p className="text-sm text-gray-400 text-center py-4">No comments yet. Be the first to start the discussion!</p>
        )}

        {isLoading && (
          <p className="text-sm text-gray-400 text-center py-4">Loading comments...</p>
        )}

        {/* Pagination Controls */}
        {(page > 1 || hasMore) && (
          <div className="flex justify-between items-center mt-4 pt-2 border-t border-gray-100">
            <button
              onClick={handlePrevPage}
              disabled={page === 1 || isLoading}
              className={`text-xs font-semibold px-4 py-2 rounded-full border transition-colors ${
                page === 1 || isLoading
                  ? "text-gray-400 border-gray-200 bg-gray-50 cursor-not-allowed"
                  : "text-blue-600 border-blue-200 hover:bg-blue-50"
              }`}
            >
              Previous
            </button>
            <span className="text-xs text-gray-500 font-medium">Page {page}</span>
            <button
              onClick={handleNextPage}
              disabled={!hasMore || isLoading}
              className={`text-xs font-semibold px-4 py-2 rounded-full border transition-colors ${
                !hasMore || isLoading
                  ? "text-gray-400 border-gray-200 bg-gray-50 cursor-not-allowed"
                  : "text-blue-600 border-blue-200 hover:bg-blue-50"
              }`}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Leave a Comment Editor */}
      <div className="pt-2 border-t border-gray-200">
        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Leave a comment</label>
        <NativeRichTextEditor
          value={commentInput}
          onChange={setCommentInput}
          minHeight="120px"
          placeholder="Share your thoughts on this..."
        />
        <div className="flex justify-end mt-[-10px]">
          <button
            onClick={handleCommentSubmit}
            disabled={isLoading}
            className="px-5 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-md transition-colors text-sm font-bold shadow-sm disabled:opacity-50"
          >
            Post Comment
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommentSection;
