import express from 'express';
import { getUsers, getUserDetail, getUnassignedUsers, deleteUser } from './user.adminController.js';

const router = express.Router();

router.get('/unassigned', getUnassignedUsers);
router.get('/', getUsers);
router.get('/:id', getUserDetail);
router.delete('/:id', deleteUser);

export default router;
