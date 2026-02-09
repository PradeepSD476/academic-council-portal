import express from 'express';
import { changeRole, getMe, getUsers } from '../controllers/userController.js';
import { checkSuperAdmin } from '../middlewares/checkSuperAdmin.js';
import { checkAuth } from '../middlewares/checkAuth.js';

const router = express.Router();

router.patch('/users/:id', checkAuth, checkSuperAdmin, changeRole);
router.get('/users', checkAuth, checkSuperAdmin, getUsers);
router.get('/getuser/me', checkAuth, getMe);

export default router;