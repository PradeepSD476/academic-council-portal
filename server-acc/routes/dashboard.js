import express from 'express';
import { dashboardData } from '../controllers/dashboardController.js';
import { checkAdmin } from '../middlewares/checkAdmin.js';
import { checkAuth } from '../middlewares/checkAuth.js';

const router = express.Router();

router.get('/dashboard/admin', checkAuth, checkAdmin, dashboardData);

export default router;