// Same formula as middlewares/Forum/addPost.js: the academic year starts in July
// (Date#getMonth is 0-indexed, so 6 = July). Kept identical so both features agree on a
// student's year.

export function academicYearStart(now = new Date()) {
    return now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
}

// 1 = first year. Returns null when admissionYear is unknown, so callers can't mistake
// "unknown" for a real year.
export function currentAcademicYear(admissionYear, now = new Date()) {
    if (!Number.isInteger(admissionYear)) return null;
    return academicYearStart(now) - admissionYear + 1;
}
