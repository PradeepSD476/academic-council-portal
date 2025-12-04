export const parseRollNumber = (rollNo) => {
  if (!rollNo || rollNo.length !== 8) {
    return { valid: false, error: "Invalid roll number length" };
  }

  const rollUpper = rollNo.toUpperCase();
  
  const yearCode = rollUpper.substring(0, 2);
  const programCode = rollUpper.substring(2, 4);
  const branchCode = rollUpper.substring(4, 6);
  
  const admissionYear = 2000 + parseInt(yearCode);

  const programMap = {
    '01': 'BTECH',
    '02': 'BTECH + MTECH',
    '03': 'BTECH + MBA'
  };

  const program = programMap[programCode] || 'UP';
  const branchName = branchCode;

  return {
    valid: true,
    rollNo: rollUpper,
    admissionYear,
    program,
    branchName
  };
};