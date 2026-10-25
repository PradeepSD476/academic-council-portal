import prisma from '../config/db.js';
import jwt from 'jsonwebtoken';

// Like checkAuth, but never rejects: attaches req.user when a valid token
// cookie is present, leaves req.user undefined otherwise. Used on public
// browse endpoints that want per-user personalization (e.g. position
// bookmark flags) without forcing sign-in.
export const optionalAuth = async (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        req.user = undefined;
        return next();
    }
    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        const userEmail = decoded.email;
        if (userEmail) {
            const user = await prisma.user.findFirst({
                where: { email: { equals: userEmail.trim().toLowerCase(), mode: 'insensitive' } }
            });
            if (user) req.user = user;
        }
    } catch (error) {
        // Invalid/expired token on a public endpoint: stay anonymous.
        req.user = undefined;
    }
    next();
}
