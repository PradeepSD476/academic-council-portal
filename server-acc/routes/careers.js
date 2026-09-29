import express from 'express';
import { checkAuth } from '../middlewares/checkAuth.js';
import { getCareersStatus } from '../controllers/careers/statusController.js';

// Student-facing careers routes. requireCareersEnabled is applied per route (not router-wide)
// because /careers/status must answer even while the feature is hidden.
const router = express.Router();

router.get('/careers/status', checkAuth, getCareersStatus);

export default router;
