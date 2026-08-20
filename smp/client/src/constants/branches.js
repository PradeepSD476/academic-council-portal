/**
 * Standardized Branches and Mapping for SMP Client
 * Aligned directly with the Academic Council Portal (ACC).
 */

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

export const ROLL_BRANCH_MAP = {
  CS: 'Computer Science & Engineering',
  AI: 'Artificial Intelligence & Data Science',
  MC: 'Mathematics & Computing',
  MT: 'Mathematics & Computing',
  EC: 'Electronics & Communication Engineering',
  VL: 'Electronics & Communication Engineering',
  EE: 'Electrical Engineering',
  ME: 'Mechanical Engineering',
  CE: 'Civil Engineering',
  ST: 'Civil Engineering',
  CB: 'Chemical & Biochemical Engineering',
  CT: 'Chemical & Biochemical Engineering',
  MM: 'Metallurgical & Materials Engineering',
  PH: 'Engineering Physics',
  EP: 'Engineering Physics',
  ES: 'Earth & Environmental Sciences',
};

/**
 * Automatically infers standard branch from an 8-character IIT Patna roll number (e.g. 2401AI36 -> Artificial Intelligence & Data Science)
 */
export function inferBranchFromRoll(rollNumber) {
  if (!rollNumber || typeof rollNumber !== 'string' || rollNumber.length < 6) {
    return '';
  }
  const cleanRoll = rollNumber.trim().toUpperCase();
  const branchCode = cleanRoll.substring(4, 6);
  return ROLL_BRANCH_MAP[branchCode] || '';
}
