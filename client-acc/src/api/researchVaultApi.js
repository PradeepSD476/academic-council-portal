import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const api = axios.create({ baseURL: `${API_URL}/v1/vault`, withCredentials: true });

export const researchVaultApi = {
  // ── Research Areas ────────────────────────────────────────────────────────
  getAreas: () => api.get('/areas'),
  createArea: (data) => api.post('/areas', data),

  // ── Faculty ───────────────────────────────────────────────────────────────
  getFaculty: (params) => api.get('/faculty', { params }),
  createFaculty: (data) => api.post('/faculty', data),
  deleteFaculty: (id) => api.delete(`/faculty/${id}`),

  // ── Experiences ───────────────────────────────────────────────────────────
  getExperiences: (params) => api.get('/experiences', { params }),
  submitExperience: (data) => api.post('/experiences', data),
  updateExperience: (id, data) => api.put(`/experiences/${id}`, data),
  deleteExperience: (id) => api.delete(`/experiences/${id}`),
  getModerationQueue: () => api.get('/admin/experiences'),

  // ── Discussions ───────────────────────────────────────────────────────────
  getDiscussions: (params) => api.get('/discussions', { params }),
  getQuestions: (params) => api.get('/questions', { params }),
  getQuestion: (id, params) => api.get(`/questions/${id}`, { params }),
  getQuestionReplies: (id, params) => api.get(`/questions/${id}/replies`, { params }),
  submitDiscussion: (data) => api.post('/discussions', data),
  replyToDiscussion: (id, data) => api.post(`/discussions/${id}/replies`, data),
  voteReply: (discussionId, replyId, value = 1) =>
    api.post(`/discussions/${discussionId}/replies/${replyId}/vote`, { value }),
  acceptDiscussionReply: (discussionId, replyId) =>
    api.post(`/discussions/${discussionId}/replies/${replyId}/accept`),
  voteDiscussion: (id, value = 1) => api.post(`/discussions/${id}/vote`, { value }),

  // ── Resources — browse (public/approved) ─────────────────────────────────
  getResources: (params) => api.get('/resources', { params }),
  // Record a unique view on an approved resource
  recordResourceView: (id) => api.post(`/resources/${id}/view`),
  // Legacy alias (kept so existing code doesn't break)
  trackResourceView: (id) => api.post(`/resources/${id}/view`),
  trackResourceDownload: (id) => api.post(`/resources/${id}/download`),
  // Returns the download URL for a file resource
  getResourceDownloadUrl: (id, inline = false) =>
    `${API_URL}/v1/vault/resources/${id}/download${inline ? '?inline=1' : ''}`,

  // ── Resources — user submission ───────────────────────────────────────────
  submitResource: (data) => api.post('/resources/submit', data),
  // Admin-only create (kept for admin panel)
  createResource: (data) => api.post('/resources', data),
  deleteResource: (id) => api.delete(`/resources/${id}`),

  // ── Resources — my submissions ────────────────────────────────────────────
  getMyResources: () => api.get('/resources/mine'),
  updateMyResource: (id, data) => api.patch(`/resources/mine/${id}`, data),
  deleteMyResource: (id) => api.delete(`/resources/mine/${id}`),

  // ── Positions ─────────────────────────────────────────────────────────────
  getPositions: (params) => api.get('/positions', { params }),
  createPosition: (data) => api.post('/positions', data),
  deletePosition: (id) => api.delete(`/positions/${id}`),

  // ── Follows ───────────────────────────────────────────────────────────────
  getFollows: () => api.get('/follow'),
  getFollowingUpdates: (params) => api.get('/follow/updates', { params }),
  followFaculty: (facultyId) => api.post('/follow/faculty', { facultyId }),
  unfollowFaculty: (facultyId) => api.delete(`/follow/faculty/${facultyId}`),
  followArea: (areaId) => api.post('/follow/area', { areaId }),
  unfollowArea: (areaId) => api.delete(`/follow/area/${areaId}`),

  // ── Matching ──────────────────────────────────────────────────────────────
  matchInterest: (data) => api.post('/interest-matching', data),

  // ── Admin ─────────────────────────────────────────────────────────────────
  getAnalytics: () => api.get('/admin/analytics'),
};
