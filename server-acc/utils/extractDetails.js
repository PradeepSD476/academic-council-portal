export const parseRollNumber = (rollNo) => {
  if (!rollNo || rollNo.length !== 8) {
    return { valid: false, error: "Invalid roll number length" };
  }

  const rollUpper = rollNo.toUpperCase();

  const yearCode = rollUpper.substring(0, 2);
  const programCode = rollUpper.substring(2, 4);
  const branchCode = rollUpper.substring(4, 6);

  const admissionYear = 2000 + parseInt(yearCode);

  // Only allow BTech and Dual Degree program codes (01, 02, 03)
  const allowedPrograms = ['01', '02', '03', '11'];
  if (!allowedPrograms.includes(programCode)) {
    return { valid: false, error: `Only BTech/Dual Degree programs (01, 02, 03) are allowed. Got: ${programCode}` };
  }

  // All 01, 02, 03 map to BTECH in the system
  const program = 'BTECH';
  const branchName = branchCode;

  return {
    valid: true,
    rollNo: rollUpper,
    admissionYear,
    program,
    branchName
  };
};