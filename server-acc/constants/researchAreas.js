// Dynamic research area utilities.
// Free-form user/admin defined tags without any hardcoded categories.

/**
 * Normalizes, deduplicates, and cleanses an array of research area tags.
 * Accepts arrays of strings, comma-separated strings, or objects with a `name` property.
 * Deduplicates case-insensitively while preserving original casing.
 */
export const normalizeResearchAreas = (areas) => {
  if (!areas) return [];

  let rawList = [];
  if (Array.isArray(areas)) {
    rawList = areas;
  } else if (typeof areas === 'string') {
    rawList = areas.split(',');
  } else {
    return [];
  }

  const seen = new Set();
  const result = [];

  for (const raw of rawList) {
    let str = '';
    if (typeof raw === 'string') {
      str = raw.trim();
    } else if (raw && typeof raw === 'object' && raw.name) {
      str = String(raw.name).trim();
    } else {
      continue;
    }

    if (!str) continue;

    const lower = str.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      // Clean up consecutive internal whitespace
      result.push(str.replace(/\s+/g, ' '));
    }
  }

  return result;
};

// Kept as empty array for backward-compatibility if imported
export const CANONICAL_RESEARCH_AREAS = [];
