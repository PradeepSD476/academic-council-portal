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

  // Postings (LIVE only for students)
  listPostings: (params, config) => api.get('/careers/postings', { params, ...config }).then((r) => r.data),
  newPostingsCount: (since) => api.get('/careers/postings/new-count', { params: { since } }).then((r) => r.data.data),
  getPosting: (id) => api.get(`/careers/postings/${id}`).then((r) => r.data.data),
  searchCompanies: (q) => api.get('/careers/companies/search', { params: { q } }).then((r) => r.data.data),
  listCompanies: (params) => api.get('/careers/companies', { params }).then((r) => r.data),
  getCompany: (slug) => api.get(`/careers/companies/${encodeURIComponent(slug)}`).then((r) => r.data.data),

  // The student's own eligibility profile and CPI
  getEligibility: () => api.get('/careers/me/eligibility').then((r) => r.data.data),
  updateCpi: (cpi) => api.patch('/careers/me/cpi', { cpi }).then((r) => r.data),
  updateProgramme: (body) => api.patch('/careers/me/programme', body).then((r) => r.data),

  // Saved postings and application status (P4-lite)
  savePosting: (id) => api.put(`/careers/postings/${id}/save`).then((r) => r.data.data),
  unsavePosting: (id) => api.delete(`/careers/postings/${id}/save`).then((r) => r.data.data),
  hidePosting: (id) => api.put(`/careers/postings/${id}/hide`).then((r) => r.data.data),
  unhidePosting: (id) => api.delete(`/careers/postings/${id}/hide`).then((r) => r.data.data),
  setApplication: (id, status) => api.put(`/careers/postings/${id}/application`, { status }).then((r) => r.data.data),
  setApplicationNote: (id, note) => api.put(`/careers/postings/${id}/application/note`, { note }).then((r) => r.data.data),
  reportPosting: (id, body) => api.post(`/careers/postings/${id}/report`, body).then((r) => r.data),
  countApplyClick: (id) => api.post(`/careers/postings/${id}/apply-click`).then((r) => r.data),
  listSaved: () => api.get('/careers/saved').then((r) => r.data),

  // Job alerts (P7-T1); unsubscribe / resubscribe work without login (the link in the email)
  listAlerts: () => api.get('/careers/alerts').then((r) => r.data),
  createAlert: (body) => api.post('/careers/alerts', body).then((r) => r.data),
  updateAlert: (id, body) => api.patch(`/careers/alerts/${id}`, body).then((r) => r.data.data),
  deleteAlert: (id) => api.delete(`/careers/alerts/${id}`).then((r) => r.data),
  unsubscribeAlert: (token) => api.post('/careers/alerts/unsubscribe', { token }).then((r) => r.data.data),
  resubscribeAlert: (token) => api.post('/careers/alerts/resubscribe', { token }).then((r) => r.data.data),

  // Shared job links
  submitLink: (body) => api.post('/careers/submissions', body).then((r) => r.data),
  mySubmissions: () => api.get('/careers/submissions/mine').then((r) => r.data.data),
  withdrawLink: (id) => api.post(`/careers/submissions/${id}/withdraw`, {}).then((r) => r.data),
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

  // Experience backfill
  listBackfill: (params) => api.get('/careers/admin/backfill/suggestions', { params }).then((r) => r.data),
  applyBackfill: (items) => api.post('/careers/admin/backfill/apply', { items }).then((r) => r.data),
  unlinkBackfill: (experienceId) => api.post('/careers/admin/backfill/unlink', { experienceId }).then((r) => r.data),

  // Merge / split / undo
  mergeCompanies: (fromId, toId) => api.post('/careers/admin/companies/merge', { fromId, toId }).then((r) => r.data),
  splitCompany: (id, body) => api.post(`/careers/admin/companies/${id}/split`, body).then((r) => r.data),
  listMergeLog: (params) => api.get('/careers/admin/merge-log', { params }).then((r) => r.data),
  undoMergeLog: (logId) => api.post(`/careers/admin/merge-log/${logId}/undo`).then((r) => r.data),

  // Review queue and postings
  listReview: (params) => api.get('/careers/admin/review', { params }).then((r) => r.data),
  reviewCounts: () => api.get('/careers/admin/review/counts').then((r) => r.data.data),
  listAllPostings: (params) => api.get('/careers/admin/postings', { params }).then((r) => r.data),
  getPosting: (id) => api.get(`/careers/admin/postings/${id}`).then((r) => r.data.data),
  updatePosting: (id, edits) => api.patch(`/careers/admin/postings/${id}`, edits).then((r) => r.data),
  approvePosting: (id, edits) => api.post(`/careers/admin/postings/${id}/approve`, { edits }).then((r) => r.data),
  rejectPosting: (id, reason) => api.post(`/careers/admin/postings/${id}/reject`, { reason }).then((r) => r.data),
  expirePosting: (id) => api.post(`/careers/admin/postings/${id}/expire`, {}).then((r) => r.data),
  reopenPosting: (id) => api.post(`/careers/admin/postings/${id}/reopen`, {}).then((r) => r.data),
  takeDownPosting: (id, body) => api.post(`/careers/admin/postings/${id}/take-down`, body).then((r) => r.data),
  handlePostingReports: (id) => api.post(`/careers/admin/postings/${id}/reports/handled`).then((r) => r.data),
  bulkApprove: (ids) => api.post('/careers/admin/postings/bulk-approve', { ids }).then((r) => r.data),
  undoBulkApprove: (ids) => api.post('/careers/admin/postings/bulk-approve/undo', { ids }).then((r) => r.data),
  bulkReject: (ids, reason) => api.post('/careers/admin/postings/bulk-reject', { ids, reason }).then((r) => r.data),
  bulkExpire: (ids) => api.post('/careers/admin/postings/bulk-expire', { ids }).then((r) => r.data),
  createPosting: (body) => api.post('/careers/admin/postings', body).then((r) => r.data),
  listSubmissions: (params) => api.get('/careers/admin/submissions', { params }).then((r) => r.data),
  retrySubmission: (id) => api.post(`/careers/admin/submissions/${id}/retry`, {}).then((r) => r.data),
  dismissSubmission: (id, reason) => api.post(`/careers/admin/submissions/${id}/dismiss`, { reason }).then((r) => r.data),

  // Sources and operations
  listSources: (params = {}) => api.get('/careers/admin/sources', { params }).then((r) => r.data),
  createSource: (body) => api.post('/careers/admin/sources', body).then((r) => r.data),
  bulkCreateSources: (lines) => api.post('/careers/admin/sources/bulk', { lines }).then((r) => r.data),
  updateSource: (id, body) => api.patch(`/careers/admin/sources/${id}`, body).then((r) => r.data),
  archiveSource: (id) => api.post(`/careers/admin/sources/${id}/archive`).then((r) => r.data),
  restoreSource: (id) => api.post(`/careers/admin/sources/${id}/restore`).then((r) => r.data),
  runSource: (id) => api.post(`/careers/admin/sources/${id}/run`).then((r) => r.data),
  runAllSources: () => api.post('/careers/admin/sources/run-all').then((r) => r.data),
  listRuns: (id, limit = 20) => api.get(`/careers/admin/sources/${id}/runs`, { params: { limit } }).then((r) => r.data.data),
  getOps: () => api.get('/careers/admin/ops').then((r) => r.data.data),
  getUsage: (weeks) => api.get('/careers/admin/usage', { params: { weeks } }).then((r) => r.data.data),

  // Settings
  getSettings: () => api.get('/careers/admin/settings').then((r) => r.data.data),
  updateSettings: (body) => api.put('/careers/admin/settings', body).then((r) => r.data.data),
};
