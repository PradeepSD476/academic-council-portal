import React, { useState, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ChevronDown, ChevronUp } from "lucide-react";
import toast from "react-hot-toast";
import AuthContext from "../../context/auth/authContext";
import CommentSection from "./CommentSection";

const initialData = [
  {
    id: 101,
    title: "Google SDE Interview Experience",
    content:
      "<p>I recently went through a multi-round technical interview process for a software engineering role.</p><p><strong>Round 1 (DSA - Arrays & Strings):</strong></p><p>The interviewer asked me a sliding window problem based on finding the longest substring with certain constraints. I first explained the brute force approach and then optimized it using the sliding window technique. I was able to achieve an O(n) solution and discussed edge cases as well.</p><p><strong>Round 2 (Dynamic Programming & Graphs):</strong></p><p>This round was more challenging. I was given a classic dynamic programming problem related to coin change, followed by a graph traversal problem involving BFS and cycle detection. I explained my approach step-by-step and wrote clean, modular code.</p><p><strong>Round 3 (System Design - Basic):</strong></p><p>I was asked to design a simple URL shortener system. I discussed components like hashing, database schema, and scalability considerations. The interviewer was interested in how I would handle collisions and optimize read performance.</p><p><strong>HR Round:</strong></p><p>The HR round focused on my past projects, teamwork experience, and how I handle deadlines. I also discussed my participation in hackathons and real-world problem-solving approach.</p><p><em>Overall, the experience was smooth and interviewers were friendly. The process helped me understand my strengths and areas to improve.</em></p><br/><p><strong>Candidate:</strong> Devansh Sharma</p>",
    authorName: "Pradeep",
    date: "2026-04-16T10:00:00Z",
    likes: 23,
    likedBy: ["guest_123"],
    comments: [
      {
        id: 501,
        userName: "Rahul",
        text: "<p>How was the DP question?</p>",
        date: "2026-04-16T11:00:00Z",
        replies: [
          {
            id: 502,
            userName: "Pradeep",
            text: "<p>Knapsack variation. Quite standard actually.</p>",
            date: "2026-04-16T11:05:00Z",
          },
        ],
      },
    ],
    commentsCount: 12,
  },
  {
    id: 102,
    title: "Amazon OA Experience",
    content:
      "<p>OA had 2 coding questions. One was related to BFS and the other was a string manipulation problem.</p>",
    authorName: "Rahul",
    date: "2026-04-15T09:00:00Z",
    likes: 15,
    likedBy: [],
    comments: [],
    commentsCount: 5,
  },
];

const CareerVault = () => {
  const { user } = useContext(AuthContext);
  const [experiences, setExperiences] = useState(initialData);
  const [expandedId, setExpandedId] = useState(null);

  const currentUserId = user?.id || "guest_123";
  const currentUserName = user?.displayName || "Student";

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const toggleLike = (id) => {
    setExperiences((prev) =>
      prev.map((exp) => {
        if (exp.id === id) {
          const hasLiked = exp.likedBy.includes(currentUserId);
          return {
            ...exp,
            likes: hasLiked ? exp.likes - 1 : exp.likes + 1,
            likedBy: hasLiked
              ? exp.likedBy.filter((uid) => uid !== currentUserId)
              : [...exp.likedBy, currentUserId],
          };
        }
        return exp;
      })
    );
  };



  const handleCommentAdd = (expId, text) => {
    setExperiences((prev) =>
      prev.map((exp) => {
        if (exp.id === expId) {
          return {
            ...exp,
            commentsCount: exp.commentsCount + 1,
            comments: [
              { id: Date.now(), userName: currentUserName, text, replies: [], date: new Date().toISOString() },
             ...exp.comments,
            ],
          };
        }
        return exp;
      })
    );
    toast.success("Comment added!");
  };

  const handleCommentDelete = (expId, commentId) => {
    setExperiences((prev) =>
      prev.map((exp) => {
        if (exp.id === expId) {
          return {
            ...exp,
            commentsCount: Math.max(0, exp.commentsCount - 1),
            comments: exp.comments.filter((c) => c.id !== commentId),
          };
        }
        return exp;
      })
    );
    toast.success("Comment deleted!");
  };

  const handleReplyDelete = (expId, commentId, replyId) => {
    setExperiences((prev) =>
      prev.map((exp) => {
        if (exp.id === expId) {
          return {
            ...exp,
            commentsCount: Math.max(0, exp.commentsCount - 1),
            comments: exp.comments.map((c) => {
              if (c.id === commentId) {
                return {
                  ...c,
                  replies: (c.replies || []).filter((r) => r.id !== replyId),
                };
              }
              return c;
            }),
          };
        }
        return exp;
      })
    );
    toast.success("Reply deleted!");
  };

  const handleReplyAdd = (expId, commentId, text) => {
    setExperiences((prev) =>
      prev.map((exp) => {
        if (exp.id === expId) {
          return {
            ...exp,
            commentsCount: exp.commentsCount + 1,
            comments: exp.comments.map((comment) => {
              if (comment.id === commentId) {
                return {
                  ...comment,
                  replies: [
                    ...(comment.replies || []),
                    { id: Date.now(), userName: currentUserName, text, date: new Date().toISOString() }
                  ]
                };
              }
              return comment;
            })
          };
        }
        return exp;
      })
    );
    toast.success("Reply added!");
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
            {experiences.map((exp) => {
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
                    <div className="flex justify-between items-start cursor-pointer group" onClick={() => toggleExpand(exp.id)}>
                      <div>
                        <h2 className="text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{exp.title}</h2>
                        <div className="text-sm text-gray-500 flex items-center gap-2 mt-1 mb-4">
                          <span className="font-medium text-blue-600">{exp.authorName}</span>
                          <span>•</span>
                          <span>{new Date(exp.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="text-gray-400 ml-4 flex flex-col items-center gap-1 group-hover:text-blue-500 transition-colors">
                        {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                        <span className="text-[10px] font-bold uppercase tracking-wider">{isExpanded ? "Close" : "Read More"}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6 text-gray-500">
                        <button
                          onClick={() => toggleLike(exp.id)}
                          className={`flex items-center gap-1.5 transition-colors ${
                            exp.likedBy.includes(currentUserId)
                              ? "text-pink-600"
                              : "hover:text-pink-600"
                          }`}
                        >
                          <Heart size={18} fill={exp.likedBy.includes(currentUserId) ? "currentColor" : "none"} strokeWidth={exp.likedBy.includes(currentUserId) ? 0 : 2} />
                          <span className="font-medium text-sm">{exp.likes} Likes</span>
                        </button>
                        

                        
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
                            dangerouslySetInnerHTML={{ __html: exp.content }}
                          />

                          {/* Extracted Comment Section */}
                          <CommentSection 
                             experience={exp} 
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

          {experiences.length === 0 && (
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
