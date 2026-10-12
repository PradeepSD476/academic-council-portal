import prisma from '../../config/db.js';
import { success, paginated, error } from '../../utils/response.js';
import { normalizeResearchAreas } from '../../constants/researchAreas.js';
import { deadlineLabel, isOpenOpening } from '../../utils/openingStatus.js';

// Helper to format/shape open position for API responses
const shapePosition = (pos, currentUserId = null) => {
  const isBookmarked = currentUserId && Array.isArray(pos.bookmarkedUserIds)
    ? pos.bookmarkedUserIds.includes(currentUserId)
    : false;

  return {
    ...pos,
    isBookmarked,
    deadlineLabel: deadlineLabel(pos),
    isClosed: pos.status === 'CLOSED' || (pos.deadline && new Date(pos.deadline) < new Date()),
    bookmarkCount: Array.isArray(pos.bookmarkedUserIds) ? pos.bookmarkedUserIds.length : 0,
  };
};

// GET /api/v1/vault/positions - List open positions with DB-level deadline filtering
export const getOpenPositions = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const { search, department, area, positionType, status, facultyId } = req.query;

    const where = {};
    const now = new Date();

    // Query-level deadline filtering to keep pagination totals completely accurate
    if (status === 'CLOSED') {
      where.OR = [
        { status: 'CLOSED' },
        { deadline: { lt: now } },
      ];
    } else if (status === 'ALL') {
      // Show all positions without deadline/status filtering
    } else {
      // Default: only truly OPEN positions
      where.status = 'OPEN';
      where.AND = [
        {
          OR: [
            { deadline: null },
            { deadline: { gte: now } },
          ],
        },
      ];
    }

    if (positionType && positionType !== 'All') {
      where.positionType = positionType;
    }

    if (facultyId) {
      where.facultyId = Number(facultyId);
    }

    if (department && department !== 'All') {
      where.faculty = {
        department: { equals: department, mode: 'insensitive' },
      };
    }

    if (area && area !== 'All') {
      where.researchAreas = { has: area };
    }

    if (search && search.trim()) {
      const term = search.trim();
      const searchConditions = [
        { title: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
        { requirements: { contains: term, mode: 'insensitive' } },
        { faculty: { name: { contains: term, mode: 'insensitive' } } },
      ];

      if (where.AND) {
        where.AND.push({ OR: searchConditions });
      } else {
        where.OR = searchConditions;
      }
    }

    const [positions, total] = await Promise.all([
      prisma.researchOpenPosition.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ deadline: 'asc' }, { createdAt: 'desc' }],
        include: {
          faculty: {
            select: {
              id: true,
              name: true,
              department: true,
              designation: true,
              photoUrl: true,
              slug: true,
            },
          },
          uploadedBy: {
            select: {
              id: true,
              displayName: true,
              email: true,
            },
          },
        },
      }),
      prisma.researchOpenPosition.count({ where }),
    ]);

    const shaped = positions.map((p) => shapePosition(p, req.user?.id));
    return paginated(res, shaped, { page, limit, total }, 'Open positions fetched');
  } catch (err) {
    return error(res, 'Failed to fetch open positions', 500, err);
  }
};

// GET /api/v1/vault/positions/:id - Detail view
export const getOpenPositionById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return error(res, 'Invalid position ID', 400);
    }

    const position = await prisma.researchOpenPosition.findUnique({
      where: { id },
      include: {
        faculty: {
          select: {
            id: true,
            name: true,
            department: true,
            designation: true,
            photoUrl: true,
            websiteUrl: true,
            email: true,
            slug: true,
          },
        },
        uploadedBy: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
      },
    });

    if (!position) {
      return error(res, 'Position not found', 404);
    }

    return success(res, shapePosition(position, req.user?.id), 'Position detail fetched');
  } catch (err) {
    return error(res, 'Failed to fetch position detail', 500, err);
  }
};

// POST /api/v1/vault/positions - Create open position inside $transaction
export const createOpenPosition = async (req, res) => {
  try {
    const {
      title,
      description,
      positionType = 'RA',
      requirements,
      eligibility,
      positionsAvailable = 1,
      positionsFilled = 0,
      deadline,
      applicationUrl,
      howToApply,
      researchAreas,
      facultyId,
    } = req.body;

    if (!title || !title.trim()) {
      return error(res, 'Title is required', 400);
    }

    const available = Number(positionsAvailable) > 0 ? Number(positionsAvailable) : 1;
    const filled = Number(positionsFilled) >= 0 ? Number(positionsFilled) : 0;
    const normalizedAreas = normalizeResearchAreas(researchAreas);

    // Compute status and create within $transaction
    const position = await prisma.$transaction(async (tx) => {
      const status = filled >= available ? 'CLOSED' : 'OPEN';

      return await tx.researchOpenPosition.create({
        data: {
          title: title.trim(),
          description: description || null,
          positionType: positionType.trim(),
          requirements: requirements || null,
          eligibility: eligibility || null,
          positionsAvailable: available,
          positionsFilled: filled,
          status,
          deadline: deadline ? new Date(deadline) : null,
          applicationUrl: applicationUrl?.trim() || null,
          howToApply: howToApply || null,
          researchAreas: normalizedAreas,
          facultyId: facultyId ? Number(facultyId) : null,
          uploadedById: req.user.id,
        },
        include: {
          faculty: {
            select: {
              id: true,
              name: true,
              department: true,
              designation: true,
              photoUrl: true,
            },
          },
        },
      });
    });

    return success(res, shapePosition(position, req.user.id), 'Position created successfully', 201);
  } catch (err) {
    return error(res, 'Failed to create position', 500, err);
  }
};

// PUT /api/v1/vault/positions/:id - Update inside $transaction with atomic status calculation
export const updateOpenPosition = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return error(res, 'Invalid position ID', 400);
    }

    const position = await prisma.$transaction(async (tx) => {
      const existing = await tx.researchOpenPosition.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new Error('NOT_FOUND');
      }

      const b = req.body;
      const available = b.positionsAvailable !== undefined ? Number(b.positionsAvailable) : existing.positionsAvailable;
      const filled = b.positionsFilled !== undefined ? Number(b.positionsFilled) : existing.positionsFilled;

      // Determine updated status
      let newStatus = existing.status;
      if (b.status) {
        newStatus = b.status;
      } else if (filled >= available) {
        newStatus = 'CLOSED';
      } else if (filled < available && existing.status === 'CLOSED' && !b.status) {
        newStatus = 'OPEN';
      }

      const updateData = {
        positionsAvailable: available,
        positionsFilled: filled,
        status: newStatus,
      };

      if (b.title !== undefined) updateData.title = b.title.trim();
      if (b.description !== undefined) updateData.description = b.description;
      if (b.positionType !== undefined) updateData.positionType = b.positionType;
      if (b.requirements !== undefined) updateData.requirements = b.requirements;
      if (b.eligibility !== undefined) updateData.eligibility = b.eligibility;
      if (b.deadline !== undefined) updateData.deadline = b.deadline ? new Date(b.deadline) : null;
      if (b.applicationUrl !== undefined) updateData.applicationUrl = b.applicationUrl?.trim() || null;
      if (b.howToApply !== undefined) updateData.howToApply = b.howToApply;
      if (b.facultyId !== undefined) updateData.facultyId = b.facultyId ? Number(b.facultyId) : null;
      if (b.researchAreas !== undefined) {
        updateData.researchAreas = normalizeResearchAreas(b.researchAreas);
      }

      return await tx.researchOpenPosition.update({
        where: { id },
        data: updateData,
        include: {
          faculty: {
            select: {
              id: true,
              name: true,
              department: true,
              designation: true,
              photoUrl: true,
            },
          },
        },
      });
    });

    return success(res, shapePosition(position, req.user?.id), 'Position updated successfully');
  } catch (err) {
    if (err.message === 'NOT_FOUND') {
      return error(res, 'Position not found', 404);
    }
    return error(res, 'Failed to update position', 500, err);
  }
};

// DELETE /api/v1/vault/positions/:id - Delete open position
export const deleteOpenPosition = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return error(res, 'Invalid position ID', 400);
    }

    await prisma.researchOpenPosition.delete({
      where: { id },
    });

    return success(res, null, 'Position deleted successfully');
  } catch (err) {
    return error(res, 'Failed to delete position', 500, err);
  }
};

// POST /api/v1/vault/positions/bookmarks - Atomic deduplicated bookmark addition via conditional raw SQL
export const bookmarkPosition = async (req, res) => {
  try {
    const positionId = Number(req.body.positionId || req.params.id);
    const userId = Number(req.user.id);

    if (isNaN(positionId)) {
      return error(res, 'Invalid position ID', 400);
    }

    // Atomic conditional SQL UPDATE: append only if NOT already present
    const affected = await prisma.$executeRaw`
      UPDATE "ResearchOpenPosition"
      SET "bookmarkedUserIds" = array_append("bookmarkedUserIds", ${userId})
      WHERE id = ${positionId} AND NOT (${userId} = ANY("bookmarkedUserIds"))
    `;

    if (affected === 0) {
      // Check if position exists
      const exists = await prisma.researchOpenPosition.findUnique({
        where: { id: positionId },
        select: { id: true },
      });
      if (!exists) {
        return error(res, 'Position not found', 404);
      }
      return success(res, { bookmarked: true, modified: false }, 'Position already bookmarked');
    }

    return success(res, { bookmarked: true, modified: true }, 'Position bookmarked successfully');
  } catch (err) {
    return error(res, 'Failed to bookmark position', 500, err);
  }
};

// DELETE /api/v1/vault/positions/bookmarks/:id - Atomic deduplicated bookmark removal via conditional raw SQL
export const unbookmarkPosition = async (req, res) => {
  try {
    const positionId = Number(req.params.id || req.body.positionId);
    const userId = Number(req.user.id);

    if (isNaN(positionId)) {
      return error(res, 'Invalid position ID', 400);
    }

    // Atomic conditional SQL UPDATE: remove only if present
    const affected = await prisma.$executeRaw`
      UPDATE "ResearchOpenPosition"
      SET "bookmarkedUserIds" = array_remove("bookmarkedUserIds", ${userId})
      WHERE id = ${positionId} AND (${userId} = ANY("bookmarkedUserIds"))
    `;

    return success(res, { bookmarked: false, modified: affected > 0 }, 'Bookmark removed successfully');
  } catch (err) {
    return error(res, 'Failed to remove bookmark', 500, err);
  }
};

// POST /api/v1/vault/positions/:id/bookmark - Atomic bookmark toggle endpoint
export const toggleBookmarkPosition = async (req, res) => {
  try {
    const positionId = Number(req.params.id || req.body.positionId);
    const userId = Number(req.user.id);

    if (isNaN(positionId)) {
      return error(res, 'Invalid position ID', 400);
    }

    // First attempt to append atomically if not bookmarked
    const appendAffected = await prisma.$executeRaw`
      UPDATE "ResearchOpenPosition"
      SET "bookmarkedUserIds" = array_append("bookmarkedUserIds", ${userId})
      WHERE id = ${positionId} AND NOT (${userId} = ANY("bookmarkedUserIds"))
    `;

    if (appendAffected > 0) {
      return success(res, { bookmarked: true }, 'Position bookmarked');
    }

    // If append affected 0 rows, check if it's already bookmarked and remove it
    const removeAffected = await prisma.$executeRaw`
      UPDATE "ResearchOpenPosition"
      SET "bookmarkedUserIds" = array_remove("bookmarkedUserIds", ${userId})
      WHERE id = ${positionId} AND (${userId} = ANY("bookmarkedUserIds"))
    `;

    if (removeAffected > 0) {
      return success(res, { bookmarked: false }, 'Bookmark removed');
    }

    return error(res, 'Position not found', 404);
  } catch (err) {
    return error(res, 'Failed to toggle bookmark', 500, err);
  }
};

// GET /api/v1/vault/positions/bookmarks - Get all positions bookmarked by current user
export const getResearchPositionBookmarks = async (req, res) => {
  try {
    const userId = Number(req.user.id);

    const positions = await prisma.researchOpenPosition.findMany({
      where: {
        bookmarkedUserIds: { has: userId },
      },
      include: {
        faculty: {
          select: {
            id: true,
            name: true,
            department: true,
            designation: true,
            photoUrl: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const shaped = positions.map((p) => shapePosition(p, userId));
    return success(res, shaped, 'Bookmarked positions fetched');
  } catch (err) {
    return error(res, 'Failed to fetch bookmarks', 500, err);
  }
};
