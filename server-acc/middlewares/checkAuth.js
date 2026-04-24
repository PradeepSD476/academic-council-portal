import prisma from '../config/db.js';
import jwt from 'jsonwebtoken'
export const checkAuth = async (req, res, next) => {
    const token = req.cookies.token;
    console.log("token",token)

    if(!token){
        return res.status(401).json({
            success: false,
            error: "UNAUTHORISED",
            message: "Not Authenticated, Login Required..."
        })
    }
    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        const userEmail = decoded.email;
        if (!userEmail) {
            return res.status(400).json({
                success: false,
                error: "Bad Request",
                message: "Token does not contain a valid email address."
            })
        }
        const user = await prisma.user.findUnique({
            where: {
                email: userEmail
            }
        })
        if (!user) {
            return res.status(404).json({
                success: false,
                error: "User Not Found",
                message: "No user account found for the provided token."
            })
        }
        await prisma.user.update({
            where:{
                id: user.id,
            },
            data: {
                lastseen: new Date(),
            }
        })
        req.user = user;
        next();
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            error: "AuthenticationServiceError",
            message: "Unable to verify authentication token due to a server error. Please try again."
        });
    }

}