import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  withCredentials: true,
});

export const forumApi = {
  // Posts - public (only PUBLISHED)
  getPosts: (page = 1, limit = 10) => api.get(`/posts?page=${page}&limit=${limit}`),

  // Posts - admin (ALL statuses: DRAFT + PUBLISHED)
  getAllPostsAdmin: (page = 1, limit = 10) => api.get(`/posts/all?page=${page}&limit=${limit}`),

  // Public submission - always saved as DRAFT for admin review
  submitPost: (data) => api.post('/posts/submit', data),

  deletePost: (id) => api.delete(`/posts/${id}`),

  toggleLike: (id) => api.post(`/posts/toggle-like/${id}`),

  // Comments
  addComment: (data) => api.post('/posts/comments', data),
  
  deleteComment: (id) => api.delete(`/posts/comments/${id}`),

  getComments: (postId, page = 1, limit = 10, parentId = null) =>
    api.get(`/posts/${postId}/comments`, { params: { page, limit, ...(parentId ? { parentId } : {}) } }),
};
