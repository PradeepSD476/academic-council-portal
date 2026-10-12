import express from 'express';
import { checkAuth } from '../middlewares/checkAuth.js';
import { checkDoubtAdmin } from '../middlewares/checkDoubtAdmin.js';
import {
    addAnswer,
    createDoubt,
    deleteAnswer,
    deleteDoubt,
    getAdminStats,
    getCategories,
    getDoubt,
    getDoubts,
    getReports,
    moderateAnswer,
    moderateDoubt,
    reportContent,
    resolveReport,
    setDoubtStatus,
    toggleAcceptAnswer,
    toggleAnswerVote,
    toggleDoubtVote,
    updateAnswer,
    updateDoubt,
} from '../controllers/doubtController.js';

const router = express.Router();

// NOTE: fixed paths (/doubts/admin/..., /doubts/answers/...) are declared
// before /doubts/:id so they are never read as an id.

// Moderation (SUPER_ADMIN, FACULTY)
router.get('/doubts/admin/stats', checkAuth, checkDoubtAdmin, getAdminStats);
router.get('/doubts/admin/reports', checkAuth, checkDoubtAdmin, getReports);
router.patch('/doubts/admin/reports/:id', checkAuth, checkDoubtAdmin, resolveReport);
router.patch('/doubts/admin/answers/:id', checkAuth, checkDoubtAdmin, moderateAnswer);
router.patch('/doubts/admin/:id', checkAuth, checkDoubtAdmin, moderateDoubt);

// Any logged-in user
router.get('/doubts/categories', checkAuth, getCategories);
router.post('/doubts/report', checkAuth, reportContent);

// Answers (author or moderator checks happen in the controller)
router.patch('/doubts/answers/:id', checkAuth, updateAnswer);
router.delete('/doubts/answers/:id', checkAuth, deleteAnswer);
router.post('/doubts/answers/:id/vote', checkAuth, toggleAnswerVote);
router.post('/doubts/answers/:id/accept', checkAuth, toggleAcceptAnswer);

// Doubts
router.get('/doubts', checkAuth, getDoubts);
router.post('/doubts', checkAuth, createDoubt);
router.get('/doubts/:id', checkAuth, getDoubt);
router.patch('/doubts/:id', checkAuth, updateDoubt);
router.delete('/doubts/:id', checkAuth, deleteDoubt);
router.patch('/doubts/:id/status', checkAuth, setDoubtStatus);
router.post('/doubts/:id/vote', checkAuth, toggleDoubtVote);
router.post('/doubts/:id/answers', checkAuth, addAnswer);

export default router;
