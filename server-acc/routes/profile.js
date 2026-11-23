import express from 'express';
import { updateProfile, editProfile, getPhotoUpload } from '../controllers/profileController.js';
import { checkAuth } from '../middlewares/checkAuth.js';
import { readNotificationSettings, updateNotificationSettings } from '../controllers/notificationSettingsController.js';

const router = express.Router();

router.post('/profile', checkAuth, updateProfile);
router.patch('/profile', checkAuth, editProfile);
router.post('/profile/photo/upload-url', checkAuth, getPhotoUpload);
router.get('/profile/notification-settings', checkAuth, readNotificationSettings);
router.patch('/profile/notification-settings', checkAuth, updateNotificationSettings);

export default router;
