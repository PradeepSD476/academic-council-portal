// Department taxonomy and alias resolution for search & matching

export const DEPARTMENT_GROUPS = [
  {
    name: 'Computer Science & Engineering',
    acronyms: ['cse', 'cs', 'comp sci'],
    keywords: ['computer science', 'computer engineering'],
  },
  {
    name: 'Electrical Engineering',
    acronyms: ['ee', 'eee'],
    keywords: ['electrical', 'electrical engineering'],
  },
  {
    name: 'Electronics & Communication Engineering',
    acronyms: ['ece'],
    keywords: ['electronics', 'electronics and communication', 'communication engineering'],
  },
  {
    name: 'Mechanical Engineering',
    acronyms: ['me', 'mech'],
    keywords: ['mechanical', 'mechanical engineering'],
  },
  {
    name: 'Chemical Engineering',
    acronyms: ['che', 'chem', 'cheme'],
    keywords: ['chemical', 'chemical engineering'],
  },
  {
    name: 'Civil & Environmental Engineering',
    acronyms: ['ce', 'civil'],
    keywords: ['civil engineering', 'environmental engineering', 'civil and environmental'],
  },
  {
    name: 'Metallurgical & Materials Engineering',
    acronyms: ['mme', 'metallurgy'],
    keywords: ['metallurgical', 'materials engineering'],
  },
  {
    name: 'Mathematics',
    acronyms: ['math', 'maths'],
    keywords: ['mathematics'],
  },
  {
    name: 'Physics',
    acronyms: ['phy'],
    keywords: ['physics'],
  },
  {
    name: 'Chemistry',
    acronyms: ['chem'],
    keywords: ['chemistry'],
  },
  {
    name: 'Humanities & Social Sciences',
    acronyms: ['hss'],
    keywords: ['humanities', 'social sciences'],
  },
];

/**
 * Check if a department string matches a specific department group.
 */
const matchesGroup = (str, group) => {
  const s = str.toLowerCase().trim();
  if (s === group.name.toLowerCase()) return true;
  if (group.keywords.some((k) => s.includes(k) || (s.length >= 4 && k.includes(s)))) {
    return true;
  }
  if (group.acronyms.includes(s)) {
    return true;
  }
  if (group.acronyms.some((acr) => new RegExp(`\\b${acr}\\b`, 'i').test(s))) {
    return true;
  }
  return false;
};

/**
 * Generates initials/acronym for any department name (e.g. "Aerospace Engineering" -> "ae", "Biomedical Engineering" -> "be")
 */
export const generateDepartmentAcronym = (name) => {
  if (!name) return '';
  const tokens = String(name)
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w && !['and', 'of', 'the', 'in', 'for'].includes(w.toLowerCase()));
  if (tokens.length <= 1) return '';
  return tokens.map((w) => w[0].toLowerCase()).join('');
};

/**
 * Check if two department strings refer to the same department.
 * Works dynamically for ANY department name (curated, seeded, or newly created in DB).
 */
export const isDepartmentMatch = (deptA, deptB) => {
  if (!deptA || !deptB) return false;
  const a = String(deptA).toLowerCase().trim();
  const b = String(deptB).toLowerCase().trim();

  if (!a || !b) return false;
  // 1. Direct equality
  if (a === b) return true;

  // 2. Substring check (if search token is at least 4 characters to avoid false positives)
  if (a.length >= 4 && b.length >= 4 && (a.includes(b) || b.includes(a))) {
    return true;
  }

  // 3. Dynamic acronym matching (e.g., user types "bme" or "be" for "Biomedical Engineering")
  const acrA = generateDepartmentAcronym(a);
  const acrB = generateDepartmentAcronym(b);
  if (acrA && (b === acrA || new RegExp(`\\b${acrA}\\b`, 'i').test(b))) return true;
  if (acrB && (a === acrB || new RegExp(`\\b${acrB}\\b`, 'i').test(a))) return true;

  // 4. Known curated group / alias check (for informal slang like "mech", "chem", "comp sci")
  for (const group of DEPARTMENT_GROUPS) {
    if (matchesGroup(a, group) && matchesGroup(b, group)) {
      return true;
    }
  }

  return false;
};

/**
 * Resolves search terms to safe search aliases for DB queries (avoids short acronyms in ILIKE)
 */
export const resolveDepartmentAliases = (searchTerm) => {
  if (!searchTerm || !searchTerm.trim()) return [];
  const term = searchTerm.toLowerCase().trim();

  for (const group of DEPARTMENT_GROUPS) {
    if (matchesGroup(term, group)) {
      const safeTerms = [group.name, ...group.keywords];
      if (term.length >= 4) {
        safeTerms.push(term);
      }
      return Array.from(new Set(safeTerms));
    }
  }

  return [term];
};
