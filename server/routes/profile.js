import express from 'express';
import { updateProfile } from '../controllers/profileController.js';

const router = express.Router();

router.post('/update', updateProfile);

export default router;