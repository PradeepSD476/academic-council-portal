import prisma from '../config/db.js';

export const getMyCourses = async (req, res) => {
    const userEmail = req.user?.email;
    try {
        if (!userEmail) {
            return res.status(401).json({
                success: false,
                message: "Authentication Required"
            })
        }
        const user = await prisma.user.findUnique({
            where: {
                email: userEmail,
            },
            select: {
                branchName: true,
                admissionYear: true,
                program: true
            }
        })
        if (!user || !user.branchName || !user.admissionYear || !user.program) {
            return res.status(401).json({
                success: false,
                message: "Insufficient Data..."
            })
        }
        const currentMonth = new Date().getMonth();
        const currentCalendarYear = new Date().getFullYear();
        const academicYearStart = (currentMonth >= 6) ? currentCalendarYear : currentCalendarYear - 1;
        const currentAcademicYear = academicYearStart - user.admissionYear + 1;

        if (currentAcademicYear < 1) {
            console.warn(`Calculated invalid academic year ${currentAcademicYear} for user ${userEmail}`);
            return res.status(400).json({ error: 'Could not determine valid academic year.' });
        }
        const courses = await prisma.course.findMany({
            where: {
                branchName: user.branchName,
                academicYear: currentAcademicYear,
                program: user.program
            },
            select: {
                id: true,
                courseCode: true,
                name: true,
                description: true
            },
            orderBy: {
                courseCode: 'asc',
            },
        })
        res.status(200).json(courses);
    } catch (error) {
        console.error('Error fetching user courses:', error);
        res.status(500).json({ error: 'Failed to fetch courses.' });
    }
}

export const addCourse = async (req, res) => {
    const { courseCode, name, description, branchName, academicYear, program } = req.body;
    if(!courseCode || !name || !description || !branchName || !academicYear || !program){
        return res.status(400).json({
            success: false,
            message: "Missing Course Details..."
        })
    }
    try {
        const course = await prisma.course.findUnique({
            where: {
                courseCode: courseCode,
                academicYear: academicYear,
                program: program,
                branchName: branchName
            }
        })
        if (course) {
            return res.status(401).json({
                success: false,
                message: "Course Already Exists."
            })
        }
        const addedCourse = await prisma.course.create({
            data: {
                courseCode: courseCode,
                name: name,
                description: description,
                branchName: branchName,
                academicYear: academicYear,
                program: program
            },
        })
        return res.status(200).json({
            success: true,
            message: "Course Added Successfully..",
            addedCourse: addedCourse
        })

    } catch (err) {
        console.log("Error....", err);
        return res.status(500).json({ error: 'Failed to add course.' });
    }
}