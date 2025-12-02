import express from 'express';
import { addAnnouncement, getAnnouncements, editAnnouncement, deleteAnnouncement } from '../controllers/announcementController.js';
import { checkAdmin } from '../middlewares/checkAdmin.js';

const router = express.Router();

router.post('/upload', addAnnouncement);
router.post('/update', editAnnouncement);
router.get('/read', getAnnouncements);
router.post('/delete', deleteAnnouncement);

export default router;