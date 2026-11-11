// Responds with 403 JSON directly. The existing checkCareerAdmin calls next(new Error(...)),
// which becomes a 500 because the app has no error-handling middleware.
export const CAREER_ADMIN_ROLES = ['CAREER_ADMIN', 'SUPER_ADMIN', 'FACULTY'];

export function isCareerAdmin(user) {
    return Boolean(user && CAREER_ADMIN_ROLES.includes(user.role));
}

export const requireCareerAdmin = (req, res, next) => {
    if (isCareerAdmin(req.user)) return next();
    return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'Career admin access is required.',
    });
};
