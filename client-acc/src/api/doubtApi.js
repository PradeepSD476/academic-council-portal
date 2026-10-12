import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: `${API_URL}/v1`,
  withCredentials: true,
});

// ACC Wiki: doubt-resolution forum
export const doubtApi = {
  // Doubts
  getDoubts: (params = {}) => api.get('/doubts', { params }),
  getDoubt: (id) => api.get(`/doubts/${id}`),
  createDoubt: (data) => api.post('/doubts', data),
  updateDoubt: (id, data) => api.patch(`/doubts/${id}`, data),
  deleteDoubt: (id) => api.delete(`/doubts/${id}`),
  setStatus: (id, status) => api.patch(`/doubts/${id}/status`, { status }),
  toggleVote: (id) => api.post(`/doubts/${id}/vote`),

  // Answers
  addAnswer: (doubtId, body) => api.post(`/doubts/${doubtId}/answers`, { body }),
  updateAnswer: (id, body) => api.patch(`/doubts/answers/${id}`, { body }),
  deleteAnswer: (id) => api.delete(`/doubts/answers/${id}`),
  toggleAnswerVote: (id) => api.post(`/doubts/answers/${id}/vote`),
  toggleAccept: (id) => api.post(`/doubts/answers/${id}/accept`),

  // Reporting
  report: (data) => api.post('/doubts/report', data),

  // Moderation (SUPER_ADMIN, FACULTY)
  getStats: () => api.get('/doubts/admin/stats'),
  getReports: (params = {}) => api.get('/doubts/admin/reports', { params }),
  resolveReport: (id, data) => api.patch(`/doubts/admin/reports/${id}`, data),
  moderateDoubt: (id, data) => api.patch(`/doubts/admin/${id}`, data),
  moderateAnswer: (id, isHidden) => api.patch(`/doubts/admin/answers/${id}`, { isHidden }),
};

// Message to show when a request fails.
export const apiError = (err, fallback = 'Something went wrong. Please try again.') =>
  err?.response?.data?.message || fallback;
