import express from 'express';
import facultyRoutes from './facultyRoutes.js';
import positionRoutes from './positionRoutes.js';
import resourceRoutes from './resourceRoutes.js';
import discussionRoutes from './discussionRoutes.js';

import {
  getResearchAreas,
  createResearchArea,
  getInterestMatch,
  getResearchFollows,
  getFollowingUpdates,
  followFaculty,
  unfollowFaculty,
  followResearchArea,
  unfollowResearchArea,
} from '../../controllers/researchVault/areasController.js';

import {
  getResearchAnalytics,
} from '../../controllers/researchVault/analyticsController.js';

import {
  getResearchExperiences,
  getResearchExperienceById,
  getMyResearchExperiences,
  createResearchExperience,
  updateResearchExperience,
  deleteResearchExperience,
  setResearchExperienceStatus,
  getResearchModerationQueue,
  getResearchResourceModerationQueue,
  setResearchResourceStatus,
} from '../../controllers/researchVault/resourceController.js';

import {
  getExperienceComments,
  createExperienceComment,
  deleteExperienceComment,
  getQuestionList,
  getQuestionDetail,
  getQuestionReplies,
} from '../../controllers/researchVault/discussionController.js';

import { checkAuth } from '../../middlewares/checkAuth.js';
import { optionalAuth } from '../../middlewares/optionalAuth.js';
import { checkResearchAdmin } from '../../middlewares/checkResearchAdmin.js';

const router = express.Router();

// ── Modular Domain Mounts ─────────────────────────────────────────────────────
router.use('/faculty', facultyRoutes);
router.use('/positions', positionRoutes);
router.use('/resources', resourceRoutes);
router.use('/discussions', discussionRoutes);

// ── Research Areas & Taxonomy ─────────────────────────────────────────────────
router.get('/areas', getResearchAreas);
router.post('/areas', checkAuth, checkResearchAdmin, createResearchArea);

// ── Student Research Experiences (Mapped to ResearchResource type=EXPERIENCE) ─
router.get('/experiences/mine', checkAuth, getMyResearchExperiences);
router.get('/experiences', optionalAuth, getResearchExperiences);
router.get('/experiences/:id', optionalAuth, getResearchExperienceById);
router.post('/experiences', checkAuth, createResearchExperience);
router.put('/experiences/:id', checkAuth, updateResearchExperience);
router.delete('/experiences/:id', checkAuth, checkResearchAdmin, deleteResearchExperience);

// Experience comments (Mapped to ResearchDiscussion with resourceId)
router.get('/experiences/:id/comments', optionalAuth, getExperienceComments);
router.post('/experiences/:id/comments', checkAuth, createExperienceComment);
router.delete('/experiences/:id/comments/:commentId', checkAuth, deleteExperienceComment);

// Experience moderation
router.get('/admin/experiences', checkAuth, checkResearchAdmin, getResearchModerationQueue);
router.patch('/admin/experiences/:id/status', checkAuth, checkResearchAdmin, setResearchExperienceStatus);

// ── Questions (Mapped to ResearchDiscussion Q&A) ──────────────────────────────
router.get('/questions', optionalAuth, getQuestionList);
router.get('/questions/:id', optionalAuth, getQuestionDetail);
router.get('/questions/:id/replies', optionalAuth, getQuestionReplies);

// ── Admin Moderation & Analytics ──────────────────────────────────────────────
router.get('/admin/resources', checkAuth, checkResearchAdmin, getResearchResourceModerationQueue);
router.patch('/admin/resources/:id/status', checkAuth, checkResearchAdmin, setResearchResourceStatus);
router.get('/admin/analytics', checkAuth, checkResearchAdmin, getResearchAnalytics);

// ── Follows & Matching Compatibility ──────────────────────────────────────────
router.get('/follow', checkAuth, getResearchFollows);
router.get('/follow/updates', checkAuth, getFollowingUpdates);
router.post('/follow/faculty', checkAuth, followFaculty);
router.delete('/follow/faculty/:id', checkAuth, unfollowFaculty);
router.post('/follow/area', checkAuth, followResearchArea);
router.delete('/follow/area/:id', checkAuth, unfollowResearchArea);
router.post('/interest-matching', checkAuth, getInterestMatch);

export default router;
