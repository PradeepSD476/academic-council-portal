import { DOUBT_ADMIN_ROLES } from '../controllers/doubtController.js';

// Moderators of the doubt forum (ACC Wiki). Must run after checkAuth.
export const checkDoubtAdmin = async (req, res, next) => {
    if (DOUBT_ADMIN_ROLES.includes(req.user?.role)) {
        return next();
    }
    return res.status(403).json({
        success: false,
        message: "Access Denied: Insufficient Permissions..."
    });
};
