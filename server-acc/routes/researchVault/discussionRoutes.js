import express from 'express';
import {
  getResearchDiscussions,
  getResearchDiscussionById,
  createResearchDiscussion,
  updateResearchDiscussion,
  deleteResearchDiscussion,
  createResearchDiscussionReply,
  acceptResearchDiscussionReply,
  voteResearchDiscussion,
  getQuestionList,
  getQuestionDetail,
  getQuestionReplies,
} from '../../controllers/researchVault/discussionController.js';
import { checkAuth } from '../../middlewares/checkAuth.js';
import { optionalAuth } from '../../middlewares/optionalAuth.js';
import { checkResearchAdmin } from '../../middlewares/checkResearchAdmin.js';

const router = express.Router();

// List discussions / questions
router.get('/', optionalAuth, getResearchDiscussions);
router.get('/:id', optionalAuth, getResearchDiscussionById);

// Create, edit, delete discussions
router.post('/', checkAuth, createResearchDiscussion);
router.put('/:id', checkAuth, updateResearchDiscussion);
router.delete('/:id', checkAuth, deleteResearchDiscussion);

// 1-Level Threaded Replies
router.post('/:id/replies', checkAuth, createResearchDiscussionReply);
router.post('/:id/replies/:replyId/accept', checkAuth, acceptResearchDiscussionReply);

// Single unified vote endpoint (atomic deduplicated per user)
router.post('/:id/vote', checkAuth, voteResearchDiscussion);
// Alias route for nested reply vote pointing to the same single vote endpoint
router.post('/:id/replies/:replyId/vote', checkAuth, voteResearchDiscussion);

export default router;
