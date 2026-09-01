import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma.js';
import { getPublicUrl } from '../../utils/signedUrl.js';
import { sendMail } from '../../utils/mailer.js';
import { validateInstituteEmail, validateSmpRollNumber, extractRollFromEmail } from '../../utils/rollValidator.js';

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
    const { email } = req.body;
    try {
        const emailValidation = validateInstituteEmail(email);
        if (!emailValidation.valid) {
            return res.status(400).json({ message: emailValidation.message });
        }
        const cleanEmail = emailValidation.email;

        // Derive roll number from the verified email
        const derivedRoll = extractRollFromEmail(cleanEmail);
        if (!derivedRoll) {
            return res.status(400).json({ message: 'Could not extract roll number from email. Ensure your email follows the format: name_rollnumber@iitp.ac.in' });
        }

        const config = await prisma.systemConfig.findFirst();
        const rollValidation = validateSmpRollNumber(derivedRoll, config, 'registration');
        if (!rollValidation.valid) {
            return res.status(403).json({ message: rollValidation.message });
        }

        const userExists = await prisma.user.findFirst({ where: { OR: [{ email: cleanEmail }, { rollNumber: derivedRoll }] } });
        if (userExists) return res.status(400).json({ message: 'User already exists' });

        // Check cooldown per email
        const existingOtp = await prisma.oTP.findFirst({
            where: { email: cleanEmail, purpose: 'SIGNUP' },
            orderBy: { createdAt: 'desc' }
        });
        if (existingOtp && (Date.now() - new Date(existingOtp.createdAt).getTime() < OTP_COOLDOWN_MS)) {
            const secondsLeft = Math.ceil((OTP_COOLDOWN_MS - (Date.now() - new Date(existingOtp.createdAt).getTime())) / 1000);
            return res.status(429).json({ message: `Please wait ${secondsLeft} seconds before requesting another OTP.` });
        }

        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

        // Delete existing OTPs for this email and purpose
        await prisma.oTP.deleteMany({ where: { email: cleanEmail, purpose: 'SIGNUP' } });

        await prisma.oTP.create({
            data: { email: cleanEmail, otp, purpose: 'SIGNUP', expiresAt }
        });

        const mailSent = await sendMail(cleanEmail, 'Your SMP Registration OTP', `Your OTP for registration is: ${otp}. It will expire in ${OTP_EXPIRY_MINUTES} minutes.`);
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
    const { name, email, password, otp } = req.body;

    if (!otp) {
        return res.status(400).json({ message: 'OTP is required' });
    }

    const emailValidation = validateInstituteEmail(email);
    if (!emailValidation.valid) {
        return res.status(400).json({ message: emailValidation.message });
    }
    const cleanEmail = emailValidation.email;

    // Derive roll number from the verified email
    const derivedRoll = extractRollFromEmail(cleanEmail);
    if (!derivedRoll) {
        return res.status(400).json({ message: 'Could not extract roll number from email. Ensure your email follows the format: name_rollnumber@iitp.ac.in' });
    }

    try {
        const otpRecord = await prisma.oTP.findFirst({
            where: { email: cleanEmail, purpose: 'SIGNUP' },
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
        const rollValidation = validateSmpRollNumber(derivedRoll, config, 'registration');
        if (!rollValidation.valid) {
            return res.status(403).json({ message: rollValidation.message });
        }

        const userExists = await prisma.user.findFirst({ where: { OR: [{ email: cleanEmail }, { rollNumber: derivedRoll }] } });
        if (userExists) return res.status(400).json({ message: 'User already exists' });

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        const user = await prisma.user.create({ data: { name, email: cleanEmail, rollNumber: derivedRoll, passwordHash } });

        // Cleanup OTP
        await prisma.oTP.deleteMany({ where: { email: cleanEmail, purpose: 'SIGNUP' } });

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
        const cleanEmail = email ? email.trim().toLowerCase() : '';
        const user = await prisma.user.findUnique({ where: { email: cleanEmail }, include: { response: true } });

        if (user && (await bcrypt.compare(password, user.passwordHash))) {
            if (user.role === 'STUDENT') {
                const config = await prisma.systemConfig.findFirst();
                const rollValidation = validateSmpRollNumber(user.rollNumber, config, 'login');
                if (!rollValidation.valid) {
                    return res.status(403).json({ message: rollValidation.message });
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
        const emailValidation = validateInstituteEmail(email);
        if (!emailValidation.valid) {
            return res.status(400).json({ message: emailValidation.message });
        }
        const cleanEmail = emailValidation.email;

        const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
        if (!user) {
            return res.status(404).json({ message: 'User with this email does not exist.' });
        }

        // Check cooldown per email
        const existingOtp = await prisma.oTP.findFirst({
            where: { email: cleanEmail, purpose: 'RESET_PASSWORD' },
            orderBy: { createdAt: 'desc' }
        });
        if (existingOtp && (Date.now() - new Date(existingOtp.createdAt).getTime() < OTP_COOLDOWN_MS)) {
            const secondsLeft = Math.ceil((OTP_COOLDOWN_MS - (Date.now() - new Date(existingOtp.createdAt).getTime())) / 1000);
            return res.status(429).json({ message: `Please wait ${secondsLeft} seconds before requesting another OTP.` });
        }

        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

        // Delete existing OTPs for this email and purpose
        await prisma.oTP.deleteMany({ where: { email: cleanEmail, purpose: 'RESET_PASSWORD' } });

        await prisma.oTP.create({
            data: { email: cleanEmail, otp, purpose: 'RESET_PASSWORD', expiresAt }
        });

        const mailSent = await sendMail(cleanEmail, 'SMP Password Reset OTP', `Your OTP for password reset is: ${otp}. It will expire in ${OTP_EXPIRY_MINUTES} minutes.`);
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

    const emailValidation = validateInstituteEmail(email);
    if (!emailValidation.valid) {
        return res.status(400).json({ message: emailValidation.message });
    }
    const cleanEmail = emailValidation.email;

    try {
        const otpRecord = await prisma.oTP.findFirst({
            where: { email: cleanEmail, purpose: 'RESET_PASSWORD' },
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

        const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);

        await prisma.user.update({
            where: { email: cleanEmail },
            data: { passwordHash }
        });

        // Cleanup OTP
        await prisma.oTP.deleteMany({ where: { email: cleanEmail, purpose: 'RESET_PASSWORD' } });

        res.status(200).json({ message: 'Password reset successfully. You can now login.' });
    } catch (error) {
        console.error("Reset Password Error:", error);
        res.status(500).json({ message: 'Server error' });
    }
};