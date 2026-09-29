import express from 'express';
import {
    getFacultyProfiles,
    getFacultyProfileById,
    getFacultyOpenings,
    createFacultyProfile,
    updateFacultyProfile,
    deleteFacultyProfile,
    getResearchExperiences,
    getResearchExperienceById,
    getMyResearchExperiences,
    createResearchExperience,
    updateResearchExperience,
    deleteResearchExperience,
    setResearchExperienceStatus,
    getExperienceComments,
    createExperienceComment,
    deleteExperienceComment,
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
    downloadResearchResourceHandler,
    getResearchModerationQueue,
    createResearchResource,
    updateResearchResource,
    deleteResearchResource,
    submitResearchResource,
    getMyResearchResources,
    updateMyResearchResource,
    deleteMyResearchResource,
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
    getOpenPositionById,
    getResearchPositionBookmarks,
    bookmarkPosition,
    unbookmarkPosition,
    createOpenPosition,
    updateOpenPosition,
    deleteOpenPosition,
    getResearchAnalytics
} from '../controllers/researchVault.js';
import { checkAuth } from '../middlewares/checkAuth.js';
import { optionalAuth } from '../middlewares/optionalAuth.js';
import { checkResearchAdmin } from '../middlewares/checkResearchAdmin.js';

const router = express.Router();

// ── Research Areas ────────────────────────────────────────────────────────────
router.get('/areas', getResearchAreas);
router.post('/areas', checkAuth, checkResearchAdmin, createResearchArea);

// ── Faculty ───────────────────────────────────────────────────────────────────
router.get('/faculty', getFacultyProfiles);
router.get('/faculty/openings/:id', getFacultyOpenings);
router.get('/faculty/:id', getFacultyProfileById);
router.post('/faculty', checkAuth, checkResearchAdmin, createFacultyProfile);
router.put('/faculty/:id', checkAuth, checkResearchAdmin, updateFacultyProfile);
router.delete('/faculty/:id', checkAuth, checkResearchAdmin, deleteFacultyProfile);

// ── Research Experiences ──────────────────────────────────────────────────
// IMPORTANT: /experiences/mine must be declared before /experiences/:id
router.get('/experiences/mine', checkAuth, getMyResearchExperiences);
router.get('/experiences', getResearchExperiences);
router.get('/experiences/:id', optionalAuth, getResearchExperienceById);
router.post('/experiences', checkAuth, createResearchExperience);
router.put('/experiences/:id', checkAuth, updateResearchExperience);
router.delete('/experiences/:id', checkAuth, checkResearchAdmin, deleteResearchExperience);
// Moderation decision — no dedicated admin UI yet; simple status route.
router.patch('/admin/experiences/:id/status', checkAuth, checkResearchAdmin, setResearchExperienceStatus);
router.get('/admin/experiences', checkAuth, checkResearchAdmin, getResearchModerationQueue);
// Comments: flat Q&A beneath an experience; authors can delete their own
// (soft delete). Reads are public via optionalAuth, writes require auth.
router.get('/experiences/:id/comments', optionalAuth, getExperienceComments);
router.post('/experiences/:id/comments', checkAuth, createExperienceComment);
router.delete('/experiences/:id/comments/:commentId', checkAuth, deleteExperienceComment);

// ── Discussions ───────────────────────────────────────────────────────────────
router.get('/discussions', checkAuth, getResearchDiscussions);
router.get('/discussions/:id', getResearchDiscussionById);
router.post('/discussions', checkAuth, createResearchDiscussion);
router.put('/discussions/:id', checkAuth, updateResearchDiscussion);
router.delete('/discussions/:id', checkAuth, checkResearchAdmin, deleteResearchDiscussion);
router.post('/discussions/:id/replies', checkAuth, createResearchDiscussionReply);
router.post('/discussions/:id/replies/:replyId/accept', checkAuth, acceptResearchDiscussionReply);
router.post('/discussions/:id/vote', checkAuth, voteResearchDiscussion);
router.post('/discussions/:id/replies/:replyId/vote', checkAuth, voteResearchReply);

// ── Questions (cursor-based, for the Questions page) ─────────────────────────
router.get('/questions', checkAuth, getQuestionList);
router.get('/questions/:id', checkAuth, getQuestionDetail);
router.get('/questions/:id/replies', checkAuth, getQuestionReplies);

// ── Resources — user routes (ordered before admin to avoid conflicts) ─────────
// IMPORTANT: /resources/mine must be declared before /resources/:id
router.get('/resources/mine', checkAuth, getMyResearchResources);
router.patch('/resources/mine/:id', checkAuth, updateMyResearchResource);
router.delete('/resources/mine/:id', checkAuth, deleteMyResearchResource);

// User resource submission (link-only, pending status)
router.post('/resources/submit', checkAuth, submitResearchResource);

// Public browse (approved only)
router.get('/resources', getResearchResources);

// View/download tracking
router.post('/resources/:id/view', checkAuth, recordResearchResourceView);
router.get('/resources/:id/download', checkAuth, downloadResearchResourceHandler);
// Legacy download counter (kept for backwards compatibility with older admin panel calls)
router.post('/resources/:id/download', recordResearchResourceDownload);

// ── Resources — admin routes ──────────────────────────────────────────────────
router.post('/resources', checkAuth, checkResearchAdmin, createResearchResource);
router.put('/resources/:id', checkAuth, checkResearchAdmin, updateResearchResource);
router.delete('/resources/:id', checkAuth, checkResearchAdmin, deleteResearchResource);

// ── Open Positions ────────────────────────────────────────────────────────────
// IMPORTANT: /positions/bookmarks must be declared before /positions/:id
router.get('/positions/bookmarks', checkAuth, getResearchPositionBookmarks);
router.get('/positions', optionalAuth, getOpenPositions);
router.get('/positions/:id', optionalAuth, getOpenPositionById);
router.post('/positions/bookmarks', checkAuth, bookmarkPosition);
router.delete('/positions/bookmarks/:id', checkAuth, unbookmarkPosition);
router.post('/positions', checkAuth, checkResearchAdmin, createOpenPosition);
router.put('/positions/:id', checkAuth, checkResearchAdmin, updateOpenPosition);
router.delete('/positions/:id', checkAuth, checkResearchAdmin, deleteOpenPosition);

// ── Follows ───────────────────────────────────────────────────────────────────
router.get('/follow', checkAuth, getResearchFollows);
router.get('/follow/updates', checkAuth, getFollowingUpdates);
router.post('/follow/faculty', checkAuth, followFaculty);
router.delete('/follow/faculty/:id', checkAuth, unfollowFaculty);
router.post('/follow/area', checkAuth, followResearchArea);
router.delete('/follow/area/:id', checkAuth, unfollowResearchArea);

// ── Interest Matching ─────────────────────────────────────────────────────────
router.post('/interest-matching', checkAuth, getInterestMatch);

// ── Admin Analytics ───────────────────────────────────────────────────────────
router.get('/admin/analytics', checkAuth, checkResearchAdmin, getResearchAnalytics);

export default router;
