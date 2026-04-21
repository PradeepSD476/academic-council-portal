import dotenv from 'dotenv';
dotenv.config();
import prisma from '../config/db.js';

export const getAllPosts = async (req, res) => {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);

    const commentOffset = parseInt(req.query.commentOffset);
    const commentLimit = parseInt(req.query.commentLimit);

    try {
        const result = await prisma.experience.findMany({
            skip: (page - 1) * limit,
            take: limit,
            orderBy: {
                updatedAt: 'desc'
            },
            include: {
                comments: {
                    where: {
                        parentId: null,
                    },
                    skip: (commentOffset - 1)*commentLimit,
                    take: commentLimit,
                    orderBy: {
                        updatedAt: 'desc'
                    },
                    include: {
                        replies: true,
                    }
                },
                _like_count: {
                    select: { likes : true },
                }
            }
        })

        return res.status(200).json({
            success: true,
            message: "Data fetched Successfully",
            data: result,
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            error: "Internal Server Error",
            message: "Something went wrong. Please try again later."
        })
    }
}

export const getMyPosts = async (req, res) => {
    const userId = req.user.id;

    try {
        const result = await prisma.experience.findMany({
            where: {
                uploadedById: userId,
            }
        })

        return res.status(200).json({
            success: true,
            message: "Data Fetched Successfully",
            data: result,
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            error: "Internal Server Error",
            message: "Something went wrong. Please try again later."
        })
    }
}


export const addpost = async (req, res) => {
    const { title, description, status, experienceType } = req.body;
    const user = req.user;
    if (!title || !description) {
        return res.status(400).json({
            success: false,
            error: "BadRequest",
            message: "Validation failed. Required fields are missing."
        })
    }
    try {
        const experience = await prisma.experience.create({
            data: {
                title: title,
                description: description,
                status: status,
                experienceType: experienceType,
                uploadedById: user.id
            }
        })

        return res.status(201).json({
            success: true,
            message: "Successfully Created Post.",
            data: experience
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            error: "ServerError",
            message: "Unable to create post due to a server error. Please try again."
        })
    }
}

export const deletePost = async (req, res) => {
    const postId = req.params.id;
    if (!postId) {
        return res.status(400).json({
            success: false,
            error: "BadRequest",
            message: "Post ID is required."
        })
    }
    try {
        const post = await prisma.experience.findUnique({
            where: {
                id: parseInt(postId),
            }
        })
        if (!post) {
            return res.status(404).json({
                success: false,
                error: "NotFound",
                message: "post not found."
            })
        }
        const deletePost = await prisma.experience.delete({
            where: {
                id: parseInt(postId),
            }
        })
        return res.status(200).json({
            success: true,
            message: "Content deleted successfully."
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: "ServerError",
            message: "Unable to delete post due to a server error. Please try again."
        })
    }
}

export const editPost = async (req, res) => {
    const postId = req.params.id;
    const updates = req.body;
    if (!postId) {
        return res.status(400).json({
            success: false,
            error: "BadRequest",
            message: "Post ID is required."
        })
    }
    if (!updates) {
        return res.status(400).json({
            success: false,
            error: "BadRequest",
            message: "No update fields provided."
        })
    }
    try {
        const post = await prisma.experience.findUnique({
            where: {
                id: parseInt(postId),
            }
        })
        if (!post) {
            return res.status(404).json({
                success: false,
                error: "NotFound",
                message: "post not found."
            })
        }
        const updatePost = await prisma.experience.update({
            where: {
                id: parseInt(postId),
            },
            data: updates
        })
        return res.status(201).json({
            success: true,
            message: "post updated successfully.",
            data: updatePost
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: "ServerError",
            message: "Unable to update post due to a server error. Please try again."
        })
    }
}

export const addComment = async (req, res) => {
    const user = req.user;
    const { content, postId, parentId } = req.body;

    if (!postId || !content) {
        return res.status(400).json({
            success: false,
            error: "BadRequest",
            message: "Miising required fields."
        })
    }

    try {
        const post = await prisma.experience.findUnique({
            where: {
                id: postId
            }
        })
        if (!post) {
            return res.status(404).json({
                success: false,
                error: "NotFound",
                message: "post not found."
            })
        }
        if (!parentId) {
            await prisma.$transaction(async (tx) => {
                const comment = await tx.comment.create({
                    data: {
                        content: content,
                        postId: postId,
                        userId: user.id
                    }
                })
                await tx.comment.update({
                    where: {
                        id: comment.id,
                    },
                    data: { rootId: comment.id }
                })
            });
        } else {
            const comment = await prisma.comment.findUnique({
                where: {
                    id: parentId
                }
            })
            if (!comment) {
                return res.status(404).json({
                    success: false,
                    error: "NotFound",
                    message: "comment not found."
                })
            }
            await prisma.comment.create({
                data: {
                    content: content,
                    postId: postId,
                    userId: user.id,
                    parentId: parentId,
                    rootId: parentId,
                }
            })
        }

        return res.status(201).json({
            success: true,
            message: "comment added successfully."
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            error: "ServerError",
            message: "Unable to comment due to a server error. Please try again."
        })
    }
}

export const deleteComment = async (req, res) => {
    const commentId = req.params.id;
    try {
        await prisma.comment.delete({
            where: {
                id: commentId
            }
        })

        return res.status(200).json({
            success: true,
            message: "Comment Deleted Successfully."
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            error: "ServerError",
            message: "Unable to comment due to a server error. Please try again."
        })
    }
}

export const likePost = async (req, res) => {
    const postId = req.params.id;
    const userId = req.user.id;
    if (!postId) {
        return res.status(400).json({
            success: false,
            error: "BadRequest",
            message: "Missing required fields."
        })
    }

    try {
        const post = await prisma.experience.findUnique({
            where: {
                id: postId,
            }
        })
        if (!post) {
            return res.status(404).json({
                success: false,
                error: "NotFound",
                message: "post not found."
            })
        }

        await prisma.like.create({
            data: {
                postId: postId,
                userId: userId,
            }
        })

        return res.status(200).json({
            success: true,
            message: "Like added."
        })

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            error: "ServerError",
            message: "Unable to comment due to a server error. Please try again."
        })
    }
}