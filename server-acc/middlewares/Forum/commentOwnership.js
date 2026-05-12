import prisma from "../../config/db.js";

export const checkCommentOwnership = async (req, res, next) => {
    const user = req.user;
    const commentId = parseInt(req.params.id);
    try {
        const comment = await prisma.comment.findUnique({
            where: {
                id: commentId,
            }
        })

        if(!comment){
            return res.status(404).json({
                success: false,
                message: "Comment not Found..."
            })
        }

        if(comment.userId === user.id){
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