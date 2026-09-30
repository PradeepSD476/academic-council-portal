import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: `${API_URL}/v1`,
  withCredentials: true,
});

// Server errors come back as { success:false, error, message }; surface the message.
export const errorMessage = (err, fallback = 'Something went wrong. Please try again.') =>
  err?.response?.data?.message || fallback;

export const careersApi = {
  getStatus: () => api.get('/careers/status').then((r) => r.data.data),
};

export const careersAdminApi = {
  // Companies
  listCompanies: (params) => api.get('/careers/admin/companies', { params }).then((r) => r.data),
  getCompany: (id) => api.get(`/careers/admin/companies/${id}`).then((r) => r.data.data),
  createCompany: (body) => api.post('/careers/admin/companies', body).then((r) => r.data.data),
  updateCompany: (id, body) => api.patch(`/careers/admin/companies/${id}`, body).then((r) => r.data.data),
  approveCompany: (id) => api.post(`/careers/admin/companies/${id}/approve`).then((r) => r.data.data),
  addAlias: (id, alias) => api.post(`/careers/admin/companies/${id}/aliases`, { alias }).then((r) => r.data.data),
  deleteAlias: (aliasId) => api.delete(`/careers/admin/aliases/${aliasId}`).then((r) => r.data),

  // Merge / split / undo
  mergeCompanies: (fromId, toId) => api.post('/careers/admin/companies/merge', { fromId, toId }).then((r) => r.data),
  splitCompany: (id, body) => api.post(`/careers/admin/companies/${id}/split`, body).then((r) => r.data),
  listMergeLog: (params) => api.get('/careers/admin/merge-log', { params }).then((r) => r.data),
  undoMergeLog: (logId) => api.post(`/careers/admin/merge-log/${logId}/undo`).then((r) => r.data),

  // Settings
  getSettings: () => api.get('/careers/admin/settings').then((r) => r.data.data),
  updateSettings: (body) => api.put('/careers/admin/settings', body).then((r) => r.data.data),
};
