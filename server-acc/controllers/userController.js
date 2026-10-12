import prisma from '../config/db.js';

export const getUsers = async (req, res) => {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    const search = req.query.search?.trim() || "";
    const onlineOnly = req.query.online === 'true';
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
    const whereClause = {};

    if (search) {
        whereClause.OR = [
            { displayName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { branchName: { contains: search, mode: 'insensitive' } },
            { rollNo: { contains: search, mode: 'insensitive' } },
        ];
    }

    if (onlineOnly) {
        whereClause.lastseen = { gt: new Date(Date.now() - 60 * 1000) };
    }

    const results = await prisma.user.findMany({
    where: whereClause,
    skip: (page - 1) * limit,
    take: limit,
    orderBy: [
        {
            branchName: 'asc'
        },
        {
            id: 'asc'
        }
    ]
});
        return res.status(200).json({
            success: true,
            message: "Data fetched Successfully",
            data: results,
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: "Internal Server Error",
            message: "Something went wrong. Please try again later."
        })
    }
}

export const changeRole = async (req, res) => {
    const userId = req.params.id;
    const { newRole } = req.query;
    if (!userId || !newRole) {
        return res.status(400).json({
            success: false,
            error: "BadRequest",
            message: "Validation failed. Required fields are missing."
        })
    }
    const myRole = req.user.role;
    try {
        const person = await prisma.user.findUnique({
            where: {
                id: parseInt(userId),
            }
        })
        if (!person) {
            return res.status(404).json({
                success: false,
                error: "NotFound",
                message: "User not found."
            })
        }
        if ((myRole === 'ANNOUNCEMENT_ADMIN' && person.role !== 'STUDENT') ||
            (myRole === 'RESOURCE_ADMIN' && person.role !== 'STUDENT')) {
            return res.status(403).json({
                success: false,
                message: "Access Denied: Insufficient Permissions..."
            })
        }
        const changedRole = await prisma.user.update({
            where: {
                id: parseInt(userId),
            },
            data: {
                role: newRole
            }
        })
        return res.status(200).json({
            success: true,
            message: "User updated successfully."
        })
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: "ServerError",
            message: "Unable to change role due to a server error. Please try again."
        })
    }
}

export const getMe = async (req, res) => {
    const user = req.user;
    try {
        return res.status(200).json({
            success: true,
            message: "My Details Fetched Successfully...",
            data: user
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            error: "ServerError",
            message: "Unable to fetch user details due to a server error. Please try again."
        })
    }
}
