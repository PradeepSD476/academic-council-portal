export const checkAnnouncementAdmin = async (req, res, next) => {
    const user = req.user;
    try {
        const role = user.role;
        const allowedRoles = ['ANNOUNCEMENT_ADMIN', 'SUPER_ADMIN']
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
        console.error(error);
        return res.status(500).json({
            success: false,
            error: "AccessServiceError",
            message: "Unable to verify Access due to a server error. Please try again."
        });
    }
}