import express from 'express';
import { updateProfile } from '../controllers/profileController.js';
import { checkAuth } from '../middlewares/checkAuth.js';

const router = express.Router();

router.post('/profile', checkAuth, updateProfile);

export default router;