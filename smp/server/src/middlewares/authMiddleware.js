import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';

export const protect = async (req, res, next) => {
    let token = req.cookies.jwt;

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_67');
            const user = await prisma.user.findUnique({
                where: { id: decoded.id },
                include: { response: true }
            });

            if (!user) return res.status(401).json({ message: 'User not found' });

            req.user = user;
            return next();
        } catch (error) {
            return res.status(401).json({ message: 'Invalid token' });
        }
    } else {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

export const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'ADMIN') {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as an admin' });
    }
};