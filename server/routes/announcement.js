import express from 'express';
import { addAnnouncement, getAnnouncements, editAnnouncement, deleteAnnouncement } from '../controllers/announcementController.js';
import { checkAnnouncementAdmin } from '../middlewares/checkAnnouncementAdmin.js';

const router = express.Router();

router.post('/announcements', checkAnnouncementAdmin, addAnnouncement);
router.patch('/announcements/:id', checkAnnouncementAdmin, editAnnouncement);
router.get('/announcements', getAnnouncements);
router.delete('/announcements/:id', checkAnnouncementAdmin, deleteAnnouncement);

export default router;