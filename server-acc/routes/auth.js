import express from 'express';
import { Login, LogoutUser, Register, sendEmailVerification, GetMe, forgotPassword, verifyResetOtp, resetPassword } from '../controllers/authControllers.js';
import { checkAuth } from '../middlewares/checkAuth.js';

const router = express.Router();

router.post('/auth/login', Login);
router.post('/auth/register', Register);
router.get('/auth/logout', checkAuth, LogoutUser);
router.post('/auth/send-otp', sendEmailVerification);
router.get('/auth/me', GetMe);
router.post('/auth/forgot-password', forgotPassword);
router.post('/auth/verify-reset-otp', verifyResetOtp);
router.post('/auth/reset-password', resetPassword);

export default router;