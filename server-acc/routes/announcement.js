import express from 'express';
import { addAnnouncement, getAnnouncements, editAnnouncement, deleteAnnouncement } from '../controllers/announcementController.js';
import { checkAnnouncementAdmin } from '../middlewares/checkAnnouncementAdmin.js';
import { checkAuth } from '../middlewares/checkAuth.js';

const router = express.Router();

router.post('/announcements', checkAuth, checkAnnouncementAdmin, addAnnouncement);
router.patch('/announcements/:id', checkAuth, checkAnnouncementAdmin, editAnnouncement);
router.get('/announcements', checkAuth, getAnnouncements);
router.delete('/announcements/:id', checkAuth, checkAnnouncementAdmin, deleteAnnouncement);

export default router;