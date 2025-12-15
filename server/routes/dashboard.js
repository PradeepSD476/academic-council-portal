import express from 'express';
import { dashboardData } from '../controllers/dashboardController.js';
import { checkAdmin } from '../middlewares/checkAdmin.js';

const router = express.Router();

router.get('/dashboard/admin', checkAdmin, dashboardData);

export default router;