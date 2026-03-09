export const checkResourceAdmin = async (req, res, next) => {
    const user = req.user;
    try {
        console.log("CHECKPOINT", user)
        const role = user.role;
        console.log("CHECKPOINT", role)
        const allowedRoles = ['RESOURCE_ADMIN', 'SUPER_ADMIN', 'FACULTY']
        if(allowedRoles.includes(role)){
            next();
        }
        else{
            return res.status(403).json({
            success: false,
            message: "Access Denied: Insufficient Permissions..."
        })}
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            error: "AccessServiceError",
            message: "Unable to verify Access due to a server error. Please try again."
        });
    }
}