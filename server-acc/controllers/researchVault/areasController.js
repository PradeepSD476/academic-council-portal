import prisma from '../../config/db.js';
import { success, error } from '../../utils/response.js';
import { isDepartmentMatch } from '../../constants/departments.js';

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
  return success(res, { facultyIds: [], areaIds: [] }, 'Follows fetched');
};

export const getFollowingUpdates = async (req, res) => {
  try {
    const userId = Number(req.user?.id);
    const updates = [];

    if (userId) {
      const bookmarkedPositions = await prisma.researchOpenPosition.findMany({
        where: {
          bookmarkedUserIds: { has: userId },
          status: 'OPEN',
          OR: [{ deadline: null }, { deadline: { gte: new Date() } }],
        },
        include: {
          faculty: { select: { id: true, name: true, department: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: 10,
      });

      updates.push(...bookmarkedPositions);
    }

    return success(res, updates, 'Following updates fetched');
  } catch (err) {
    return error(res, 'Failed to fetch updates', 500, err);
  }
};

export const followFaculty = async (req, res) => {
  return success(res, { followed: true }, 'Followed faculty');
};

export const unfollowFaculty = async (req, res) => {
  return success(res, { followed: false }, 'Unfollowed faculty');
};

export const followResearchArea = async (req, res) => {
  return success(res, { followed: true }, 'Followed area');
};

export const unfollowResearchArea = async (req, res) => {
  return success(res, { followed: false }, 'Unfollowed area');
};
