import express from 'express';
import { addAnnouncement, getAnnouncements, editAnnouncement, deleteAnnouncement } from '../controllers/announcementController.js';
import { checkAdmin } from '../middlewares/checkAdmin.js';

const router = express.Router();

router.post('/upload', checkAdmin, addAnnouncement);
router.post('/update', checkAdmin, editAnnouncement);
router.get('/read', getAnnouncements);
router.post('/delete', checkAdmin, deleteAnnouncement);

export default router;