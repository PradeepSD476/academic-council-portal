export const addPostEligibility = async (req, res, next) => {
    try {

        const currentMonth = new Date().getMonth();
        const currentCalendarYear = new Date().getFullYear();

        const academicYearStart =
            currentMonth >= 6
                ? currentCalendarYear
                : currentCalendarYear - 1;

        const currentAcademicYear =
            academicYearStart - req.user.admissionYear + 1;

        if (currentAcademicYear > 2) {
            return next();
        }

        return next(new Error("FORBIDDEN"));

    } catch (error) {
        return next(error);
    }
};