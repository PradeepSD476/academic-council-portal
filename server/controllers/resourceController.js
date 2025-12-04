import prisma from '../config/db.js';

export const getResources = async (req, res) => {
    const { startPoint, courseId, resourceType } = req.query;
    if (startPoint < 1) {
        return res.status(400).json({
            success: false,
            message: "starting index must be greater than 0..."
        })
    }
    try {
        const results = await prisma.resource.findMany({
            skip: (startPoint - 1) * 3, 
            take: 5,
            where: {
                courseId: parseInt(courseId),
                resourceType: resourceType,
            },
            orderBy: {
                updatedAt: 'desc'
            }
        })
        console.log("Results", results)
        return res.status(200).json({
            success: true,
            message: "Successfully fetched resources...",
            resources: results,
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Failed to get Resources..."
        })
    }
}

export const addResource = async (req, res) => {
    const { title, description, fileUrl, resourceType, courseCode } = req.body;
    const userEmail = req.user.email;
    if (!title || !fileUrl || !resourceType || !courseCode) {
        return res.status(400).json({
            success: false,
            message: "Validation failed. Required fields are missing."
        })
    }

    try {
        const user = await prisma.user.findUnique({
            where: {
                email: userEmail
            }
        })
        if(!user){
            return res.status(401).json({
                success: false,
                message: "Unauthorized user..."
            })
        }
        const course = await prisma.course.findUnique({
            where: {
                courseCode: courseCode
            }
        })

        if (!course) {
            return res.status(404).json({
                success: true,
                message: "Course with such courseCode not found.."
            })
        }

        const resource = await prisma.resource.create({
            data: {
                title: title,
                description: description,
                fileURL: fileUrl,
                resourceType: resourceType,
                uploadedById: user.id,
                courseId: course.id,
            }
        })

        return res.status(201).json({
            success: true,
            message: "successfully added the resource...",
            data: resource
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error..."
        })
    }
}

export const deleteResource = async (req, res) => {
    const { resourceId } = req.body;
    try {
        const resource = await prisma.resource.findUnique({
            where: {
                id: resourceId,
            }
        })
        if (!resource) {
            return res.status(400).json({
                success: false,
                message: "Invalid Resource Id..",
            })
        }
        const deleteResource = await prisma.resource.delete({
            where: {
                id: resourceId,
            }
        })
        return res.status(200).json({
            success: true,
            message: "Successfully deleted the resource...",
            resource: resource
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to delete Resource..."
        })
    }
}

export const editResource = async (req, res) => {
    const { resourceId, newTitle, newDescription, newFileUrl, newResourceType, newCourseId } = req.body;
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
        const resource = await prisma.resource.update({ 
            where: {
                id: resourceId,
            },
            data: {
                title: newTitle,
                description: newDescription,
                fileURL: newFileUrl,
                resourceType: newResourceType,
                courseId: newCourseId,
                uploadedById: user.id
            }
        })
        return res.status(201).json({
            success: true,
            message: "Edited successfully...",
            data: resource
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to edit resource...",
        })
    }
}