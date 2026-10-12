import prisma from '../../config/db.js';
import { success, error } from '../../utils/response.js';

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

    const matches = faculty
      .map((profile) => {
        let score = 0;
        const matchReasons = [];

        if (department && profile.department && profile.department.toLowerCase() === department.toLowerCase()) {
          score += 40;
          matchReasons.push(`Department match: ${profile.department}`);
        }

        if (subArea && Array.isArray(profile.researchAreas)) {
          const matchedArea = profile.researchAreas.find(
            (a) => a.toLowerCase().includes(subArea.toLowerCase()) || subArea.toLowerCase().includes(a.toLowerCase())
          );
          if (matchedArea) {
            score += 50;
            matchReasons.push(`Research area match: ${matchedArea}`);
          }
        }

        if (projectType && profile.openings?.length) {
          const matchedOpening = profile.openings.find((o) =>
            o.positionType?.toLowerCase().includes(projectType.toLowerCase())
          );
          if (matchedOpening) {
            score += 30;
            matchReasons.push(`Has open ${projectType} position: "${matchedOpening.title}"`);
          } else {
            score += 10;
            matchReasons.push(`Has ${profile.openings.length} active position(s)`);
          }
        }

        return {
          ...profile,
          matchScore: Math.min(100, score),
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
