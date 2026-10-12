import prisma from '../../config/db.js';
import { success, paginated, error } from '../../utils/response.js';
import { normalizeResearchAreas } from '../../constants/researchAreas.js';

// Helper to decorate discussions with hasVoted and counts
const decorateDiscussion = (item, currentUserId = null) => {
  if (!item) return null;
  const voterIds = Array.isArray(item.voterIds) ? item.voterIds : [];
  const hasVoted = currentUserId ? voterIds.includes(currentUserId) : false;

  const replies = (item.replies || []).map((reply) => {
    const replyVoters = Array.isArray(reply.voterIds) ? reply.voterIds : [];
    return {
      ...reply,
      hasVoted: currentUserId ? replyVoters.includes(currentUserId) : false,
    };
  });

  return {
    ...item,
    hasVoted,
    replies,
    replyCount: item._count?.replies ?? replies.length,
  };
};

// GET /api/v1/vault/discussions - List Q&A discussions (or resource comments if resourceId query is passed)
export const getResearchDiscussions = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 15));
    const skip = (page - 1) * limit;

    const { search, area, resourceId } = req.query;

    const where = {
      parentId: null, // Only top-level items; replies are nested
    };

    if (resourceId) {
      where.resourceId = Number(resourceId);
    } else {
      where.resourceId = null; // Standard Q&A threads
    }

    if (area && area !== 'All') {
      where.researchAreas = { has: area };
    }

    if (search && search.trim()) {
      const term = search.trim();
      where.OR = [
        { title: { contains: term, mode: 'insensitive' } },
        { content: { contains: term, mode: 'insensitive' } },
      ];
    }

    const [discussions, total] = await Promise.all([
      prisma.researchDiscussion.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ upvotes: 'desc' }, { createdAt: 'desc' }],
        include: {
          author: {
            select: { id: true, displayName: true, email: true, photoURL: true, role: true },
          },
          replies: {
            include: {
              author: {
                select: { id: true, displayName: true, email: true, photoURL: true, role: true },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
          _count: {
            select: { replies: true },
          },
        },
      }),
      prisma.researchDiscussion.count({ where }),
    ]);

    const decorated = discussions.map((d) => decorateDiscussion(d, req.user?.id));
    return paginated(res, decorated, { page, limit, total }, 'Discussions fetched');
  } catch (err) {
    return error(res, 'Failed to fetch discussions', 500, err);
  }
};

// GET /api/v1/vault/questions - Alias for question list
export const getQuestionList = async (req, res) => {
  return getResearchDiscussions(req, res);
};

// GET /api/v1/vault/discussions/:id - Detail view with replies
export const getResearchDiscussionById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return error(res, 'Invalid discussion ID', 400);

    const discussion = await prisma.researchDiscussion.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, displayName: true, email: true, photoURL: true, role: true },
        },
        resource: {
          select: { id: true, title: true, type: true },
        },
        replies: {
          include: {
            author: {
              select: { id: true, displayName: true, email: true, photoURL: true, role: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: { replies: true },
        },
      },
    });

    if (!discussion) return error(res, 'Discussion not found', 404);

    return success(res, decorateDiscussion(discussion, req.user?.id), 'Discussion detail fetched');
  } catch (err) {
    return error(res, 'Failed to fetch discussion', 500, err);
  }
};

// GET /api/v1/vault/questions/:id - Alias for question detail
export const getQuestionDetail = async (req, res) => {
  return getResearchDiscussionById(req, res);
};

// GET /api/v1/vault/questions/:id/replies - Replies for a question
export const getQuestionReplies = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return error(res, 'Invalid question ID', 400);

    const replies = await prisma.researchDiscussion.findMany({
      where: { parentId: id },
      include: {
        author: {
          select: { id: true, displayName: true, email: true, photoURL: true, role: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const decorated = replies.map((r) => ({
      ...r,
      hasVoted: req.user ? (r.voterIds || []).includes(req.user.id) : false,
    }));

    return success(res, decorated, 'Replies fetched');
  } catch (err) {
    return error(res, 'Failed to fetch replies', 500, err);
  }
};

// POST /api/v1/vault/discussions - Create a new Q&A discussion / thread
export const createResearchDiscussion = async (req, res) => {
  try {
    const { title, content, researchAreas, resourceId } = req.body;

    if (!content || !content.trim()) {
      return error(res, 'Content is required', 400);
    }

    const normalizedAreas = normalizeResearchAreas(researchAreas);

    const discussion = await prisma.researchDiscussion.create({
      data: {
        title: title?.trim() || null,
        content: content.trim(),
        researchAreas: normalizedAreas,
        resourceId: resourceId ? Number(resourceId) : null,
        parentId: null,
        authorId: req.user.id,
      },
      include: {
        author: {
          select: { id: true, displayName: true, email: true, photoURL: true, role: true },
        },
      },
    });

    return success(res, decorateDiscussion(discussion, req.user.id), 'Discussion created', 201);
  } catch (err) {
    return error(res, 'Failed to create discussion', 500, err);
  }
};

// POST /api/v1/vault/discussions/:id/replies - Create reply (strictly 1-level nesting enforced!)
export const createResearchDiscussionReply = async (req, res) => {
  try {
    const parentId = Number(req.params.id || req.body.parentId);
    const { content } = req.body;

    if (isNaN(parentId)) return error(res, 'Invalid parent discussion ID', 400);
    if (!content || !content.trim()) return error(res, 'Reply content is required', 400);

    // Look up parent discussion to enforce 1-level limit
    const parent = await prisma.researchDiscussion.findUnique({
      where: { id: parentId },
    });

    if (!parent) {
      return error(res, 'Parent discussion not found', 404);
    }

    // STRICT CONTROLLER ENFORCEMENT: Reply depth is limited to one level
    if (parent.parentId !== null) {
      return error(res, 'Replies cannot be nested beyond 1 level.', 400);
    }

    const reply = await prisma.researchDiscussion.create({
      data: {
        content: content.trim(),
        parentId: parent.id,
        resourceId: parent.resourceId || null,
        authorId: req.user.id,
      },
      include: {
        author: {
          select: { id: true, displayName: true, email: true, photoURL: true, role: true },
        },
      },
    });

    return success(res, decorateDiscussion(reply, req.user.id), 'Reply created', 201);
  } catch (err) {
    return error(res, 'Failed to create reply', 500, err);
  }
};

// PUT /api/v1/vault/discussions/:id - Update discussion or reply
export const updateResearchDiscussion = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return error(res, 'Invalid discussion ID', 400);

    const existing = await prisma.researchDiscussion.findUnique({ where: { id } });
    if (!existing) return error(res, 'Discussion not found', 404);

    const isOwner = existing.authorId === req.user.id;
    const isAdmin = ['RESEARCH_ADMIN', 'SUPER_ADMIN'].includes(req.user.role);

    if (!isOwner && !isAdmin) {
      return error(res, 'Not authorized to edit this discussion', 403);
    }

    const { title, content, researchAreas } = req.body;
    const data = {};

    if (title !== undefined) data.title = title?.trim() || null;
    if (content !== undefined) data.content = content.trim();
    if (researchAreas !== undefined) data.researchAreas = normalizeResearchAreas(researchAreas);

    const updated = await prisma.researchDiscussion.update({
      where: { id },
      data,
      include: {
        author: {
          select: { id: true, displayName: true, email: true, photoURL: true, role: true },
        },
      },
    });

    return success(res, decorateDiscussion(updated, req.user.id), 'Discussion updated');
  } catch (err) {
    return error(res, 'Failed to update discussion', 500, err);
  }
};

// DELETE /api/v1/vault/discussions/:id - Delete discussion or reply
export const deleteResearchDiscussion = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return error(res, 'Invalid discussion ID', 400);

    const existing = await prisma.researchDiscussion.findUnique({ where: { id } });
    if (!existing) return error(res, 'Discussion not found', 404);

    const isOwner = existing.authorId === req.user.id;
    const isAdmin = ['RESEARCH_ADMIN', 'SUPER_ADMIN'].includes(req.user.role);

    if (!isOwner && !isAdmin) {
      return error(res, 'Not authorized to delete this discussion', 403);
    }

    await prisma.researchDiscussion.delete({ where: { id } });
    return success(res, null, 'Discussion deleted successfully');
  } catch (err) {
    return error(res, 'Failed to delete discussion', 500, err);
  }
};

// POST /api/v1/vault/discussions/:id/vote - Single unified vote endpoint (atomic deduplicated raw SQL)
export const voteResearchDiscussion = async (req, res) => {
  try {
    const targetId = Number(req.params.replyId || req.params.id);
    const userId = Number(req.user.id);
    const { action, value } = req.body || {};

    if (isNaN(targetId)) return error(res, 'Invalid discussion or reply ID', 400);

    // Case 1: Explicit unvote / remove vote
    if (action === 'unvote' || value === 0) {
      const affected = await prisma.$executeRaw`
        UPDATE "ResearchDiscussion"
        SET upvotes = GREATEST(0, upvotes - 1),
            "voterIds" = array_remove("voterIds", ${userId})
        WHERE id = ${targetId} AND (${userId} = ANY("voterIds"))
      `;

      const updated = await prisma.researchDiscussion.findUnique({
        where: { id: targetId },
        select: { id: true, upvotes: true, voterIds: true },
      });

      if (!updated) return error(res, 'Discussion or reply not found', 404);

      return success(
        res,
        { id: targetId, upvotes: updated.upvotes, voteCount: updated.upvotes, hasVoted: false, modified: affected > 0 },
        'Vote removed'
      );
    }

    // Case 2: Explicit upvote
    if (action === 'upvote' || value === 1) {
      const affected = await prisma.$executeRaw`
        UPDATE "ResearchDiscussion"
        SET upvotes = upvotes + 1,
            "voterIds" = array_append("voterIds", ${userId})
        WHERE id = ${targetId} AND NOT (${userId} = ANY("voterIds"))
      `;

      const updated = await prisma.researchDiscussion.findUnique({
        where: { id: targetId },
        select: { id: true, upvotes: true, voterIds: true },
      });

      if (!updated) return error(res, 'Discussion or reply not found', 404);

      return success(
        res,
        { id: targetId, upvotes: updated.upvotes, voteCount: updated.upvotes, hasVoted: true, modified: affected > 0 },
        'Vote recorded'
      );
    }

    // Case 3: Toggle vote (default)
    // First attempt to append atomically if user has not yet voted
    const appendAffected = await prisma.$executeRaw`
      UPDATE "ResearchDiscussion"
      SET upvotes = upvotes + 1,
          "voterIds" = array_append("voterIds", ${userId})
      WHERE id = ${targetId} AND NOT (${userId} = ANY("voterIds"))
    `;

    if (appendAffected > 0) {
      const updated = await prisma.researchDiscussion.findUnique({
        where: { id: targetId },
        select: { id: true, upvotes: true },
      });
      return success(res, { id: targetId, upvotes: updated.upvotes, voteCount: updated.upvotes, hasVoted: true }, 'Upvoted successfully');
    }

    // Otherwise, toggle off by removing vote atomically
    const removeAffected = await prisma.$executeRaw`
      UPDATE "ResearchDiscussion"
      SET upvotes = GREATEST(0, upvotes - 1),
          "voterIds" = array_remove("voterIds", ${userId})
      WHERE id = ${targetId} AND (${userId} = ANY("voterIds"))
    `;

    if (removeAffected > 0) {
      const updated = await prisma.researchDiscussion.findUnique({
        where: { id: targetId },
        select: { id: true, upvotes: true },
      });
      return success(res, { id: targetId, upvotes: updated.upvotes, voteCount: updated.upvotes, hasVoted: false }, 'Vote removed successfully');
    }

    return error(res, 'Discussion or reply not found', 404);
  } catch (err) {
    return error(res, 'Failed to process vote', 500, err);
  }
};

// Alias for reply vote route: /discussions/:id/replies/:replyId/vote -> delegates to single vote handler
export const voteResearchReply = async (req, res) => {
  return voteResearchDiscussion(req, res);
};

// Accept discussion reply (e.g. Q&A accepted solution marker)
export const acceptResearchDiscussionReply = async (req, res) => {
  return success(res, { accepted: true }, 'Reply accepted');
};

// ── Resource / Experience Comment Handlers (maps comments directly to ResearchDiscussion) ──
export const getExperienceComments = async (req, res) => {
  try {
    const resourceId = Number(req.params.id);
    if (isNaN(resourceId)) return error(res, 'Invalid resource ID', 400);

    const comments = await prisma.researchDiscussion.findMany({
      where: {
        resourceId,
        parentId: null,
      },
      include: {
        author: {
          select: { id: true, displayName: true, email: true, photoURL: true, role: true },
        },
        replies: {
          include: {
            author: {
              select: { id: true, displayName: true, email: true, photoURL: true, role: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const decorated = comments.map((c) => decorateDiscussion(c, req.user?.id));
    return success(res, decorated, 'Comments fetched');
  } catch (err) {
    return error(res, 'Failed to fetch comments', 500, err);
  }
};

export const createExperienceComment = async (req, res) => {
  try {
    const resourceId = Number(req.params.id);
    const { content } = req.body;

    if (isNaN(resourceId)) return error(res, 'Invalid resource ID', 400);
    if (!content || !content.trim()) return error(res, 'Comment content is required', 400);

    const comment = await prisma.researchDiscussion.create({
      data: {
        content: content.trim(),
        resourceId,
        parentId: null,
        authorId: req.user.id,
      },
      include: {
        author: {
          select: { id: true, displayName: true, email: true, photoURL: true, role: true },
        },
      },
    });

    return success(res, decorateDiscussion(comment, req.user.id), 'Comment posted', 201);
  } catch (err) {
    return error(res, 'Failed to post comment', 500, err);
  }
};

export const deleteExperienceComment = async (req, res) => {
  try {
    const commentId = Number(req.params.commentId || req.params.id);
    if (isNaN(commentId)) return error(res, 'Invalid comment ID', 400);

    const existing = await prisma.researchDiscussion.findUnique({ where: { id: commentId } });
    if (!existing) return error(res, 'Comment not found', 404);

    const isOwner = existing.authorId === req.user.id;
    const isAdmin = ['RESEARCH_ADMIN', 'SUPER_ADMIN'].includes(req.user.role);

    if (!isOwner && !isAdmin) {
      return error(res, 'Not authorized to delete this comment', 403);
    }

    await prisma.researchDiscussion.delete({ where: { id: commentId } });
    return success(res, null, 'Comment deleted successfully');
  } catch (err) {
    return error(res, 'Failed to delete comment', 500, err);
  }
};
