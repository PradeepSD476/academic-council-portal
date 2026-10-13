import express from 'express';
import {
  getCategories,
  getArticles,
  getArticleBySlug,
  createCategory,
  createArticle,
  deleteArticle
} from '../controllers/wikiController.js';

const router = express.Router();

// Public routes
router.get('/categories', getCategories);
router.get('/articles', getArticles);
router.get('/articles/:slug', getArticleBySlug);

// Admin routes
router.post('/categories', createCategory);
router.post('/articles', createArticle);
router.delete('/articles/:id', deleteArticle);

export default router;