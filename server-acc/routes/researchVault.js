import express from 'express';
import {
    getFacultyProfiles,
    getFacultyProfileById,
    createFacultyProfile,
    updateFacultyProfile,
    deleteFacultyProfile,
    getResearchExperiences,
    getResearchExperienceById,
    createResearchExperience,
    updateResearchExperience,
    deleteResearchExperience,
    getResearchDiscussions,
    getQuestionList,
    getQuestionDetail,
    getQuestionReplies,
    getResearchDiscussionById,
    createResearchDiscussion,
    updateResearchDiscussion,
    deleteResearchDiscussion,
    createResearchDiscussionReply,
    acceptResearchDiscussionReply,
    voteResearchDiscussion,
    voteResearchReply,
    getResearchResources,
    recordResearchResourceView,
    recordResearchResourceDownload,
    getResearchModerationQueue,
    createResearchResource,
    updateResearchResource,
    deleteResearchResource,
    getResearchAreas,
    createResearchArea,
    getInterestMatch,
    getResearchFollows,
    getFollowingUpdates,
    followFaculty,
    unfollowFaculty,
    followResearchArea,
    unfollowResearchArea,
    getOpenPositions,
    createOpenPosition,
    updateOpenPosition,
    deleteOpenPosition,
    getResearchAnalytics
} from '../controllers/researchVault.js';
import { checkAuth } from '../middlewares/checkAuth.js';
import { checkResearchAdmin } from '../middlewares/checkResearchAdmin.js';

const router = express.Router();

// Public routes
router.get('/faculty', getFacultyProfiles);
router.get('/faculty/:id', getFacultyProfileById);
router.get('/experiences', getResearchExperiences);
router.get('/experiences/:id', getResearchExperienceById);
router.get('/discussions', checkAuth, getResearchDiscussions);
router.get('/discussions/:id', getResearchDiscussionById);
router.get('/questions', checkAuth, getQuestionList);
router.get('/questions/:id', checkAuth, getQuestionDetail);
router.get('/questions/:id/replies', checkAuth, getQuestionReplies);
router.get('/resources', getResearchResources);
router.post('/resources/:id/view', recordResearchResourceView);
router.post('/resources/:id/download', recordResearchResourceDownload);
router.get('/areas', getResearchAreas);
router.post('/areas', checkAuth, checkResearchAdmin, createResearchArea);
router.get('/positions', getOpenPositions);
router.get('/admin/experiences', checkAuth, checkResearchAdmin, getResearchModerationQueue);

// Auth-protected routes
router.post('/experiences', checkAuth, createResearchExperience);
router.put('/experiences/:id', checkAuth, updateResearchExperience);
router.post('/discussions', checkAuth, createResearchDiscussion);
router.put('/discussions/:id', checkAuth, updateResearchDiscussion);
router.post('/discussions/:id/replies', checkAuth, createResearchDiscussionReply);
router.post('/discussions/:id/replies/:replyId/accept', checkAuth, acceptResearchDiscussionReply);
router.post('/discussions/:id/vote', checkAuth, voteResearchDiscussion);
router.post('/discussions/:id/replies/:replyId/vote', checkAuth, voteResearchReply);
router.post('/interest-matching', checkAuth, getInterestMatch);
router.get('/follow', checkAuth, getResearchFollows);
router.get('/follow/updates', checkAuth, getFollowingUpdates);
router.post('/follow/faculty', checkAuth, followFaculty);
router.delete('/follow/faculty/:id', checkAuth, unfollowFaculty);
router.post('/follow/area', checkAuth, followResearchArea);
router.delete('/follow/area/:id', checkAuth, unfollowResearchArea);

// Admin-protected routes
router.post('/faculty', checkAuth, checkResearchAdmin, createFacultyProfile);
router.put('/faculty/:id', checkAuth, checkResearchAdmin, updateFacultyProfile);
router.delete('/faculty/:id', checkAuth, checkResearchAdmin, deleteFacultyProfile);
router.delete('/experiences/:id', checkAuth, checkResearchAdmin, deleteResearchExperience);
router.delete('/discussions/:id', checkAuth, checkResearchAdmin, deleteResearchDiscussion);
router.post('/resources', checkAuth, checkResearchAdmin, createResearchResource);
router.put('/resources/:id', checkAuth, checkResearchAdmin, updateResearchResource);
router.delete('/resources/:id', checkAuth, checkResearchAdmin, deleteResearchResource);
router.post('/positions', checkAuth, checkResearchAdmin, createOpenPosition);
router.put('/positions/:id', checkAuth, checkResearchAdmin, updateOpenPosition);
router.delete('/positions/:id', checkAuth, checkResearchAdmin, deleteOpenPosition);
router.get('/admin/analytics', checkAuth, checkResearchAdmin, getResearchAnalytics);

export default router;