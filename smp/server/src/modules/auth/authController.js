import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma.js';
import { getPublicUrl } from '../../utils/signedUrl.js';
import { sendMail } from '../../utils/mailer.js';

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const OTP_COOLDOWN_MS = (parseInt(process.env.OTP_COOLDOWN_SECONDS) || 60) * 1000;
const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES) || 10;
const OTP_EXPIRY_MS = OTP_EXPIRY_MINUTES * 60 * 1000;

// NEW: Attaches token to an HTTP-Only cookie
const generateTokenAndSetCookie = (res, id, role) => {
    const token = jwt.sign({ id, role }, process.env.JWT_SECRET || 'fallback_secret_67', { expiresIn: '30d' });

    res.cookie('jwt', token, {
        httpOnly: true, // Prevents JS access (XSS protection)
        secure: process.env.NODE_ENV === 'production', // Allow local HTTP; require HTTPS in production
        sameSite: 'strict', // CSRF protection
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });
};

export const sendSignupOtp = async (req, res) => {
    const { email, rollNumber } = req.body;
    try {
        const config = await prisma.systemConfig.findFirst();
        if (config) {
            if (!config.isRegistrationOpen) {
                return res.status(403).json({ message: 'Registration is currently closed globally.' });
            }

            const isFirstYear = rollNumber.startsWith(config.firstYearBatchPrefix);
            const isSecondYear = rollNumber.startsWith(config.secondYearBatchPrefix);
            const isThirdYear = rollNumber.startsWith(config.thirdYearBatchPrefix);

            if (!isFirstYear && !isSecondYear && !isThirdYear) {
                return res.status(403).json({ message: 'Registration is only permitted for active 1st, 2nd, and 3rd year students.' });
            }
            if (isFirstYear && !config.allowFirstYearLogin) {
                return res.status(403).json({ message: 'Registration is currently closed for First-Year students.' });
            }
            if (isSecondYear && !config.allowSecondYearLogin) {
                return res.status(403).json({ message: 'Registration is currently closed for Second-Year students.' });
            }
            if (isThirdYear && !config.allowThirdYearLogin) {
                return res.status(403).json({ message: 'Registration is currently closed for Third-Year students.' });
            }
        }

        const userExists = await prisma.user.findFirst({ where: { OR: [{ email }, { rollNumber }] } });
        if (userExists) return res.status(400).json({ message: 'User already exists' });

        // Check cooldown per email
        const existingOtp = await prisma.oTP.findFirst({
            where: { email, purpose: 'SIGNUP' },
            orderBy: { createdAt: 'desc' }
        });
        if (existingOtp && (Date.now() - new Date(existingOtp.createdAt).getTime() < OTP_COOLDOWN_MS)) {
            const secondsLeft = Math.ceil((OTP_COOLDOWN_MS - (Date.now() - new Date(existingOtp.createdAt).getTime())) / 1000);
            return res.status(429).json({ message: `Please wait ${secondsLeft} seconds before requesting another OTP.` });
        }

        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

        // Delete existing OTPs for this email and purpose
        await prisma.oTP.deleteMany({ where: { email, purpose: 'SIGNUP' } });

        await prisma.oTP.create({
            data: { email, otp, purpose: 'SIGNUP', expiresAt }
        });

        const mailSent = await sendMail(email, 'Your SMP Registration OTP', `Your OTP for registration is: ${otp}. It will expire in ${OTP_EXPIRY_MINUTES} minutes.`);
        if (!mailSent) {
            return res.status(500).json({ message: 'Failed to send OTP email.' });
        }

        res.status(200).json({ message: 'OTP sent successfully' });
    } catch (error) {
        console.error("Send Signup OTP Error:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const signup = async (req, res) => {
    const { name, email, rollNumber, password, otp } = req.body;

    if (!otp) {
        return res.status(400).json({ message: 'OTP is required' });
    }

    try {
        const otpRecord = await prisma.oTP.findFirst({
            where: { email, purpose: 'SIGNUP' },
            orderBy: { createdAt: 'desc' }
        });

        if (!otpRecord) {
            return res.status(400).json({ message: 'No OTP found. Please request a new one.' });
        }

        if (otpRecord.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP.' });
        }

        if (new Date() > otpRecord.expiresAt) {
            return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
        }

        const config = await prisma.systemConfig.findFirst();
        if (config) {
            if (!config.isRegistrationOpen) {
                return res.status(403).json({ message: 'Registration is currently closed globally.' });
            }

            const isFirstYear = rollNumber.startsWith(config.firstYearBatchPrefix);
            const isSecondYear = rollNumber.startsWith(config.secondYearBatchPrefix);
            const isThirdYear = rollNumber.startsWith(config.thirdYearBatchPrefix);

            if (!isFirstYear && !isSecondYear && !isThirdYear) {
                return res.status(403).json({ message: 'Registration is only permitted for active 1st, 2nd, and 3rd year students.' });
            }
            if (isFirstYear && !config.allowFirstYearLogin) {
                return res.status(403).json({ message: 'Registration is currently closed for First-Year students.' });
            }
            if (isSecondYear && !config.allowSecondYearLogin) {
                return res.status(403).json({ message: 'Registration is currently closed for Second-Year students.' });
            }
            if (isThirdYear && !config.allowThirdYearLogin) {
                return res.status(403).json({ message: 'Registration is currently closed for Third-Year students.' });
            }
        }

        const userExists = await prisma.user.findFirst({ where: { OR: [{ email }, { rollNumber }] } });
        if (userExists) return res.status(400).json({ message: 'User already exists' });

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        const user = await prisma.user.create({ data: { name, email, rollNumber, passwordHash } });

        // Cleanup OTP
        await prisma.oTP.deleteMany({ where: { email, purpose: 'SIGNUP' } });

        generateTokenAndSetCookie(res, user.id, user.role); // Set Cookie

        res.status(201).json({
            id: user.id, name: user.name, email: user.email, role: user.role, smpRole: user.smpRole,
            bio: null, description: null, profilePicUrl: null
        });
    } catch (error) {
        console.error("Signup Error:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { email }, include: { response: true } });

        if (user && (await bcrypt.compare(password, user.passwordHash))) {
            if (user.role === 'STUDENT') {
                const config = await prisma.systemConfig.findFirst();
                if (config) {
                    const roll = user.rollNumber || '';
                    const isFirstYear = roll.startsWith(config.firstYearBatchPrefix);
                    const isSecondYear = roll.startsWith(config.secondYearBatchPrefix);
                    const isThirdYear = roll.startsWith(config.thirdYearBatchPrefix);

                    if (!isFirstYear && !isSecondYear && !isThirdYear) {
                        return res.status(403).json({ message: 'Login is only permitted for active 1st, 2nd, and 3rd year students.' });
                    }
                    if (isFirstYear && !config.allowFirstYearLogin) {
                        return res.status(403).json({ message: 'Login is currently disabled for First-Year students.' });
                    }
                    if (isSecondYear && !config.allowSecondYearLogin) {
                        return res.status(403).json({ message: 'Login is currently disabled for Second-Year students.' });
                    }
                    if (isThirdYear && !config.allowThirdYearLogin) {
                        return res.status(403).json({ message: 'Login is currently disabled for Third-Year students.' });
                    }
                }
            }

            generateTokenAndSetCookie(res, user.id, user.role); // Set Cookie

            let profilePicUrl = null;
            if (user.profilePic) {
                profilePicUrl = await getPublicUrl({ filePath: user.profilePic });
            }

            res.json({
                id: user.id, name: user.name, email: user.email, role: user.role, smpRole: user.smpRole,
                bio: user.bio, description: user.description, profilePicUrl,
                hasSubmittedQuestionnaire: !!user.response,
            });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const logout = (req, res) => {
    res.cookie('jwt', '', { httpOnly: true, expires: new Date(0) });
    res.status(200).json({ message: 'Logged out successfully' });
};

export const getMe = async (req, res) => {
    let profilePicUrl = null;
    if (req.user.profilePic) {
        profilePicUrl = await getPublicUrl({ filePath: req.user.profilePic });
    }

    res.json({
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        smpRole: req.user.smpRole,
        bio: req.user.bio,
        description: req.user.description,
        profilePicUrl,
        hasSubmittedQuestionnaire: !!req.user.response
    });
};

export const sendResetPasswordOtp = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: 'User with this email does not exist.' });
        }

        // Check cooldown per email
        const existingOtp = await prisma.oTP.findFirst({
            where: { email, purpose: 'RESET_PASSWORD' },
            orderBy: { createdAt: 'desc' }
        });
        if (existingOtp && (Date.now() - new Date(existingOtp.createdAt).getTime() < OTP_COOLDOWN_MS)) {
            const secondsLeft = Math.ceil((OTP_COOLDOWN_MS - (Date.now() - new Date(existingOtp.createdAt).getTime())) / 1000);
            return res.status(429).json({ message: `Please wait ${secondsLeft} seconds before requesting another OTP.` });
        }

        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

        // Delete existing OTPs for this email and purpose
        await prisma.oTP.deleteMany({ where: { email, purpose: 'RESET_PASSWORD' } });

        await prisma.oTP.create({
            data: { email, otp, purpose: 'RESET_PASSWORD', expiresAt }
        });

        const mailSent = await sendMail(email, 'SMP Password Reset OTP', `Your OTP for password reset is: ${otp}. It will expire in ${OTP_EXPIRY_MINUTES} minutes.`);
        if (!mailSent) {
            return res.status(500).json({ message: 'Failed to send OTP email.' });
        }

        res.status(200).json({ message: 'OTP sent successfully' });
    } catch (error) {
        console.error("Send Reset Password OTP Error:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
        return res.status(400).json({ message: 'Email, OTP, and new password are required.' });
    }

    try {
        const otpRecord = await prisma.oTP.findFirst({
            where: { email, purpose: 'RESET_PASSWORD' },
            orderBy: { createdAt: 'desc' }
        });

        if (!otpRecord) {
            return res.status(400).json({ message: 'No OTP found. Please request a new one.' });
        }

        if (otpRecord.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP.' });
        }

        if (new Date() > otpRecord.expiresAt) {
            return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);

        await prisma.user.update({
            where: { email },
            data: { passwordHash }
        });

        // Cleanup OTP
        await prisma.oTP.deleteMany({ where: { email, purpose: 'RESET_PASSWORD' } });

        res.status(200).json({ message: 'Password reset successfully. You can now login.' });
    } catch (error) {
        console.error("Reset Password Error:", error);
        res.status(500).json({ message: 'Server error' });
    }
};