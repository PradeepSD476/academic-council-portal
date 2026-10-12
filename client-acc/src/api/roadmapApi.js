import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: `${API_URL}/v1`,
  withCredentials: true,
});

export const roadmapApi = {
  getAllRoadmaps: async () => {
    const response = await api.get('/roadmaps');
    return response.data;
  },

  getRoadmapBySlug: async (slug) => {
    const response = await api.get(`/roadmaps/${slug}`);
    return response.data;
  },

  getChapter: async (chapterId) => {
    const response = await api.get(`/roadmaps/chapters/${chapterId}`);
    return response.data;
  },

  createRoadmap: async (data) => {
    const response = await api.post('/roadmaps', data);
    return response.data;
  },

  updateRoadmap: async (id, data) => {
    const response = await api.put(`/roadmaps/${id}`, data);
    return response.data;
  },

  deleteRoadmap: async (id) => {
    const response = await api.delete(`/roadmaps/${id}`);
    return response.data;
  },

  createSection: async (data) => {
    const response = await api.post('/roadmaps/sections', data);
    return response.data;
  },

  updateSection: async (id, data) => {
    const response = await api.put(`/roadmaps/sections/${id}`, data);
    return response.data;
  },

  deleteSection: async (id) => {
    const response = await api.delete(`/roadmaps/sections/${id}`);
    return response.data;
  },

  createChapter: async (data) => {
    const response = await api.post('/roadmaps/chapters', data);
    return response.data;
  },

  updateChapter: async (id, data) => {
    const response = await api.put(`/roadmaps/chapters/${id}`, data);
    return response.data;
  },

  deleteChapter: async (id) => {
    const response = await api.delete(`/roadmaps/chapters/${id}`);
    return response.data;
  },
};
