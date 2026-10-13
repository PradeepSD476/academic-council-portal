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

/**
 * Resolves an incoming area query (which could be a slug, display name, or casing variation)
 * to all matching database stored names in the given model.
 */
export const resolveStoredAreaNames = async (prisma, modelName, areaQuery) => {
  if (!areaQuery || areaQuery === 'All') return [];
  const raw = String(areaQuery).trim();
  if (!raw) return [];

  try {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT DISTINCT trim(area) AS name FROM "${modelName}", unnest("researchAreas") AS area WHERE area IS NOT NULL AND trim(area) <> '';`
    );
    const targetSlug = raw.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let matches = rows
      .map((r) => r.name)
      .filter((name) =>
        name === raw ||
        name.toLowerCase() === raw.toLowerCase() ||
        name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') === targetSlug
      );

    if (matches.length === 0 && !isNaN(Number(raw))) {
      // In case areaQuery is a 1-based synthetic ID
      const allRows = await prisma.$queryRaw`
        SELECT DISTINCT trim(area) AS name
        FROM (
          SELECT unnest("researchAreas") AS area FROM "FacultyProfile"
          UNION
          SELECT unnest("researchAreas") AS area FROM "ResearchOpenPosition"
          UNION
          SELECT unnest("researchAreas") AS area FROM "ResearchResource"
          UNION
          SELECT unnest("researchAreas") AS area FROM "ResearchDiscussion"
        ) sub
        WHERE area IS NOT NULL AND trim(area) <> ''
        ORDER BY name ASC;
      `;
      const idx = Number(raw) - 1;
      if (idx >= 0 && idx < allRows.length) {
        const areaName = allRows[idx].name;
        const areaSlug = areaName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        matches = rows
          .map((r) => r.name)
          .filter((name) =>
            name === areaName ||
            name.toLowerCase() === areaName.toLowerCase() ||
            name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') === areaSlug
          );
        if (matches.length === 0) return [areaName];
      }
    }

    return matches.length > 0 ? matches : [raw];
  } catch {
    return [raw];
  }
};

/**
 * Resolves an incoming area query to a single stored name string.
 */
export const resolveStoredAreaName = async (prisma, modelName, areaQuery) => {
  const matches = await resolveStoredAreaNames(prisma, modelName, areaQuery);
  return matches.length > 0 ? matches[0] : null;
};
