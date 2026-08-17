import express from 'express';
import { getUsers, getUserDetail, getUnassignedUsers } from './user.adminController.js';

const router = express.Router();

router.get('/unassigned', getUnassignedUsers);
router.get('/', getUsers);
router.get('/:id', getUserDetail);

export default router;
