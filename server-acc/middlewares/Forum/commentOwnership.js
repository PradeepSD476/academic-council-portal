import prisma from "../../config/db.js";

export const checkCommentOwnership = async (req, res, next) => {
    try {

        const commentId = parseInt(req.params.id);

        const comment = await prisma.comment.findUnique({
            where: {
                id: commentId,
            }
        });

        if (!comment) {
            return res.status(404).json({
                success: false,
                message: "Comment not found..."
            });
        }

        if (comment.userId === req.user.id) {
            return next();
        }

        return next(new Error("FORBIDDEN"));

    } catch (error) {
        return next(error);
    }
};