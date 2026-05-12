export const checkCareerAdmin = async (req, res, next) => {
    try {

        const allowedRoles = [
            'CAREER_ADMIN',
            'SUPER_ADMIN',
            'FACULTY'
        ];

        if (allowedRoles.includes(req.user.role)) {
            return next();
        }

        return next(new Error("FORBIDDEN"));

    } catch (error) {
        return next(error);
    }
};