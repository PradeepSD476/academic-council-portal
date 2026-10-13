import prisma from '../../config/db.js';
import { success, error } from '../../utils/response.js';

// GET /api/v1/vault/admin/analytics - Overview metrics for research vault admin
export const getResearchAnalytics = async (req, res) => {
  try {
    const now = new Date();

    const [
      totalFaculty,
      activeFaculty,
      totalPositions,
      openPositions,
      totalResources,
      pendingResources,
      resourcesByType,
      totalDiscussions,
      totalReplies,
    ] = await Promise.all([
      prisma.facultyProfile.count(),
      prisma.facultyProfile.count({ where: { isActive: true } }),
      prisma.researchOpenPosition.count(),
      prisma.researchOpenPosition.count({
        where: {
          status: 'OPEN',
          OR: [{ deadline: null }, { deadline: { gte: now } }],
        },
      }),
      prisma.researchResource.count(),
      prisma.researchResource.count({ where: { status: 'PENDING' } }),
      prisma.researchResource.groupBy({
        by: ['type'],
        _count: { id: true },
      }),
      prisma.researchDiscussion.count({ where: { parentId: null } }),
      prisma.researchDiscussion.count({ where: { parentId: { not: null } } }),
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

    return success(
      res,
      {
        faculty: {
          total: totalFaculty,
          active: activeFaculty,
        },
        positions: {
          total: totalPositions,
          open: openPositions,
          closed: totalPositions - openPositions,
        },
        resources: {
          total: totalResources,
          pending: pendingResources,
          approved: totalResources - pendingResources,
          byType: typeBreakdown,
        },
        discussions: {
          threads: totalDiscussions,
          replies: totalReplies,
          total: totalDiscussions + totalReplies,
        },
      },
      'Analytics fetched successfully'
    );
  } catch (err) {
    return error(res, 'Failed to fetch analytics', 500, err);
  }
};
