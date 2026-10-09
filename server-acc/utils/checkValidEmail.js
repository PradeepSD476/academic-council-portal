import { parseRollNumber } from './extractDetails.js';

export const checkEmailValidity = (email) => {
  if (!email || typeof email !== 'string') {
    const error = new Error("Email is required.");
    error.code = "MISSING_EMAIL";
    throw error;
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Bypass for testing: allow any email if TEST_EMAIL_BYPASS is set
  const isTestBypass = process.env.TEST_EMAIL_BYPASS === 'true';
  if (!isTestBypass && !normalizedEmail.endsWith('@iitp.ac.in')) {
    const error = new Error('Only @iitp.ac.in email addresses are allowed.');
    error.code = 'NOT_IITP_EMAIL';
    throw error;
  }

  // Format: <name>_<rollNumber>@iitp.ac.in
  // Roll Number format: 2-digit year + 2-digit program + 2-letter branch + 2-digit sequence
  const studentEmailRegex = /^[a-z0-9._%+-]+_([0-9]{4}[a-z]{2}[0-9]{2})@iitp\.ac\.in$/i;
  const match = normalizedEmail.match(studentEmailRegex);

  let rollNumber = '2401AI36'; // Default for test emails
  if (match) {
    rollNumber = match[1].toUpperCase();
    // Validate the roll number program codes
    const rollDetails = parseRollNumber(rollNumber);
    if (!isTestBypass && !rollDetails.valid) {
      const error = new Error(`Invalid roll number: ${rollDetails.error}`);
      error.code = 'INVALID_ROLL_NUMBER';
      throw error;
    }
  }

  return {
    valid: true,
    email: normalizedEmail,
    rollNumber
  };
};