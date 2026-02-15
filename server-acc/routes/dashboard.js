import express from 'express';
import { dashboardData, resourceCount } from '../controllers/dashboardController.js';
import { checkAdmin } from '../middlewares/checkAdmin.js';
import { checkAuth } from '../middlewares/checkAuth.js';

const router = express.Router();

router.get('/dashboard/admin', checkAuth, checkAdmin, dashboardData);
router.get('/dashboard/public/resource-count/:id', checkAuth, resourceCount);
export default router;