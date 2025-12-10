import express from 'express';
import { addAnnouncement, getAnnouncements, editAnnouncement, deleteAnnouncement } from '../controllers/announcementController.js';
import { checkAdmin } from '../middlewares/checkAdmin.js';

const router = express.Router();

router.post('/announcements', checkAdmin, addAnnouncement);
router.patch('/announcements/:id', checkAdmin, editAnnouncement);
router.get('/announcements', getAnnouncements);
router.delete('/announcements/:id', checkAdmin, deleteAnnouncement);

export default router;