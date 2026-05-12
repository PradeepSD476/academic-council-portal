import prisma from "../../config/db.js";

export const checkPostOwnership = async (req, res, next) => {
    try {

        const post = await prisma.experience.findUnique({
            where: {
                id: parseInt(req.params.id)
            }
        });

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found..."
            });
        }

        if (post.uploadedById === req.user.id) {
            return next();
        }

        return next(new Error("FORBIDDEN"));

    } catch (error) {
        return next(error);
    }
};