import prisma from '../config/db.js';

export const getAnnouncements = async (req, res) => {
    const startPoint = req.query.startPoint || 1
    if (startPoint < 1) {
        return res.status(400).json({
            success: false,
            message: "starting index must be greater than 0..."
        })
    }
    try {
        const results = await prisma.announcement.findMany({
            skip: (startPoint - 1) * 5, 
            take: 5,
            orderBy: {
                updatedAt: 'desc'
            }
        })
        return res.status(200).json({
            success: true,
            message: "Successfully fetched announcements...",
            announcements: results,
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to get Announcements..."
        })
    }
}

export const addAnnouncement = async (req, res) => {
    const { title, description, fileURL } = req.body;
    const userEmail = req.user.email;
    try {
        const user = await prisma.user.findUnique({
            where: {
                email: userEmail
            },
            select: {
                id: true
            }
        })
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "UnAuthorized User..."
            })
        }
        const newAnnouncement = await prisma.announcement.create({
            data: {
                title: title,
                description: description,
                fileURL: fileURL || null,
                isFileAttached: !!fileURL,
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
        return res.status(403).json({
            success: false,
            message: "Failed to create Announcement"
        })
    }
}

export const deleteAnnouncement = async (req, res) => {
    const { announcementId } = req.body;
    try {
        console.log("Guy 1 is working...")
        const announcement = await prisma.announcement.findUnique({
            where: {
                id: announcementId,
            }
        })
        console.log("Guy 2 is working...", announcement)
        if (!announcement) {
            return res.status(400).json({
                success: false,
                message: "Invalid Announcement Id..",
            })
        }
        const deleteAnnouncement = await prisma.announcement.delete({
            where: {
                id: announcementId,
            }
        })
        return res.status(200).json({
            success: true,
            message: "Successfully deleted the announcement",
            announcement: announcement
        })
    } catch (error) {
        return res.status(403).json({
            success: false,
            message: "Failed to delete Announcement"
        })
    }
}

export const editAnnouncement = async (req, res) => {
    const { announcementId, newTitle, newDescription, newFileUrl } = req.body;
    const userEmail = req.user.email;
    try {
        const user = await prisma.user.findUnique({
            where: {
                email: userEmail
            },
            select: {
                id: true
            }
        })
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "UnAuthorized User"
            })
        }
        const announcement = await prisma.announcement.update({ 
            where: {
                id: announcementId,
            },
            data: {
                title: newTitle,
                description: newDescription,
                fileURL: newFileUrl
            }
        })
        return res.status(201).json({
            success: true,
            message: "Edited successfully...",
            data: announcement
        })
    } catch (error) {
        return res.status(403).json({
            success: false,
            message: "Failed to edit announcement...",
        })
    }
}