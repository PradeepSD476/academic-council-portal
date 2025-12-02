import admin from '../config/firebaseAdmin.js';
export const checkAdmin = async (req, res, next) => {
    const idToken = req.headers.authorization?.split(' ')[1];
    if (!idToken) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized: Invalid idToken...",
        })
    }
    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const { role } = decodedToken;
        const allowedRoles = ['RESOURCE_ADMIN', 'ANNOUNCEMENT_ADMIN', 'SUPER_ADMIN']
        if(allowedRoles.includes(role)){
            next();
        }
        else{
            return res.status(403).json({
            success: false,
            message: "Access Denied: Insufficient Permissions..."
        })
        }
    } catch (error) {
        console.log(error);
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token..."
        })
    }
}