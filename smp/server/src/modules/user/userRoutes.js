import express from 'express';
import { getUserGroup, getUserStatus, updateUserProfile } from './userController.js';

const router = express.Router();

router.get('/group', getUserGroup);
router.get('/status', getUserStatus);
router.put('/profile', updateUserProfile);

export default router;
