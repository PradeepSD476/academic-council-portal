import express from 'express';
import { updateProfile, editProfile, getPhotoUpload } from '../controllers/profileController.js';
import { checkAuth } from '../middlewares/checkAuth.js';

const router = express.Router();

router.post('/profile', checkAuth, updateProfile);
router.patch('/profile', checkAuth, editProfile);
router.post('/profile/photo/upload-url', checkAuth, getPhotoUpload);

export default router;
