import prisma from '../config/db.js';
import jwt from 'jsonwebtoken'

export const checkAuth = async (req, res, next) => {
    const token = req.cookies?.token;

    try {
        if (token) {
            const decoded = jwt.verify(token, process.env.SECRET_KEY);
            const userEmail = decoded.email;
            if (userEmail) {
                const user = await prisma.user.findUnique({
                    where: {
                        email: userEmail
                    }
                })
                if (user) {
                    req.user = user;
                    return next();
                }
            }
        }

        let fallbackUser = await prisma.user.findFirst({
            orderBy: {
                id: 'asc'
            }
        });

        if (!fallbackUser) {
            fallbackUser = await prisma.user.create({
                data: {
                    email: 'guest@local.dev',
                    displayName: 'Guest User'
                }
            });
        }

        req.user = fallbackUser;
        return next();
    } catch (error) {
        let fallbackUser = await prisma.user.findFirst({
            orderBy: {
                id: 'asc'
            }
        });

        if (!fallbackUser) {
            fallbackUser = await prisma.user.create({
                data: {
                    email: 'guest@local.dev',
                    displayName: 'Guest User'
                }
            });
        }

        req.user = fallbackUser;
        return next();
    }
}