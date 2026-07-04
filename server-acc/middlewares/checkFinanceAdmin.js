export const checkFinanceAdmin = async (req, res, next) => {
    try {
        if (!req.user || !req.user.role) {
            return res.status(401).json({ message: 'Unauthorized access. User not found.' });
        }

        const allowedRoles = [
            'FINANCE_ADMIN',
            'SUPER_ADMIN'
        ];

        if (allowedRoles.includes(req.user.role)) {
            next();
        } else {
            return res.status(403).json({ message: 'Access denied. You do not have permission to perform this action.' });
        }
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error.', error: error.message });
    }
};
