import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '../../config/db.js';
import { success, error } from '../../utils/response.js';
import { isDepartmentMatch } from '../../constants/departments.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FOLLOWS_FILE = path.resolve(__dirname, '../../data/follows.json');

const loadFollows = () => {
  try {
    if (fs.existsSync(FOLLOWS_FILE)) {
      return JSON.parse(fs.readFileSync(FOLLOWS_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Failed to read follows file:', e);
  }
  return {};
};

const saveFollows = (data) => {
  try {
    const dir = path.dirname(FOLLOWS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(FOLLOWS_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to save follows file:', e);
  }
};

// Helper to dynamically aggregate distinct research areas across directory resources and 4 models
export const fetchAllResearchAreas = async () => {
  // 1. Fetch all explicitly registered area directory resources from ResearchResource (4-table model)
  const directoryResources = await prisma.researchResource.findMany({
    where: {
      sourceType: 'AREA_DIRECTORY',
    },
    orderBy: { title: 'asc' },
  });

  // 2. Dynamically fetch all distinct research areas across the 4 tables
  const rows = await prisma.$queryRaw`
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

  const seen = new Set();
  const areas = [];

  // Directory entries take priority for descriptions, custom slugs, and timestamps
  for (const resItem of directoryResources) {
    const lower = resItem.title.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      const meta = resItem.meta && typeof resItem.meta === 'object' ? resItem.meta : {};
      areas.push({
        id: resItem.id,
        name: resItem.title,
        slug: meta.slug || resItem.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        description: resItem.description || '',
        createdAt: resItem.createdAt,
        updatedAt: resItem.updatedAt,
      });
    }
  }

  // Include any areas dynamically discovered from the 4 models
  let syntheticId = areas.length ? Math.max(...areas.map((a) => a.id)) + 1000 : 1000;
  for (const row of rows) {
    if (row.name && !seen.has(row.name.toLowerCase())) {
      seen.add(row.name.toLowerCase());
      areas.push({
        id: syntheticId++,
        name: row.name,
        slug: row.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        description: '',
      });
    }
  }

  return areas;
};

// GET /api/v1/vault/areas - Return distinct research areas dynamically aggregated from database
export const getResearchAreas = async (req, res) => {
  try {
    const search = (req.query.search || '').trim();
    const areas = await fetchAllResearchAreas();

    let filtered = areas;
    if (search) {
      const lower = search.toLowerCase();
      filtered = areas.filter(
        (a) =>
          a.name.toLowerCase().includes(lower) ||
          (a.description && a.description.toLowerCase().includes(lower))
      );
    }

    filtered.sort((a, b) => a.name.localeCompare(b.name));

    return success(res, filtered, 'Research areas fetched');
  } catch (err) {
    return error(res, 'Failed to fetch research areas', 500, err);
  }
};

// GET /api/v1/vault/departments - Return distinct departments dynamically aggregated from database
export const getDepartments = async (req, res) => {
  try {
    const rows = await prisma.$queryRaw`
      SELECT DISTINCT trim(department) AS name
      FROM "FacultyProfile"
      WHERE department IS NOT NULL AND trim(department) <> ''
      ORDER BY name ASC;
    `;
    const names = rows.map((r) => r.name);
    return success(res, names, 'Departments fetched');
  } catch (err) {
    return error(res, 'Failed to fetch departments', 500, err);
  }
};

// POST /api/v1/vault/areas - Admin add research area stored within ResearchResource (4-table model)
export const createResearchArea = async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    if (!name) return error(res, 'Area name is required', 400);

    const rawSlug = String(req.body.slug || '').trim();
    const slug = (rawSlug || name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || `area-${Date.now()}`;

    const description = String(req.body.description || '').trim() || null;

    // Check for duplicate area name in ResearchResource directory
    const existing = await prisma.researchResource.findFirst({
      where: {
        sourceType: 'AREA_DIRECTORY',
        title: { equals: name, mode: 'insensitive' },
      },
    });

    if (existing) {
      return error(res, `A research area with name "${name}" already exists.`, 409);
    }

    const newAreaResource = await prisma.researchResource.create({
      data: {
        title: name,
        description,
        type: 'GUIDE',
        sourceType: 'AREA_DIRECTORY',
        status: 'APPROVED',
        meta: { isAreaDirectory: true, slug },
        researchAreas: [name],
        uploadedById: req.user.id,
      },
    });

    return success(
      res,
      {
        id: newAreaResource.id,
        name: newAreaResource.title,
        slug,
        description: newAreaResource.description || '',
        createdAt: newAreaResource.createdAt,
        updatedAt: newAreaResource.updatedAt,
      },
      'Research area added successfully',
      201
    );
  } catch (err) {
    return error(res, 'Failed to create research area', 500, err);
  }
};

// DELETE /api/v1/vault/areas/:id - Admin delete research area from ResearchResource
export const deleteResearchArea = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) return error(res, 'Valid research area ID is required', 400);

    const existing = await prisma.researchResource.findFirst({
      where: {
        id,
        sourceType: 'AREA_DIRECTORY',
      },
    });

    if (!existing) {
      return error(res, 'Research area not found', 404);
    }

    const areaName = existing.title;

    // Prevent deletion if actively linked to active profiles, positions, resources, or discussions
    const inFaculty = await prisma.facultyProfile.count({
      where: { researchAreas: { has: areaName } },
    });
    const inPositions = await prisma.researchOpenPosition.count({
      where: { researchAreas: { has: areaName } },
    });
    const inResources = await prisma.researchResource.count({
      where: {
        researchAreas: { has: areaName },
        sourceType: { not: 'AREA_DIRECTORY' },
      },
    });
    const inDiscussions = await prisma.researchDiscussion.count({
      where: { researchAreas: { has: areaName } },
    });

    if (inFaculty > 0 || inPositions > 0 || inResources > 0 || inDiscussions > 0) {
      return error(res, `Cannot delete "${areaName}" because it is currently associated with active records.`, 400);
    }

    await prisma.researchResource.delete({ where: { id } });
    return success(res, null, 'Research area deleted successfully');
  } catch (err) {
    return error(res, 'Failed to delete research area', 500, err);
  }
};

// POST /api/v1/vault/interest-matching - Match student interests against faculty & open positions
export const getInterestMatch = async (req, res) => {
  try {
    const department = String(req.body.department || '').trim();
    const subArea = String(req.body.subArea || '').trim();
    const projectType = String(req.body.projectType || '').trim();

    if (!department && !subArea && !projectType) {
      return error(res, 'Choose at least one interest to get faculty recommendations.', 400);
    }

    const faculty = await prisma.facultyProfile.findMany({
      where: { isActive: true },
      include: {
        openings: {
          where: {
            status: 'OPEN',
            OR: [{ deadline: null }, { deadline: { gte: new Date() } }],
          },
          select: { id: true, title: true, positionType: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    const deptWeight = department ? 40 : 0;
    const subAreaWeight = subArea ? 50 : 0;
    const projectWeight = projectType ? 30 : 0;
    const possiblePoints = deptWeight + subAreaWeight + projectWeight;

    const matches = faculty
      .map((profile) => {
        let earnedPoints = 0;
        const matchReasons = [];

        // 1. Department match (substring, case-insensitive, and alias-aware e.g. "electrical" in "Electrical Engineering", "cse" in "Computer Science & Engineering")
        if (department && profile.department && isDepartmentMatch(profile.department, department)) {
          earnedPoints += deptWeight;
          matchReasons.push(`Department match: ${profile.department}`);
        }

        // 2. Research area match (case-insensitive substring or slug match)
        if (subArea && Array.isArray(profile.researchAreas)) {
          const searchAreaSlug = subArea.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
          const searchAreaLower = subArea.toLowerCase();

          const matchedArea = profile.researchAreas.find((a) => {
            const aLower = a.toLowerCase();
            const aSlug = aLower.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            return aLower.includes(searchAreaLower) || searchAreaLower.includes(aLower) || aSlug === searchAreaSlug;
          });

          if (matchedArea) {
            earnedPoints += subAreaWeight;
            matchReasons.push(`Research area match: ${matchedArea}`);
          }
        }

        // 3. Project type / openings match
        if (projectType && profile.openings?.length) {
          const matchedOpening = profile.openings.find((o) =>
            o.positionType?.toLowerCase().includes(projectType.toLowerCase()) ||
            projectType.toLowerCase().includes(o.positionType?.toLowerCase())
          );
          if (matchedOpening) {
            earnedPoints += projectWeight;
            matchReasons.push(`Has open position: "${matchedOpening.title}"`);
          } else {
            matchReasons.push(`Has ${profile.openings.length} active position(s)`);
          }
        } else if (profile.openings?.length > 0) {
          matchReasons.push(`${profile.openings.length} open position${profile.openings.length === 1 ? '' : 's'}`);
        }

        const matchScore = possiblePoints > 0 ? Math.round((earnedPoints / possiblePoints) * 100) : 0;

        return {
          ...profile,
          matchScore,
          matchReasons,
        };
      })
      .filter((p) => p.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10);

    return success(res, matches, 'Matched faculty profiles');
  } catch (err) {
    return error(res, 'Failed to compute interest matching', 500, err);
  }
};

// Follow endpoints for frontend compatibility
export const getResearchFollows = async (req, res) => {
  const userId = req.user?.id ? String(req.user.id) : null;
  if (!userId) return success(res, { facultyIds: [], areaIds: [] }, 'Follows fetched');
  const store = loadFollows();
  const userFollows = store[userId] || { facultyIds: [], areaIds: [] };
  return success(res, userFollows, 'Follows fetched');
};

export const getFollowingUpdates = async (req, res) => {
  try {
    const userId = req.user?.id ? String(req.user.id) : null;
    const store = loadFollows();
    const stored = (userId && store[userId]) || { facultyIds: [], areaIds: [] };

    // Parse query params (active filter pills)
    const queryFacultyIds = req.query.facultyIds
      ? req.query.facultyIds.split(',').map((s) => Number(s.trim())).filter(Boolean)
      : [];
    const queryAreaIds = req.query.areaIds
      ? req.query.areaIds.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    if (req.query.areaId) {
      const singleAid = String(req.query.areaId).trim();
      if (singleAid && !queryAreaIds.includes(singleAid)) queryAreaIds.push(singleAid);
    }

    // Client-provided overall followed IDs (supports instant in-memory client state)
    const clientFollowedFacultyIds = req.query.followedFacultyIds
      ? req.query.followedFacultyIds.split(',').map((s) => Number(s.trim())).filter(Boolean)
      : [];
    const clientFollowedAreaIds = req.query.followedAreaIds
      ? req.query.followedAreaIds.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    const effectiveFollowedFacultyIds = Array.from(
      new Set([...(stored.facultyIds || []).map((id) => Number(id)).filter(Boolean), ...clientFollowedFacultyIds])
    );
    const effectiveFollowedAreaIds = Array.from(
      new Set([...(stored.areaIds || []).map((id) => String(id).trim()).filter(Boolean), ...clientFollowedAreaIds])
    );

    // Build area ID, slug, and name mapping using dynamically aggregated areas
    const allAreasList = await fetchAllResearchAreas();
    const areaIdToName = {};
    const areaNameToName = {};
    const areaSlugToName = {};

    allAreasList.forEach((a) => {
      areaIdToName[String(a.id)] = a.name;
      areaNameToName[a.name.toLowerCase().trim()] = a.name;
      if (a.slug) areaSlugToName[a.slug.toLowerCase().trim()] = a.name;
    });

    const resolveAreaName = (aid) => {
      if (!aid) return null;
      const str = String(aid).trim();
      if (areaIdToName[str]) return areaIdToName[str];
      if (areaNameToName[str.toLowerCase()]) return areaNameToName[str.toLowerCase()];
      if (areaSlugToName[str.toLowerCase()]) return areaSlugToName[str.toLowerCase()];
      return str;
    };

    const followedAreaNames = effectiveFollowedAreaIds
      .map(resolveAreaName)
      .filter(Boolean);

    const activeAreaNames = queryAreaIds
      .map(resolveAreaName)
      .filter(Boolean);
    const activeFacultyIds = queryFacultyIds;

    // Fetch candidate open positions
    const positions = await prisma.researchOpenPosition.findMany({
      where: {
        status: 'OPEN',
        OR: [{ deadline: null }, { deadline: { gte: new Date() } }],
      },
      include: {
        faculty: { select: { id: true, name: true, department: true, designation: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Fetch candidate approved resources (guides, papers, templates, experiences)
    const resources = await prisma.researchResource.findMany({
      where: { status: 'APPROVED' },
      include: {
        faculty: { select: { id: true, name: true, department: true } },
        uploadedBy: { select: { id: true, displayName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Fetch candidate top-level discussions / questions
    const discussions = await prisma.researchDiscussion.findMany({
      where: { resourceId: null, parentId: null },
      include: {
        author: { select: { id: true, displayName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Fetch candidate faculty for publication/bio activity
    const facultyProfiles = await prisma.facultyProfile.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        department: true,
        designation: true,
        publications: true,
        biography: true,
        researchAreas: true,
        updatedAt: true,
        createdAt: true,
      },
      take: 50,
    });

    const allUpdates = [];

    // Map positions
    positions.forEach((p) => {
      allUpdates.push({
        id: `position-${p.id}`,
        numericId: p.id,
        type: 'OPENING',
        title: p.title,
        source: p.faculty
          ? `${p.faculty.name}${p.faculty.department ? ' · ' + p.faculty.department : ''}`
          : (p.researchAreas?.[0] || 'Open Position'),
        detail: p.description || p.requirements || 'Research opening opportunity.',
        url: `/dashboard/research-vault/positions/${p.id}`,
        createdAt: p.createdAt,
        facultyId: p.facultyId,
        researchAreas: p.researchAreas || [],
        isBookmarked: userId ? p.bookmarkedUserIds?.includes(Number(userId)) : false,
      });
    });

    // Map resources
    resources.forEach((r) => {
      const isExp = r.type === 'EXPERIENCE';
      const meta = r.meta && typeof r.meta === 'object' ? r.meta : {};
      allUpdates.push({
        id: `resource-${r.id}`,
        numericId: r.id,
        type: r.type || 'RESOURCE',
        title: r.title,
        source: r.uploadedBy?.displayName || r.faculty?.name || (isExp ? 'Student Experience' : 'Research Vault'),
        detail: r.description || meta.keyLearnings || meta.labName || r.content?.slice(0, 180) || '',
        url: isExp ? '/dashboard/research-vault?section=experiences' : '/dashboard/research-vault?section=resources',
        createdAt: r.createdAt,
        facultyId: r.facultyId,
        researchAreas: r.researchAreas || [],
      });
    });

    // Map discussions
    discussions.forEach((d) => {
      allUpdates.push({
        id: `discussion-${d.id}`,
        numericId: d.id,
        type: 'QUESTION',
        title: d.title || 'Research Question',
        source: d.author?.displayName || 'Research Discussion',
        detail: d.content?.slice(0, 180) || '',
        url: `/dashboard/research-vault/questions/${d.id}`,
        createdAt: d.createdAt,
        facultyId: null,
        researchAreas: d.researchAreas || [],
      });
    });

    // Map faculty activity (if followed)
    facultyProfiles.forEach((f) => {
      if (effectiveFollowedFacultyIds.includes(f.id) && f.publications) {
        allUpdates.push({
          id: `faculty-pub-${f.id}`,
          numericId: f.id,
          type: 'PUBLICATION',
          title: `Research & Publications · ${f.name}`,
          source: `${f.name}${f.department ? ' · ' + f.department : ''}`,
          detail: f.publications.slice(0, 180),
          url: `/dashboard/research-vault?section=faculty&faculty=${f.id}`,
          createdAt: f.updatedAt || f.createdAt,
          facultyId: f.id,
          researchAreas: f.researchAreas || [],
        });
      }
    });

    // Apply filter logic
    const hasActiveFaculty = activeFacultyIds.length > 0;
    const hasActiveArea = activeAreaNames.length > 0;

    const filtered = allUpdates.filter((item) => {
      const rawAreas = item.researchAreas || [];
      const itemAreas = rawAreas.map((a) => {
        if (typeof a === 'string') return a.toLowerCase().trim();
        if (a && typeof a === 'object') return (a.name || a.researchArea?.name || '').toLowerCase().trim();
        return '';
      }).filter(Boolean);

      const matchesArea = (targetName) => {
        if (!targetName) return false;
        const normTarget = targetName.toLowerCase().trim();
        return itemAreas.some((ia) => ia === normTarget || ia.includes(normTarget) || normTarget.includes(ia));
      };

      // If active sub-filters exist:
      if (hasActiveFaculty && hasActiveArea) {
        const matchesFaculty = item.facultyId && activeFacultyIds.includes(item.facultyId);
        const matchesAreaCondition = activeAreaNames.some(matchesArea);
        return matchesFaculty && matchesAreaCondition;
      }
      if (hasActiveFaculty) {
        return item.facultyId && activeFacultyIds.includes(item.facultyId);
      }
      if (hasActiveArea) {
        return activeAreaNames.some(matchesArea);
      }

      // No active sub-filter: show all activity for what the user is following
      if (item.isBookmarked) return true;
      if (item.facultyId && effectiveFollowedFacultyIds.includes(item.facultyId)) return true;
      if (followedAreaNames.some(matchesArea)) return true;
      return false;
    });

    // Deduplicate and sort descending by createdAt
    const seen = new Set();
    const result = [];
    filtered
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .forEach((item) => {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          result.push(item);
        }
      });

    return success(res, result.slice(0, 50), 'Following updates fetched');
  } catch (err) {
    return error(res, 'Failed to fetch updates', 500, err);
  }
};

export const followFaculty = async (req, res) => {
  const userId = req.user?.id ? String(req.user.id) : null;
  const facultyId = Number(req.body?.facultyId || req.body?.id || req.params?.id);
  if (!userId || !facultyId) return success(res, { followed: true }, 'Followed faculty');
  const store = loadFollows();
  if (!store[userId]) store[userId] = { facultyIds: [], areaIds: [] };
  if (!store[userId].facultyIds.includes(facultyId)) {
    store[userId].facultyIds.push(facultyId);
    saveFollows(store);
  }
  return success(res, { followed: true }, 'Followed faculty');
};

export const unfollowFaculty = async (req, res) => {
  const userId = req.user?.id ? String(req.user.id) : null;
  const facultyId = Number(req.params?.id || req.body?.facultyId || req.body?.id);
  if (!userId || !facultyId) return success(res, { followed: false }, 'Unfollowed faculty');
  const store = loadFollows();
  if (store[userId]?.facultyIds) {
    store[userId].facultyIds = store[userId].facultyIds.filter((id) => Number(id) !== facultyId);
    saveFollows(store);
  }
  return success(res, { followed: false }, 'Unfollowed faculty');
};

export const followResearchArea = async (req, res) => {
  const userId = req.user?.id ? String(req.user.id) : null;
  const rawId = req.body?.areaId || req.body?.id || req.params?.id;
  const numId = Number(rawId);
  const effectiveAreaId = !isNaN(numId) && numId > 0 ? numId : (rawId ? String(rawId) : null);
  if (!userId || !effectiveAreaId) return success(res, { followed: true }, 'Followed area');
  const store = loadFollows();
  if (!store[userId]) store[userId] = { facultyIds: [], areaIds: [] };
  const currentAreaIds = store[userId].areaIds || [];
  if (!currentAreaIds.some((id) => String(id) === String(effectiveAreaId))) {
    store[userId].areaIds.push(effectiveAreaId);
    saveFollows(store);
  }
  return success(res, { followed: true }, 'Followed area');
};

export const unfollowResearchArea = async (req, res) => {
  const userId = req.user?.id ? String(req.user.id) : null;
  const rawId = req.params?.id || req.body?.areaId || req.body?.id;
  const numId = Number(rawId);
  const effectiveAreaId = !isNaN(numId) && numId > 0 ? numId : (rawId ? String(rawId) : null);
  if (!userId || !effectiveAreaId) return success(res, { followed: false }, 'Unfollowed area');
  const store = loadFollows();
  if (store[userId]?.areaIds) {
    store[userId].areaIds = store[userId].areaIds.filter((id) => String(id) !== String(effectiveAreaId));
    saveFollows(store);
  }
  return success(res, { followed: false }, 'Unfollowed area');
};
