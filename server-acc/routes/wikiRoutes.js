import express from 'express';
import {
  getCategories,
  getArticles,
  getArticleBySlug,
  createCategory,
  createArticle,
  deleteArticle
} from '../controllers/wikiController.js';
import { checkAuth } from '../middlewares/checkAuth.js';
import { checkWikiAdmin } from '../middlewares/checkWikiAdmin.js';

const router = express.Router();

// Public routes
router.get('/categories', getCategories);
router.get('/articles', getArticles);
router.get('/articles/:slug', getArticleBySlug);

// Admin routes
router.post('/categories', checkAuth, checkWikiAdmin, createCategory);
router.post('/articles', checkAuth, checkWikiAdmin, createArticle);
router.delete('/articles/:id', checkAuth, checkWikiAdmin, deleteArticle);

export default router;