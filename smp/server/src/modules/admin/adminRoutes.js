import express from 'express';
import {
    getAdminConfig,
    updateAdminConfig,
    resetDatabase,
    sendAnnouncement,
    getGroupAnalytics,
    getUserAttendanceAnalytics,
    getFeedbackAnalytics,
    renewFeedbackCycle
} from './adminController.js';
import groupAdminRoutes from '../group/group.adminRoutes.js';
import userAdminRoutes from '../user/user.adminRoutes.js';

import { protect, adminOnly } from '../../middlewares/authMiddleware.js';

const router = express.Router();

// Apply admin middlewares to all routes here
router.use(protect, adminOnly);

router.get('/config', getAdminConfig);
router.put('/config', updateAdminConfig);
router.post('/reset', resetDatabase);
router.post('/announcements', sendAnnouncement);
router.post('/feedback/renew', renewFeedbackCycle);

// Observability & Analytics routes
router.get('/analytics/groups', getGroupAnalytics);
router.get('/analytics/users', getUserAttendanceAnalytics);
router.get('/analytics/feedback', getFeedbackAnalytics);

router.use('/groups', groupAdminRoutes);
router.use('/users', userAdminRoutes);

export default router;
