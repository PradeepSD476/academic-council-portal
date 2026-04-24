import prisma from "../config/db.js"
export const dashboardData = async (req, res) => {
    try {
        const userCount = await prisma.user.count();
        const courseCount = await prisma.course.count();
        const resourceCount = await prisma.resource.count();
        const announcementCount = await prisma.announcement.count();
        const liveUserCount = await prisma.user.count({
            where: {
                lastseen: {
                    gt: new Date(Date.now() - 60*1000)
                }
            }
        })

        const countData = { userCount, courseCount, resourceCount, announcementCount, liveUserCount }
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

export const resourceCount = async (req, res) => {
    const courseId = req.params.id;
    try {
        const counts = await prisma.resource.groupBy({
            by: ['resourceType'],
            _count: {
                _all: true,
            },
            where: {
                courseId: parseInt(courseId)
            }
        });

        const countMap = counts.reduce((acc, item) => {
            acc[item.resourceType] = item._count._all;
            return acc;
        }, {});

        console.log("countMap", countMap);


        return res.status(200).json({
            success: true,
            message: "Data fetched Successfully...",
            data: countMap
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