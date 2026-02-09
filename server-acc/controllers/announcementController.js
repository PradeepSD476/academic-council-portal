import dotenv from 'dotenv';
dotenv.config();
import prisma from '../config/db.js';
import { getPublicUrl } from '../utils/signedUrl.js';

export const getAnnouncements = async (req, res) => {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    const bucketName = process.env.MINIO_BUCKET_NAME;
    if (!page || !limit) {
        return res.status(400).json({
            success: false,
            error: "Bad Request",
            message: "Pagination parameters 'page' and 'limit' are required."
        })
    }
    if (page < 1 || limit < 1) {
        return res.status(422).json({
            success: false,
            error: "Unprocessable Entity",
            message: "Pagination parameters must be positive integers. 'page' and 'limit' must be 1 or greater."
        })
    }
    try {
        const results = await prisma.announcement.findMany({
            skip: (page - 1) * limit,
            take: limit,
            orderBy: {
                updatedAt: 'desc'
            },
            include: {
                uploadedBy: {
                    select: { displayName: true },
                },
            },
        })
        console.log(results);
        const resultWithUrls = await Promise.all(
            results.map(async (result) => {
                const publicUrl = await getPublicUrl({
                    bucketName: process.env.MINIO_BUCKET_NAME,
                    filePath: result.filePath,
                });
                return {
                    ...result,
                    fileURL: publicUrl,
                };
            }
            ));
        return res.status(200).json({
            success: true,
            message: "Data fetched Successfully",
            data: resultWithUrls,
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: "Internal Server Error",
            message: "Something went wrong. Please try again later."
        })
    }
}

export const addAnnouncement = async (req, res) => {
    const { title, description, filePath } = req.body;
    if (!title || !description) {
        return res.status(400).json({
            success: false,
            error: "BadRequest",
            message: "Validation failed. Required fields are missing."
        })
    }
    const user = req.user;
    try {
        const newAnnouncement = await prisma.announcement.create({
            data: {
                title: title,
                description: description,
                filePath: filePath || null,
                isFileAttached: !!filePath,
                uploadedById: user.id
            }
        })

        return res.status(201).json({
            success: true,
            message: "Successfully created Announcement...",
            announcement: newAnnouncement
        })
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: "ServerError",
            message: "Unable to create announcement due to a server error. Please try again."
        })
    }
}

export const deleteAnnouncement = async (req, res) => {
    const announcementId = req.params.id;
    if (!announcementId) {
        return res.status(400).json({
            success: false,
            error: "BadRequest",
            message: "Announcement ID is required."
        })
    }
    try {
        const announcement = await prisma.announcement.findUnique({
            where: {
                id: parseInt(announcementId),
            }
        })
        if (!announcement) {
            return res.status(404).json({
                success: false,
                error: "NotFound",
                message: "Announcement not found."
            })
        }
        const deleteAnnouncement = await prisma.announcement.delete({
            where: {
                id: parseInt(announcementId),
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
            message: "Unable to delete announcement due to a server error. Please try again."
        })
    }
}

export const editAnnouncement = async (req, res) => {
    const announcementId = req.params.id;
    const updates = req.body;
    if (!announcementId) {
        return res.status(400).json({
            success: false,
            error: "BadRequest",
            message: "Announcement ID is required."
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
        const announcement = await prisma.announcement.findUnique({
            where: {
                id: parseInt(announcementId),
            }
        })
        if (!announcement) {
            return res.status(404).json({
                success: false,
                error: "NotFound",
                message: "Announcement not found."
            })
        }
        const updateAnnouncement = await prisma.announcement.update({
            where: {
                id: parseInt(announcementId),
            },
            data: updates
        })
        return res.status(201).json({
            success: true,
            message: "Announcement updated successfully."
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: "ServerError",
            message: "Unable to update announcement due to a server error. Please try again."
        })
    }
}