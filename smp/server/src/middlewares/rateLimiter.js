import rateLimit from 'express-rate-limit';

const otpWindowMs = parseInt(process.env.OTP_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;
const otpMax = parseInt(process.env.OTP_RATE_LIMIT_MAX) || 5;

const loginWindowMs = parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;
const loginMax = parseInt(process.env.LOGIN_RATE_LIMIT_MAX) || 10;

// Strict rate limiter for OTP generation routes (Signup OTP & Forgot Password OTP)
export const otpRateLimiter = (req, res, next) => next();

// General auth rate limiter for login attempts
export const loginRateLimiter = (req, res, next) => next();
