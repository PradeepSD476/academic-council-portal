import express from 'express';
import { Login, LogoutUser, Register, sendEmailVerification, GetMe } from '../controllers/authControllers.js';
import { checkAuth } from '../middlewares/checkAuth.js';

const router = express.Router();

router.post('/auth/login', Login);
router.post('/auth/register', Register);
router.get('/auth/logout', checkAuth, LogoutUser);
router.post('/auth/send-otp', sendEmailVerification);
router.get('/auth/me', GetMe);

export default router;