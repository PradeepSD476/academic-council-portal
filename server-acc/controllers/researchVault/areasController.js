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

// GET /api/v1/vault/areas - Return distinct research areas dynamically aggregated from database
export const getResearchAreas = async (req, res) => {
  try {
    const search = (req.query.search || '').trim();

    // Dynamically fetch all distinct research areas across faculty, positions, resources, and discussions
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

    let areas = rows.map((r) => r.name);

    if (search) {
      const lower = search.toLowerCase();
      areas = areas.filter((a) => a.toLowerCase().includes(lower));
    }

    const data = areas.map((name, index) => ({
      id: index + 1,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    }));

    return success(res, data, 'Research areas fetched');
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

// POST /api/v1/vault/areas - Admin add custom area (returns formatted object)
export const createResearchArea = async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    if (!name) return error(res, 'Area name is required', 400);

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return success(res, { id: Date.now(), name, slug }, 'Research area added', 201);
  } catch (err) {
    return error(res, 'Failed to create research area', 500, err);
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
      ? req.query.areaIds.split(',').map((s) => Number(s.trim())).filter(Boolean)
      : [];
    if (req.query.areaId) {
      const singleAid = Number(req.query.areaId);
      if (singleAid && !queryAreaIds.includes(singleAid)) queryAreaIds.push(singleAid);
    }

    // Client-provided overall followed IDs (supports instant in-memory client state)
    const clientFollowedFacultyIds = req.query.followedFacultyIds
      ? req.query.followedFacultyIds.split(',').map((s) => Number(s.trim())).filter(Boolean)
      : [];
    const clientFollowedAreaIds = req.query.followedAreaIds
      ? req.query.followedAreaIds.split(',').map((s) => Number(s.trim())).filter(Boolean)
      : [];

    const effectiveFollowedFacultyIds = Array.from(
      new Set([...(stored.facultyIds || []), ...clientFollowedFacultyIds])
    );
    const effectiveFollowedAreaIds = Array.from(
      new Set([...(stored.areaIds || []), ...clientFollowedAreaIds])
    );

    // Build area ID to name mapping
    const areaRows = await prisma.$queryRaw`
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
    const areaIdToName = {};
    const areaNameToName = {};
    areaRows.forEach((r, idx) => {
      areaIdToName[idx + 1] = r.name;
      areaNameToName[r.name.toLowerCase()] = r.name;
    });

    const followedAreaNames = effectiveFollowedAreaIds
      .map((aid) => areaIdToName[aid])
      .filter(Boolean);

    const activeAreaNames = queryAreaIds
      .map((aid) => areaIdToName[aid] || areaNameToName[String(aid).toLowerCase()])
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
      take: 30,
    });

    // Fetch candidate approved resources (guides, papers, templates, experiences)
    const resources = await prisma.researchResource.findMany({
      where: { status: 'APPROVED' },
      include: {
        faculty: { select: { id: true, name: true, department: true } },
        uploadedBy: { select: { id: true, displayName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    // Fetch candidate top-level discussions / questions
    const discussions = await prisma.researchDiscussion.findMany({
      where: { resourceId: null, parentId: null },
      include: {
        author: { select: { id: true, displayName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
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
      take: 30,
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
      const itemAreas = (item.researchAreas || []).map((a) => a.toLowerCase());

      // If active sub-filters exist:
      if (hasActiveFaculty && hasActiveArea) {
        const matchesFaculty = item.facultyId && activeFacultyIds.includes(item.facultyId);
        const matchesArea = activeAreaNames.some((a) => itemAreas.includes(a.toLowerCase()));
        return matchesFaculty && matchesArea;
      }
      if (hasActiveFaculty) {
        return item.facultyId && activeFacultyIds.includes(item.facultyId);
      }
      if (hasActiveArea) {
        return activeAreaNames.some((a) => itemAreas.includes(a.toLowerCase()));
      }

      // No active sub-filter: show all activity for what the user is following
      if (item.isBookmarked) return true;
      if (item.facultyId && effectiveFollowedFacultyIds.includes(item.facultyId)) return true;
      if (followedAreaNames.some((a) => itemAreas.includes(a.toLowerCase()))) return true;
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

    return success(res, result.slice(0, 30), 'Following updates fetched');
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
    store[userId].facultyIds = store[userId].facultyIds.filter((id) => id !== facultyId);
    saveFollows(store);
  }
  return success(res, { followed: false }, 'Unfollowed faculty');
};

export const followResearchArea = async (req, res) => {
  const userId = req.user?.id ? String(req.user.id) : null;
  const areaId = Number(req.body?.areaId || req.body?.id || req.params?.id);
  if (!userId || !areaId) return success(res, { followed: true }, 'Followed area');
  const store = loadFollows();
  if (!store[userId]) store[userId] = { facultyIds: [], areaIds: [] };
  if (!store[userId].areaIds.includes(areaId)) {
    store[userId].areaIds.push(areaId);
    saveFollows(store);
  }
  return success(res, { followed: true }, 'Followed area');
};

export const unfollowResearchArea = async (req, res) => {
  const userId = req.user?.id ? String(req.user.id) : null;
  const areaId = Number(req.params?.id || req.body?.areaId || req.body?.id);
  if (!userId || !areaId) return success(res, { followed: false }, 'Unfollowed area');
  const store = loadFollows();
  if (store[userId]?.areaIds) {
    store[userId].areaIds = store[userId].areaIds.filter((id) => id !== areaId);
    saveFollows(store);
  }
  return success(res, { followed: false }, 'Unfollowed area');
};
