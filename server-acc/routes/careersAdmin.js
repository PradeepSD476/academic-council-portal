import express from 'express';
import { checkAuth } from '../middlewares/checkAuth.js';
import { requireCareerAdmin } from '../middlewares/careers/requireCareerAdmin.js';
import { getSettings, updateSettings } from '../controllers/careers/adminSettingsController.js';

const router = express.Router();

router.get('/careers/admin/settings', checkAuth, requireCareerAdmin, getSettings);
router.put('/careers/admin/settings', checkAuth, requireCareerAdmin, updateSettings);

export default router;
