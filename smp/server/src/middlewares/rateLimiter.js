import rateLimit from 'express-rate-limit';

const otpWindowMs = parseInt(process.env.OTP_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;
const otpMax = parseInt(process.env.OTP_RATE_LIMIT_MAX) || 5;

const loginWindowMs = parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;
const loginMax = parseInt(process.env.LOGIN_RATE_LIMIT_MAX) || 10;

// Strict rate limiter for OTP generation routes (Signup OTP & Forgot Password OTP)
export const otpRateLimiter = rateLimit({
    windowMs: otpWindowMs,
    max: otpMax,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: `Too many OTP requests from this IP. Please try again after ${Math.ceil(otpWindowMs / 60000)} minutes.`
    }
});

// General auth rate limiter for login attempts
export const loginRateLimiter = rateLimit({
    windowMs: loginWindowMs,
    max: loginMax,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: `Too many login attempts. Please try again after ${Math.ceil(loginWindowMs / 60000)} minutes for security.`
    }
});
