import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const api = axios.create({ baseURL: `${API_URL}/v1/vault`, withCredentials: true });

export const researchVaultApi = {
  getAreas: () => api.get('/areas'),
  createArea: (data) => api.post('/areas', data),
  getFaculty: (params) => api.get('/faculty', { params }),
  getExperiences: (params) => api.get('/experiences', { params }),
  getDiscussions: (params) => api.get('/discussions', { params }),
  getResources: (params) => api.get('/resources', { params }),
  trackResourceView: (id) => api.post(`/resources/${id}/view`),
  trackResourceDownload: (id) => api.post(`/resources/${id}/download`),
  getPositions: (params) => api.get('/positions', { params }),
  followFaculty: (facultyId) => api.post('/follow/faculty', { facultyId }),
  followArea: (areaId) => api.post('/follow/area', { areaId }),
  matchInterest: (data) => api.post('/interest-matching', data),
  submitExperience: (data) => api.post('/experiences', data),
  submitDiscussion: (data) => api.post('/discussions', data),
  replyToDiscussion: (id, data) => api.post(`/discussions/${id}/replies`, data),
  voteDiscussion: (id, value = 1) => api.post(`/discussions/${id}/vote`, { value }),
  getModerationQueue: () => api.get('/admin/experiences'),
  updateExperience: (id, data) => api.put(`/experiences/${id}`, data),
  deleteExperience: (id) => api.delete(`/experiences/${id}`),
  getAnalytics: () => api.get('/admin/analytics'),
  createFaculty: (data) => api.post('/faculty', data),
  deleteFaculty: (id) => api.delete(`/faculty/${id}`),
  createResource: (data) => api.post('/resources', data),
  deleteResource: (id) => api.delete(`/resources/${id}`),
  createPosition: (data) => api.post('/positions', data),
  deletePosition: (id) => api.delete(`/positions/${id}`),
};