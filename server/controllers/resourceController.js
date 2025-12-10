import dotenv from 'dotenv';
dotenv.config();
import prisma from '../config/db.js';

export const getResources = async (req, res) => {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    const courseId = parseInt(req.query.courseId);
    const resourceType = req.query.resourceType;
    const bucketName = process.env.GCS_BUCKET_NAME;
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
        const results = await prisma.resource.findMany({
            skip: (page - 1) * limit,
            take: limit,
            where: {
                courseId: parseInt(courseId),
                resourceType: resourceType,
            },
            orderBy: {
                updatedAt: 'desc'
            }
        })
        const resultWithUrls = results.map(result => ({
            ...result,
            fileURL: `https://storage.googleapis.com/${bucketName}/${result.filePath}`
        }))
        return res.status(200).json({
            success: true,
            message: "Data fetched Successfully",
            data: resultWithUrls,
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

export const addResource = async (req, res) => {
    const { title, description, filePath, resourceType, courseCode } = req.body;
    const user = req.user;
    if (!title || !filePath || !resourceType || !courseCode) {
        return res.status(400).json({
            success: false,
            error: "BadRequest",
            message: "Validation failed. Required fields are missing."
        })
    }
    try {
        const course = await prisma.course.findUnique({
            where: {
                courseCode: courseCode
            }
        })

        if (!course) {
            return res.status(404).json({
                success: false,
                error: "NotFound",
                message: "Course not found."
            })
        }

        const resource = await prisma.resource.create({
            data: {
                title: title,
                description: description,
                filePath: filePath,
                resourceType: resourceType,
                uploadedById: user.id,
                courseId: course.id,
            }
        })

        return res.status(201).json({
            success: true,
            message: "Successfully Created Resource.",
            data: resource
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: "ServerError",
            message: "Unable to create resource due to a server error. Please try again."
        })
    }
}

export const deleteResource = async (req, res) => {
    const resourceId = req.params.id;
    if (!resourceId) {
        return res.status(400).json({
            success: false,
            error: "BadRequest",
            message: "Resource ID is required."
        })
    }
    try {
        const resource = await prisma.resource.findUnique({
            where: {
                id: parseInt(resourceId),
            }
        })
        if (!resource) {
            return res.status(404).json({
                success: false,
                error: "NotFound",
                message: "resource not found."
            })
        }
        const deleteResource = await prisma.resource.delete({
            where: {
                id: parseInt(resourceId),
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
            message: "Unable to delete resource due to a server error. Please try again."
        })
    }
}

export const editResource = async (req, res) => {
    const resourceId = req.params.id;
    const updates = req.body;
    if (!resourceId) {
        return res.status(400).json({
            success: false,
            error: "BadRequest",
            message: "Resource ID is required."
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
        const resource = await prisma.resource.findUnique({
            where: {
                id: parseInt(resourceId),
            }
        })
        if (!resource) {
            return res.status(404).json({
                success: false,
                error: "NotFound",
                message: "Resource not found."
            })
        }
        const updateResource = await prisma.resource.update({
            where: {
                id: parseInt(resourceId),
            },
            data: updates
        })
        return res.status(201).json({
            success: true,
            message: "Resource updated successfully.",
            data: updateResource
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: "ServerError",
            message: "Unable to update resource due to a server error. Please try again."
        })
    }
}