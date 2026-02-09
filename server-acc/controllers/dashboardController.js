import prisma from "../config/db.js"
export const dashboardData = async (req, res) => {
    try {
        const userCount = await prisma.user.count();
        const courseCount = await prisma.course.count();
        const resourceCount = await prisma.resource.count();
        const announcementCount = await prisma.announcement.count();

        const countData = { userCount, courseCount, resourceCount, announcementCount }
        return res.status(200).json({
            success: true,
            message: "Data fetched Successfully...",
            data: countData
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