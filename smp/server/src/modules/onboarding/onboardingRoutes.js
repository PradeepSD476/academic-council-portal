
import express from 'express';
import { getSystemConfig, submitQuestionnaire } from './onboardingController.js';
import { protect } from '../../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/config', getSystemConfig);
router.post('/questionnaire', protect, submitQuestionnaire);

export default router;