import admin from '../config/firebaseAdmin.js';
export const checkAuth = async (req, res, next) => {
    const idToken = req.headers.authorization?.split(' ')[1];
    if (!idToken) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized: Invalid idToken...",
        })
    }
    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const userEmail = decodedToken.email;
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