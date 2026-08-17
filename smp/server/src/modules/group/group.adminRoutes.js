import express from 'express';
import { getGroups, getGroupDetail, createGroup, moveUser, deleteGroup, removeUserFromGroup } from './group.adminController.js';

const router = express.Router();

router.get('/', getGroups);
router.get('/:id', getGroupDetail);
router.post('/', createGroup);
router.post('/move', moveUser);
router.post('/remove-user', removeUserFromGroup);
router.delete('/:id', deleteGroup);

export default router;
