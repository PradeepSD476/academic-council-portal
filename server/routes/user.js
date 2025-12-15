import express from 'express';
import { changeRole, getUsers } from '../controllers/userController.js';
import { checkSuperAdmin } from '../middlewares/checkSuperAdmin.js';

const router = express.Router();

router.patch('/users/:id', checkSuperAdmin, changeRole);
router.get('/users', checkSuperAdmin, getUsers);

export default router;