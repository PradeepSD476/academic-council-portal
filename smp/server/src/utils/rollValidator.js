/**
 * SMP Roll Number and Email Validator Utility
 * Enforces strict IIT Patna B.Tech / Dual-Degree rules and batch checks for SMP.
 */

export const SMP_ALLOWED_PROGRAM_CODES = {
    '01': 'BTECH',
    '02': 'BTECH+MTECH',
    '03': 'BTECH+MBA',
};

export const SMP_BRANCH_MAP = {
    'CS': 'Computer Science & Engineering',
    'AI': 'Artificial Intelligence & Data Science',
    'MC': 'Mathematics & Computing',
    'MT': 'Mathematics & Computing',
    'EC': 'Electronics & Communication Engineering',
    'VL': 'Electronics & Communication Engineering',
    'EE': 'Electrical Engineering',
    'ME': 'Mechanical Engineering',
    'CE': 'Civil Engineering',
    'ST': 'Civil Engineering',
    'CB': 'Chemical & Biochemical Engineering',
    'CT': 'Chemical & Biochemical Engineering',
    'MM': 'Metallurgical & Materials Engineering',
    'PH': 'Engineering Physics',
    'EP': 'Engineering Physics',
    'ES': 'Earth & Environmental Sciences',
};

export const STANDARDIZED_BRANCHES = [
    'Computer Science & Engineering',
    'Artificial Intelligence & Data Science',
    'Mathematics & Computing',
    'Electronics & Communication Engineering',
    'Electrical Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Chemical & Biochemical Engineering',
    'Metallurgical & Materials Engineering',
    'Engineering Physics',
    'Earth & Environmental Sciences',
];

/**
 * Validates institute email format (@iitp.ac.in)
 */
export const validateInstituteEmail = (email) => {
    if (!email || typeof email !== 'string') {
        return { valid: false, message: 'Institute email is required.' };
    }
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.endsWith('@iitp.ac.in')) {
        return { valid: false, message: 'Only official @iitp.ac.in email addresses are permitted.' };
    }
    return { valid: true, email: cleanEmail };
};

/**
 * Validates an IIT Patna roll number for SMP:
 * - Must strictly match 8 alphanumeric characters: YY PP BB NN
 * - Program code PP must be B.Tech associated ('01', '02', '03')
 * - Checks batch year prefix against SystemConfig and verifies year-specific login/registration toggles.
 */
export const validateSmpRollNumber = (rollNumber, config, action = 'registration') => {
    if (!rollNumber || typeof rollNumber !== 'string') {
        return { valid: false, message: 'Roll number is required.' };
    }

    const cleanRoll = rollNumber.trim().toUpperCase();

    // Check basic 8-character length & alphanumeric format: 4 digits + 2 letters + 2 digits
    const generalPattern = /^([0-9]{2})([0-9]{2})([A-Z]{2})([0-9]{2})$/;
    const match = cleanRoll.match(generalPattern);

    if (!match) {
        return {
            valid: false,
            message: 'Invalid roll number format. Roll number must be exactly 8 characters (e.g., 2401AI36).'
        };
    }

    const [, yearPrefix, programCode, branchCode, serialNumber] = match;

    // Check program code: Must be B.Tech ('01'), B.Tech+M.Tech ('02'), or B.Tech+MBA ('03')
    if (!SMP_ALLOWED_PROGRAM_CODES[programCode]) {
        return {
            valid: false,
            message: 'SMP is exclusively for B.Tech and Dual-Degree (B.Tech+M.Tech / B.Tech+MBA) students. Pure M.Tech, Ph.D., and other programs are not eligible.'
        };
    }

    const programName = SMP_ALLOWED_PROGRAM_CODES[programCode];
    const branchName = SMP_BRANCH_MAP[branchCode] || branchCode;
    const admissionYear = 2000 + parseInt(yearPrefix, 10);

    // Validate against SystemConfig batch toggles if config is present
    if (config) {
        const isFirstYear = yearPrefix === config.firstYearBatchPrefix;
        const isSecondYear = yearPrefix === config.secondYearBatchPrefix;
        const isThirdYear = yearPrefix === config.thirdYearBatchPrefix;

        if (!isFirstYear && !isSecondYear && !isThirdYear) {
            const actionText = action === 'login' ? 'Login' : 'Registration';
            return {
                valid: false,
                message: `${actionText} is only permitted for active 1st, 2nd, and 3rd year B.Tech / Dual-Degree students.`
            };
        }

        if (action === 'registration') {
            if (!config.isRegistrationOpen) {
                return {
                    valid: false,
                    message: 'Registration is currently closed globally.'
                };
            }
            if (isFirstYear && !config.allowFirstYearLogin) {
                return { valid: false, message: 'Registration is currently closed for First-Year students.' };
            }
            if (isSecondYear && !config.allowSecondYearLogin) {
                return { valid: false, message: 'Registration is currently closed for Second-Year students.' };
            }
            if (isThirdYear && !config.allowThirdYearLogin) {
                return { valid: false, message: 'Registration is currently closed for Third-Year students.' };
            }
        } else if (action === 'login') {
            if (isFirstYear && !config.allowFirstYearLogin) {
                return { valid: false, message: 'Login is currently disabled for First-Year students.' };
            }
            if (isSecondYear && !config.allowSecondYearLogin) {
                return { valid: false, message: 'Login is currently disabled for Second-Year students.' };
            }
            if (isThirdYear && !config.allowThirdYearLogin) {
                return { valid: false, message: 'Login is currently disabled for Third-Year students.' };
            }
        }

        return {
            valid: true,
            rollNumber: cleanRoll,
            admissionYear,
            program: programName,
            branchCode,
            branchName,
            yearPrefix,
            isFirstYear,
            isSecondYear,
            isThirdYear
        };
    }

    return {
        valid: true,
        rollNumber: cleanRoll,
        admissionYear,
        program: programName,
        branchCode,
        branchName,
        yearPrefix
    };
};
