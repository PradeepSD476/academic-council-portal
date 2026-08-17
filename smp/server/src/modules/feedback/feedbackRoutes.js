import express from 'express';
import { protect } from '../../middlewares/authMiddleware.js';
import { submitFeedback, getMentorFeedback, getMyFeedbackSubmissions } from './feedbackController.js';

const router = express.Router();

router.post('/', protect, submitFeedback);
router.get('/my-submissions', protect, getMyFeedbackSubmissions);
router.get('/mentor/:mentorId', protect, getMentorFeedback);
router.get('/senior/:userId', protect, getMentorFeedback);

export default router;
