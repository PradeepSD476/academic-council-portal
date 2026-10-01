import express from 'express';
import { checkAuth } from '../middlewares/checkAuth.js';
import { getCareersStatus } from '../controllers/careers/statusController.js';
import { requireCareersEnabled } from '../middlewares/careers/requireCareersEnabled.js';
import { submissionRateLimit } from '../middlewares/careers/submissionRateLimit.js';
import { submitLink, mySubmissions } from '../controllers/careers/submissionsController.js';

// Student-facing careers routes. requireCareersEnabled is applied per route (not router-wide)
// because /careers/status must answer even while the feature is hidden.
const router = express.Router();

router.get('/careers/status', checkAuth, getCareersStatus);

router.post('/careers/submissions', checkAuth, requireCareersEnabled, submissionRateLimit, submitLink);
router.get('/careers/submissions/mine', checkAuth, requireCareersEnabled, mySubmissions);

export default router;
