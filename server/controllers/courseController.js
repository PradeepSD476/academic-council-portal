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
        // console.log(user);
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

        // console.log(courses);
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
    const { courseCode, name, description, allowedBranches, academicYear, program } = req.body;
    if (!courseCode || !name || !allowedBranches || !academicYear || !program) {
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
                program: program
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