import dotenv from 'dotenv';
dotenv.config();
import prisma from '../config/db.js';
import notifyOnNewPost from '../utils/mail/sendExperiencePost.js';
import sendCommentNotification from '../utils/mail/sendCommentNotification.js';
import sendReplyNotification from '../utils/mail/sendReplyNotification.js';

// Public endpoint: returns posts by status (default: PUBLISHED) with server-side pagination
export const getAllPosts = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status || 'PUBLISHED';
    const domain = req.query.domain;

    const whereClause = status === 'ALL' ? {} : { status: status };
    if (domain && domain !== 'All') {
        if (domain === 'Uncategorized') {
            whereClause.OR = [
                { domain: null },
                { domain: '' }
            ];
        } else if (domain === 'Other') {
            whereClause.domain = 'Other';
        } else {
            whereClause.domain = domain;
        }
    }

    try {
        const [result, total] = await Promise.all([
            prisma.experience.findMany({
                skip: (page - 1) * limit,
                take: limit,
                where: whereClause,
                orderBy: {
                    updatedAt: 'desc'
                },
                include: {
                    uploadedBy: {
                        select: { id: true, displayName: true }
                    },
                    likes: {
                        select: { userId: true }
                    },
                    _count: {
                        select: { likes: true, comments: true },
                    }
                }
            }),
            prisma.experience.count({
                where: whereClause
            })
        ]);

        return res.status(200).json({
            success: true,
            message: "Data fetched Successfully",
            data: result,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
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



// export const getMyPosts = async (req, res) => {
//     const userId = req.user.id;

//     try {
//         const result = await prisma.experience.findMany({
//             where: {
//                 uploadedById: userId,
//             }
//         })

//         return res.status(200).json({
//             success: true,
//             message: "Data Fetched Successfully",
//             data: result,
//         })
//     } catch (error) {
//         console.log(error);
//         return res.status(500).json({
//             success: false,
//             error: "Internal Server Error",
//             message: "Something went wrong. Please try again later."
//         })
//     }
// }


export const addpost = async (req, res) => {
    const { title, description, status, experienceType, domain } = req.body;
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
                domain: domain,
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
    const postId = parseInt(req.params.id);
    const user = req.user;

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
                id: postId,
            }
        })

        if (!post) {
            return res.status(404).json({
                success: false,
                error: "NotFound",
                message: "Post not found."
            })
        }

        await prisma.experience.delete({
            where: {
                id: postId,
            }
        })

        return res.status(200).json({
            success: true,
            message: "Post deleted successfully."
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            error: "ServerError",
            message: "Unable to delete post due to a server error. Please try again."
        })
    }
}

export const editPost = async (req, res) => {
    const postId = req.params.id;
    const user = req.user;
    const { title, description, experienceType, status, domain } = req.body;
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
            },
            include: {
                    uploadedBy: {
                        select: { id: true, displayName: true }
                    },
            },
        })
        if (!post) {
            return res.status(404).json({
                success: false,
                error: "NotFound",
                message: "post not found."
            })
        }
        const updatedPost = await prisma.experience.update({
            where: {
                id: parseInt(postId),
            },
            data: {
                title,
                description,
                experienceType,
                status,
                domain
            }
        })

        if(status === "PUBLISHED"){
            notifyOnNewPost({ displayName: post.uploadedBy.displayName, experienceTitle: title, experienceType: experienceType })
        }

        return res.status(201).json({
            success: true,
            message: "post updated successfully.",
            data: updatedPost
        })
    } catch (error) {
        console.error(error)
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
            },
            include:{
                uploadedBy:true
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
            await sendCommentNotification({
                to: post.uploadedBy.email,
                postAuthorName: post.uploadedBy.displayName,
                commenterName: user.displayName,
                postTitle: post.title,
            });
        } else {
            const comment = await prisma.comment.findUnique({
                where: {
                    id: parentId
                },
                include:{
                    user:true
                }
            })
            if (!comment) {
                return res.status(404).json({
                    success: false,
                    error: "NotFound",
                    message: "comment not found."
                })
            }
            if (parentId !== comment.rootId) {
                return res.status(400).json({
                    success: false,
                    message: "You can't reply to this comment."
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
            await sendReplyNotification({
                to: comment.user.email,
                commentAuthorName: comment.user.displayName,
                replierName: user.displayName,
                postTitle: post.title,
            });
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

export const getComments = async (req, res) => {
    const postId = parseInt(req.params.id);
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    const parentId = parseInt(req.query.parentId);

    if (!postId) {
        return res.status(400).json({
            success: false,
            message: "Bad Request, Missing Required Fields."
        })
    }

    try {
        const post = await prisma.experience.findUnique({
            where: {
                id: postId,
            }
        });

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not Found."
            })
        }

        if (parentId) {
            const replies = await prisma.comment.findMany({
                where: {
                    parentId: parentId,
                },
                orderBy: {
                    updatedAt: "asc"
                },
                include: {
                    user: {
                        select: { id: true, displayName: true }
                    }
                }
            })
            
            return res.status(200).json({
                success: true,
                message: "Replies fetched successfully",
                data: replies,
            })

        }

        const comments = await prisma.comment.findMany({
            skip: (page - 1) * limit,
            take: limit,
            where: {
                postId: postId,
                parentId: null,
            },
            orderBy: {
                updatedAt: "desc"
            },
            include: {
                user: {
                    select: { id: true, displayName: true }
                },
                _count: {
                    select: { replies: true }
                }
            }
        })

        return res.status(200).json({
            success: true,
            message: "Comments fetched successfully.",
            data: comments,
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error."
        })
    }
}

export const deleteComment = async (req, res) => {
    const commentId = parseInt(req.params.id);
    const userId = req.user.id;

    if (!commentId) {
        return res.status(400).json({
            success: false,
            error: "BadRequest",
            message: "Comment ID is required."
        })
    }

    try {
        const comment = await prisma.comment.findUnique({
            where: { id: commentId }
        });

        if (!comment) {
            return res.status(404).json({
                success: false,
                error: "NotFound",
                message: "Comment not found."
            })
        }

        if (comment.userId !== userId) {
            return res.status(403).json({
                success: false,
                error: "Forbidden",
                message: "You can only delete your own comments."
            })
        }

        await prisma.comment.delete({
            where: { id: commentId }
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
            message: "Unable to delete comment due to a server error. Please try again."
        })
    }
}

export const togglePostLike = async (req, res) => {
    const postId = parseInt(req.params.id);
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
        const count = await prisma.$transaction(async (tx) => {
            const isLiked = await tx.like.findUnique({
                where: {
                    userId_postId: {
                        postId: postId,
                        userId: userId,
                    }
                }
            });

            if (isLiked) {
                await tx.like.delete({
                    where: { id: isLiked.id }
                });
            } else {
                await tx.like.create({
                    data: {
                        postId: postId,
                        userId: userId,
                    }
                });
            }

            // Return the updated like count
            return tx.like.count({ where: { postId: postId } });
        });

        return res.status(200).json({
            success: true,
            message: "Like toggled.",
            likesCount: count
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            error: "ServerError",
            message: "Unable to toggle like due to a server error. Please try again."
        });
    }
}