import React, { useState } from "react";
import { MessageCircle, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import NativeRichTextEditor from "./NativeRichTextEditor";

const CommentSection = ({ experience, currentUserName, onCommentAdd, onReplyAdd, onCommentDelete, onReplyDelete }) => {
  const [commentInput, setCommentInput] = useState("");
  const [replyInputs, setReplyInputs] = useState({});
  const [replyingTo, setReplyingTo] = useState(null);
  const [isLoadingMoreComments, setIsLoadingMoreComments] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState({});

  const toggleRepliesExpansion = (commentId) => {
    setExpandedReplies((prev) => ({ ...prev, [commentId]: !prev[commentId] }));
  };

  const handleCommentSubmit = () => {
    if (!commentInput?.trim() || commentInput === "<br>") return;
    onCommentAdd(experience.id, commentInput.trim());
    setCommentInput("");
  };

  const handleReplySubmit = (commentId) => {
    const text = replyInputs[commentId];
    if (!text?.trim() || text === "<br>") return;
    onReplyAdd(experience.id, commentId, text.trim());
    setReplyInputs((prev) => ({ ...prev, [commentId]: "" }));
    setReplyingTo(null);
  };

  const loadMoreComments = () => {
    setIsLoadingMoreComments(true);
    setTimeout(() => {
      setIsLoadingMoreComments(false);
      toast.success("Loaded older comments!");
    }, 800);
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      {/* Existing Comments List */}
      <div className="space-y-4 mb-4">
        {experience.comments.map((comment) => (
          <div key={comment.id} className="text-sm bg-white p-3 rounded-lg border border-gray-100 shadow-sm flex flex-col gap-2">
            <div className="flex justify-between items-start">
              <span className="font-bold text-gray-800">{comment.userName}</span>
              <span className="text-xs text-gray-400">
                {comment.date && new Date(comment.date).toLocaleDateString()}
              </span>
            </div>
            
            <div className="text-gray-600 leading-relaxed quill-content" dangerouslySetInnerHTML={{ __html: comment.text }}></div>
            
            <div className="flex items-center gap-4 mt-1">
              <button onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)} className="text-xs font-semibold text-gray-500 hover:text-blue-600 flex items-center gap-1 transition-colors">
                <MessageCircle size={14} /> {replyingTo === comment.id ? "Cancel" : "Reply"}
              </button>
              {comment.userName === currentUserName && (
                <button onClick={() => onCommentDelete(experience.id, comment.id)} className="text-xs font-semibold text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors">
                  <Trash2 size={14} /> Delete
                </button>
              )}
            </div>

            {/* Nested Replies */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-3 space-y-3 pl-4 border-l-2 border-gray-100 pb-1">
                {(expandedReplies[comment.id] ? comment.replies : comment.replies.slice(0, 2)).map((reply) => (
                  <div key={reply.id} className="bg-gray-50 p-3 rounded border border-gray-100">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-gray-800 text-xs">{reply.userName}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">
                          {reply.date && new Date(reply.date).toLocaleDateString()}
                        </span>
                        {reply.userName === currentUserName && (
                          <button onClick={() => onReplyDelete(experience.id, comment.id, reply.id)} className="text-red-500 hover:text-red-700 transition-colors" title="Delete reply">
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="text-gray-600 text-xs quill-content leading-relaxed" dangerouslySetInnerHTML={{ __html: reply.text }}></div>
                  </div>
                ))}

                {/* Show More/Fewer Replies Button */}
                {comment.replies.length > 2 && (
                  <button 
                    onClick={() => toggleRepliesExpansion(comment.id)} 
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors mt-2 block"
                  >
                    {expandedReplies[comment.id] ? "Show fewer replies" : `Show ${comment.replies.length - 2} more replies`}
                  </button>
                )}
              </div>
            )}

            {/* Inline Reply Editor */}
            {replyingTo === comment.id && (
              <div className="mt-3">
                <NativeRichTextEditor
                  value={replyInputs[comment.id]}
                  onChange={(val) => setReplyInputs({ ...replyInputs, [comment.id]: val })}
                  minHeight="120px"
                  placeholder="Write a reply..."
                  autoFocus
                />
                <div className="flex justify-end gap-2 mt-[-10px]">
                  <button onClick={() => handleReplySubmit(comment.id)} className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs px-4 py-1.5 rounded transition-colors">
                    Submit Reply
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        
        {experience.comments.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">No comments yet. Be the first to start the discussion!</p>
        )}
        
        {/* Pagination Stub */}
        {experience.commentsCount > experience.comments.length && (
           <div className="flex justify-center mt-2">
             <button onClick={loadMoreComments} disabled={isLoadingMoreComments} className="text-xs font-semibold text-blue-600 hover:text-blue-800 py-2 border border-blue-100 hover:bg-blue-50 px-4 rounded-full transition-colors flex items-center gap-2">
               {isLoadingMoreComments ? "Loading..." : "Load More Comments"}
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
            className="px-5 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-md transition-colors text-sm font-bold shadow-sm"
          >
            Post Comment
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommentSection;
