import prisma from '../../config/db.js';
import { success, error } from '../../utils/response.js';

// GET /api/v1/vault/admin/analytics - Overview metrics for research vault admin
export const getResearchAnalytics = async (req, res) => {
  try {
    const now = new Date();

    const [
      facultyCount,
      activeFacultyCount,
      experienceCount,
      pendingExperiences,
      discussionCount,
      unansweredDiscussions,
      totalPositions,
      openPositions,
      totalResources,
      totalReplies,
      topFaculty,
      topResources,
      resourcesByType,
      areaRows,
      allFaculty,
      allResources,
      allDiscussions,
    ] = await Promise.all([
      prisma.facultyProfile.count(),
      prisma.facultyProfile.count({ where: { isActive: true } }),
      prisma.researchResource.count({ where: { type: 'EXPERIENCE', status: 'APPROVED' } }),
      prisma.researchResource.count({ where: { status: 'PENDING' } }),
      prisma.researchDiscussion.count({ where: { parentId: null } }),
      prisma.researchDiscussion.count({ where: { parentId: null, replies: { none: {} } } }),
      prisma.researchOpenPosition.count(),
      prisma.researchOpenPosition.count({
        where: {
          status: 'OPEN',
          OR: [{ deadline: null }, { deadline: { gte: now } }],
        },
      }),
      prisma.researchResource.count(),
      prisma.researchDiscussion.count({ where: { parentId: { not: null } } }),
      prisma.facultyProfile.findMany({
        where: { isActive: true },
        orderBy: { profileViewCount: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          department: true,
          photoUrl: true,
          profileViewCount: true,
        },
      }),
      prisma.researchResource.findMany({
        where: { status: 'APPROVED' },
        orderBy: [{ viewCount: 'desc' }, { downloadCount: 'desc' }],
        take: 5,
        select: {
          id: true,
          title: true,
          viewCount: true,
          downloadCount: true,
          type: true,
        },
      }),
      prisma.researchResource.groupBy({
        by: ['type'],
        _count: { id: true },
      }),
      prisma.$queryRaw`
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
      `,
      prisma.facultyProfile.findMany({ select: { researchAreas: true } }),
      prisma.researchResource.findMany({ select: { type: true, researchAreas: true } }),
      prisma.researchDiscussion.findMany({ where: { parentId: null }, select: { researchAreas: true } }),
    ]);

    const typeBreakdown = {
      GUIDE: 0,
      PAPER: 0,
      TEMPLATE: 0,
      EXPERIENCE: 0,
    };

    for (const group of resourcesByType) {
      if (typeBreakdown[group.type] !== undefined) {
        typeBreakdown[group.type] = group._count.id;
      }
    }

    const mappedTopFaculty = topFaculty.map((f) => ({
      ...f,
      photoURL: f.photoUrl,
    }));

    const researchAreas = (areaRows || []).map((r, index) => {
      const areaName = r.name;
      const lower = areaName.toLowerCase();

      const fCount = allFaculty.filter((f) =>
        (f.researchAreas || []).some((a) => a.toLowerCase() === lower)
      ).length;
      const expCount = allResources.filter(
        (res) => res.type === 'EXPERIENCE' && (res.researchAreas || []).some((a) => a.toLowerCase() === lower)
      ).length;
      const resCount = allResources.filter(
        (res) => res.type !== 'EXPERIENCE' && (res.researchAreas || []).some((a) => a.toLowerCase() === lower)
      ).length;
      const discCount = allDiscussions.filter((d) =>
        (d.researchAreas || []).some((a) => a.toLowerCase() === lower)
      ).length;

      return {
        id: index + 1,
        name: areaName,
        _count: {
          facultyProfiles: fCount,
          experiences: expCount,
          discussions: discCount,
          resources: resCount,
        },
      };
    });

    return success(
      res,
      {
        // Direct KPI bindings for ResearchVaultAdmin Overview tab
        facultyCount,
        experienceCount,
        pendingExperiences,
        discussionCount,
        unansweredDiscussions,
        topFaculty: mappedTopFaculty,
        topResources,
        researchAreas,

        // Structured category metrics
        faculty: {
          total: facultyCount,
          active: activeFacultyCount,
        },
        positions: {
          total: totalPositions,
          open: openPositions,
          closed: totalPositions - openPositions,
        },
        resources: {
          total: totalResources,
          pending: pendingExperiences,
          approved: totalResources - pendingExperiences,
          byType: typeBreakdown,
        },
        discussions: {
          threads: discussionCount,
          replies: totalReplies,
          total: discussionCount + totalReplies,
        },
      },
      'Analytics fetched successfully'
    );
  } catch (err) {
    return error(res, 'Failed to fetch analytics', 500, err);
  }
};
