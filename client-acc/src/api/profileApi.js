import axios from 'axios';

const api = axios.create({ baseURL: `${import.meta.env.VITE_API_URL}/v1`, withCredentials: true });
export const profileApi = {
  notificationSettings: async (signal) => (await api.get('/profile/notification-settings', { signal })).data.data,
  updateNotificationSettings: async (settings) => (await api.patch('/profile/notification-settings', settings)).data.data,
  me: async (signal) => (await api.get('/getuser/me', { signal })).data.data,
  courses: async (signal) => (await api.get('/courses/my', { signal })).data.data,
  update: async (updates) => (await api.patch('/profile', updates)).data.data,
  photo: async (id, signal) => (await api.get(`/users/${id}/photo`, { signal })).data.data.photoURL,
  upload: async (file) => {
    const { data } = await api.post('/profile/photo/upload-url', { contentType: file.type, size: file.size });
    // Storage URLs use their own signature, not portal credentials or bearer tokens.
    const response = await fetch(data.signedUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
    if (!response.ok) throw new Error('Photo upload failed. Please try again.');
    return data.filePath;
  },
};
