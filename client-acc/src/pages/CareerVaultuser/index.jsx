import React, { useState, useContext, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ChevronDown, ChevronUp, MessageSquare, ArrowBigUp } from "lucide-react";
import toast from "react-hot-toast";
import AuthContext from "../../context/auth/authContext";
import CommentSection from "./CommentSection";
import { forumApi } from "../../api/forumApi";

const CareerVault = () => {
  const { user } = useContext(AuthContext);
  const [experiences, setExperiences] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  const currentUserId = user?.id;
  const currentUserName = user?.displayName || "Student";

  const fetchPosts = async () => {
    try {
      const response = await forumApi.getPosts();
      if (response.data.success) {
        // Map uploadedBy.displayName -> authorName for display
        const mapped = response.data.data.map((p) => ({
          ...p,
          authorName: p.uploadedBy?.displayName || p.authorName || "Unknown",
        }));
        setExperiences(mapped);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast.error("Could not load experiences.");
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const toggleLike = async (id) => {
    // Optimistic update
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
      fetchPosts();
    } catch (err) {
      console.error("Like failed:", err);
      fetchPosts(); // Revert on failure
    }
  };

  const handleCommentAdd = async (expId, text) => {
    try {
      await forumApi.addComment({
        content: text,
        postId: expId,
        parentId: null,
      });
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
      await forumApi.addComment({
        content: text,
        postId: expId,
        parentId: commentId,
      });
      toast.success("Reply added!");
      fetchPosts();
    } catch (error) {
      toast.error("Failed to add reply.");
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
              Career Vault
            </h1>
            <p className="text-gray-500 mt-2">
              Learn from the experiences of seniors and alumni.
            </p>
          </div>
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
                      <div className="text-gray-400 ml-4 flex flex-col items-center gap-1 group-hover:text-blue-500 transition-colors">
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

                    <div className="flex items-center gap-6 text-gray-500">
                      <button
                        onClick={() => toggleLike(exp.id)}
                        className={`flex items-center gap-1.5 transition-colors ${exp.likedBy?.includes(currentUserId)
                            ? "text-pink-600"
                            : "hover:text-pink-600"
                          }`}
                      >
                        <ArrowBigUp
                          size={18}
                        />
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

          {(!experiences || experiences.length === 0) && (
            <div className="text-center py-12 text-gray-500">
              No posts out here yet!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CareerVault;
