import express from 'express';
import { signup, login, getMe, logout, sendSignupOtp, sendResetPasswordOtp, resetPassword } from './authController.js';
import { protect } from '../../middlewares/authMiddleware.js';
import { otpRateLimiter, loginRateLimiter } from '../../middlewares/rateLimiter.js';

const router = express.Router();

router.post('/signup/otp', otpRateLimiter, sendSignupOtp);
router.post('/signup', signup);
router.post('/login', loginRateLimiter, login);
router.get('/me', protect, getMe);
router.post('/logout', logout);

router.post('/password/forgot', otpRateLimiter, sendResetPasswordOtp);
router.post('/password/reset', resetPassword);

export default router;