import prisma from '../config/db.js';

export const getMyCourses = async (req, res) => {
    const user = req.user;
    
    try {
        const currentMonth = new Date().getMonth();
        const currentCalendarYear = new Date().getFullYear();
        const academicYearStart = (currentMonth >= 6) ? currentCalendarYear : currentCalendarYear - 1;
        const currentAcademicYear = academicYearStart - user.admissionYear + 1;

        
        
        if (currentAcademicYear < 1) {
            return res.status(422).json({
                success: false,
                error: "InvalidAcademicYear",
                message: "Academic Year is invalid."
            });
        }
        const courses = await prisma.course.findMany({
            where: {
                academicYear: currentAcademicYear,
                program: user.program,
                allowedBranch: {
                    has: user.branchName
                }
            },
            select: {
                id: true,
                courseCode: true,
                name: true,
                description: true,
                instructor: true,
                credits: true,
            },
            orderBy: {
                courseCode: 'asc',
            },
        })

        return res.status(200).json({
            success: true,
            message: "Data fetched Successfully",
            data: courses,
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: "Internal Server Error",
            message: "Something went wrong. Please try again later."
        })
    }
}

export const addCourse = async (req, res) => {
    const { courseCode, name, description, allowedBranches, academicYear, program, instructor, credits } = req.body;
    if (!courseCode || !name || !allowedBranches || !academicYear || !program || !credits || !instructor) {
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
        if (course) {
            return res.status(409).json({
                success: false,
                error: "AlreadyExists",
                message: "A record with this Course Code already exists."
            });
        }
        const addedCourse = await prisma.course.create({
            data: {
                courseCode: courseCode,
                name: name,
                description: description,
                allowedBranch: allowedBranches,
                academicYear: academicYear,
                program: program,
                instructor: instructor,
                credits: credits
            },
        })
        return res.status(201).json({
            success: true,
            message: "Course Added Successfully..",
            addedCourse: addedCourse
        })

    } catch (err) {
        console.log("Error....", err);
        return res.status(500).json({ error: 'Failed to add course...' });
    }
}

export const deleteCourse = async (req, res) => {
    const courseId = req.params.id;
    if (!courseId) {
        return res.status(400).json({
            success: false,
            error: "BadRequest",
            message: "Course ID is required."
        })
    }
    try {
        const course = await prisma.course.findUnique({
            where: {
                id: parseInt(courseId),
            }
        })
        if (!course) {
            return res.status(404).json({
                success: false,
                error: "NotFound",
                message: "Course not found."
            })
        }
        const deleteCourse = await prisma.course.delete({
            where: {
                id: parseInt(courseId),
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
            message: "Unable to delete course due to a server error. Please try again."
        })
    }
}

export const editCourse = async (req, res) => {
    const courseId = req.params.id;
    const updates = req.body;
    if (!courseId) {
        return res.status(400).json({
            success: false,
            error: "BadRequest",
            message: "Course ID is required."
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
        const course = await prisma.course.findUnique({
            where: {
                id: parseInt(courseId),
            }
        })
        if (!course) {
            return res.status(404).json({
                success: false,
                error: "NotFound",
                message: "Announcement not found."
            })
        }
        const updateCourse = await prisma.course.update({
            where: {
                id: parseInt(courseId),
            },
            data: updates
        })
        return res.status(201).json({
            success: true,
            message: "Course updated successfully."
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: "ServerError",
            message: "Unable to Update Course due to a server error. Please try again."
        })
    }
}