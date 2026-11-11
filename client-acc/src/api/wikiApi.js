import axios from 'axios';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || '/api'}/v1/wiki`,
  withCredentials: true,
});

export const fetchWikiCategories = async () => {
  const res = await api.get('/categories');
  return res.data;
};

export const fetchWikiArticles = async (params) => {
  const res = await api.get('/articles', { params });
  return res.data;
};

export const fetchArticleBySlug = async (slug) => {
  const res = await api.get(`/articles/${slug}`);
  return res.data;
};

export const createWikiArticle = async (articleData) => {
  const res = await api.post('/articles', articleData);
  return res.data;
};

export const createWikiCategory = async (categoryData) => {
  const res = await api.post('/categories', categoryData);
  return res.data;
};