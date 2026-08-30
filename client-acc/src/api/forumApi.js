import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: `${API_URL}/v1`,
  withCredentials: true,
});

export const forumApi = {
  // Posts - public (only PUBLISHED)
  getPosts: (page = 1, limit = 10, status = 'PUBLISHED', domain = '', search = '') => api.get('/posts', {
    params: {
      page,
      limit,
      status,
      ...(domain && domain !== 'All' ? { domain } : {}),
      ...(search ? { search } : {}),
    },
  }),

  deletePost: (id) => api.delete(`/posts/${id}`),

  addOrUpdateResume: (postId, resumeUrl) => api.put(`/posts/${postId}/resume`, { resumeUrl }),
  deleteResume: (postId) => api.delete(`/posts/${postId}/resume`),

  toggleLike: (id) => api.post(`/posts/toggle-like/${id}`),
  toggleBookmark: (id) => api.post(`/posts/toggle-bookmark/${id}`),

  // Comments
  addComment: (data) => api.post('/posts/comments', data),

  submitPost: (data) => api.post('/posts', data),
  
  deleteComment: (id) => api.delete(`/posts/comments/${id}`),

  getComments: (postId, page = 1, limit = 10, parentId = null) =>
    api.get(`/posts/${postId}/comments`, { params: { page, limit, ...(parentId ? { parentId } : {}) } }),
};
