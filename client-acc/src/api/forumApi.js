import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  withCredentials: true,
});

export const forumApi = {
  // Posts
  getPosts: () => api.get('/posts'),
  toggleLike: (id) => api.post(`/posts/toggle-like/${id}`),

  // Comments
  addComment: (data) => api.post('/posts/comments', data),
  deleteComment: (id) => api.delete(`/posts/comments/${id}`),
};
