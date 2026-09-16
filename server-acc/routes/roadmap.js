import express from 'express';
import {
  getAllRoadmaps,
  getRoadmapBySlug,
  getChapter,
  createRoadmap,
  updateRoadmap,
  deleteRoadmap,
  createSection,
  updateSection,
  deleteSection,
  createChapter,
  updateChapter,
  deleteChapter,
} from '../controllers/roadmapController.js';
import { checkAuth } from '../middlewares/checkAuth.js';

const router = express.Router();

// Public / Student Read Routes
router.get('/roadmaps', getAllRoadmaps);
router.get('/roadmaps/:slug', getRoadmapBySlug);
router.get('/roadmaps/chapters/:chapterId', getChapter);

// Admin Management Routes
router.post('/roadmaps', checkAuth, createRoadmap);
router.put('/roadmaps/:id', checkAuth, updateRoadmap);
router.delete('/roadmaps/:id', checkAuth, deleteRoadmap);

router.post('/roadmaps/sections', checkAuth, createSection);
router.put('/roadmaps/sections/:id', checkAuth, updateSection);
router.delete('/roadmaps/sections/:id', checkAuth, deleteSection);

router.post('/roadmaps/chapters', checkAuth, createChapter);
router.put('/roadmaps/chapters/:id', checkAuth, updateChapter);
router.delete('/roadmaps/chapters/:id', checkAuth, deleteChapter);

export default router;
