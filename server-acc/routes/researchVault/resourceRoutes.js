import express from 'express';
import {
  getResearchResources,
  getResearchResourceById,
  submitResearchResource,
  createResearchResource,
  updateResearchResource,
  deleteResearchResource,
  getMyResearchResources,
  updateMyResearchResource,
  deleteMyResearchResource,
  recordResearchResourceView,
  recordResearchResourceDownload,
  downloadResearchResourceHandler,
  getResearchResourceModerationQueue,
  setResearchResourceStatus,
  getResearchExperiences,
  getResearchExperienceById,
  getMyResearchExperiences,
  createResearchExperience,
  updateResearchExperience,
  deleteResearchExperience,
  setResearchExperienceStatus,
  getResearchModerationQueue,
} from '../../controllers/researchVault/resourceController.js';
import {
  getExperienceComments,
  createExperienceComment,
  deleteExperienceComment,
} from '../../controllers/researchVault/discussionController.js';
import { checkAuth } from '../../middlewares/checkAuth.js';
import { optionalAuth } from '../../middlewares/optionalAuth.js';
import { checkResearchAdmin } from '../../middlewares/checkResearchAdmin.js';

const router = express.Router();

// ── User Resource Submissions ────────────────────────────────────────────────
router.get('/mine', checkAuth, getMyResearchResources);
router.patch('/mine/:id', checkAuth, updateMyResearchResource);
router.delete('/mine/:id', checkAuth, deleteMyResearchResource);
router.post('/submit', checkAuth, submitResearchResource);

// ── Public Browse ─────────────────────────────────────────────────────────────
router.get('/', getResearchResources);
router.get('/:id', optionalAuth, getResearchResourceById);

// ── Tracking & Download ───────────────────────────────────────────────────────
router.post('/:id/view', optionalAuth, recordResearchResourceView);
router.get('/:id/download', optionalAuth, downloadResearchResourceHandler);
router.post('/:id/download', optionalAuth, recordResearchResourceDownload);

// ── Admin Routes ──────────────────────────────────────────────────────────────
router.get('/admin/queue', checkAuth, checkResearchAdmin, getResearchResourceModerationQueue);
router.patch('/admin/:id/status', checkAuth, checkResearchAdmin, setResearchResourceStatus);
router.post('/', checkAuth, checkResearchAdmin, createResearchResource);
router.put('/:id', checkAuth, checkResearchAdmin, updateResearchResource);
router.delete('/:id', checkAuth, checkResearchAdmin, deleteResearchResource);

export default router;
