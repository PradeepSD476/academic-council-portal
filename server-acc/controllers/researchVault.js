import prisma from '../config/db.js';
import { storage, bucketName } from '../config/minio.js';
import { isOpenOpening } from '../utils/openingStatus.js';

const userSummary = {
  select: { id: true, displayName: true, rollNo: true, photoURL: true, role: true }
};

const fail = (status, message) => Object.assign(new Error(message), { status });

const handle = (action) => async (req, res) => {
  try {
    const result = await action(req);
    const { status = 200, ...body } = result || {};
    return res.status(status).json({ success: true, ...body });
  } catch (error) {
    const status = error.status || (error.code === 'P2025' ? 404 : error.code === 'P2002' ? 409 : 500);
    if (status === 500) console.error('Research Vault request failed:', error);
    return res.status(status).json({
      success: false,
      message: status === 500 ? 'Research Vault request failed.' : error.message
    });
  }
};

const pagination = (query) => {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || 20));
  return { page, limit, skip: (page - 1) * limit };
};

const ids = (values) => [...new Set((Array.isArray(values) ? values : []).map(Number).filter(Number.isInteger))];
const areaLinks = (areaIds) => areaIds.map((researchAreaId) => ({ researchArea: { connect: { id: researchAreaId } } }));
const isAdmin = (user) => ['RESEARCH_ADMIN', 'SUPER_ADMIN', 'FACULTY'].includes(user?.role);
const parseId = (value) => {
  const id = Number.parseInt(value, 10);
  if (!Number.isInteger(id) || id < 1) throw fail(400, 'A valid ID is required.');
  return id;
};

const facultyInclude = {
  researchAreas: { include: { researchArea: true } },
  positions: { where: { isActive: true }, orderBy: { createdAt: 'desc' } }
};

// Compute the user-facing OPEN/CLOSED for each stored position row (see
// utils/openingStatus.js — the stored status column is only the admin's
// explicit switch, never trusted on the user side).
const withComputedOpenings = (profile, now = new Date()) => {
  if (!profile) return profile;
  const openings = (profile.positions || []).map((position) => ({
    ...position,
    computedStatus: isOpenOpening(position, now) ? 'OPEN' : 'CLOSED',
  }));
  return { ...profile, positions: openings, openOpeningsCount: openings.filter((o) => o.computedStatus === 'OPEN').length };
};

const experienceInclude = {
  faculty: { select: { id: true, name: true, slug: true, designation: true, department: true } },
  uploadedBy: userSummary,
  researchAreas: { include: { researchArea: true } },
  _count: { select: { likes: true, bookmarks: true, comments: true } }
};

const discussionInclude = {
  uploadedBy: userSummary,
  researchAreas: { include: { researchArea: true } },
  replies: {
    where: { parentId: null },
    include: {
      uploadedBy: userSummary,
      votes: true,
      replies: { include: { uploadedBy: userSummary, votes: true } }
    },
    orderBy: { createdAt: 'asc' }
  },
  _count: { select: { replies: true, votes: true } }
};

const facultyWhere = (query) => {
  const where = { isActive: true };
  const and = [];
  if (query.search) {
    and.push({
      OR: [
        { name: { contains: query.search, mode: 'insensitive' } },
        { department: { contains: query.search, mode: 'insensitive' } },
        { researchAreas: { some: { researchArea: { name: { contains: query.search, mode: 'insensitive' } } } } }
      ]
    });
  }
  if (query.department) where.department = { contains: query.department, mode: 'insensitive' };
  if (query.area) where.researchAreas = { some: { researchArea: { OR: [
    { slug: query.area }, { name: { contains: query.area, mode: 'insensitive' } }
  ] } } };
  // NOTE: the "Current openings" filter is NOT applied here — it needs a
  // column-to-column comparison (positionsFilled < positionsAvailable) that
  // Prisma where-clauses cannot express, so getFacultyProfiles resolves it
  // with a raw-SQL id prequery using the same computed rule.
  if (and.length) where.AND = and;
  return where;
};

const EXPERIENCE_TYPES = ['INTERNSHIP', 'THESIS', 'RA', 'INDEPENDENT_PROJECT', 'COURSE_PROJECT', 'OTHER'];

const experienceWhere = (query) => {
  const where = { status: 'APPROVED' };
  if (query.facultyId) where.facultyId = parseId(query.facultyId);
  if (query.department) where.faculty = { department: { contains: query.department, mode: 'insensitive' } };
  if (query.areaId) where.researchAreas = { some: { researchAreaId: parseId(query.areaId) } };
  if (query.experienceType) where.experienceType = query.experienceType;
  if (query.search) where.OR = [
    { title: { contains: query.search, mode: 'insensitive' } },
    { description: { contains: query.search, mode: 'insensitive' } },
    { labName: { contains: query.search, mode: 'insensitive' } },
    { faculty: { name: { contains: query.search, mode: 'insensitive' } } },
    { externalGuideName: { contains: query.search, mode: 'insensitive' } },
    { externalGuideAffiliation: { contains: query.search, mode: 'insensitive' } }
  ];
  return where;
};

const discussionWhere = (query) => {
  const where = {};
  if (query.areaId) where.researchAreas = { some: { researchAreaId: parseId(query.areaId) } };
  if (query.tag) where.researchAreas = { some: { researchArea: { slug: String(query.tag) } } };
  if (query.unanswered === 'true' || query.status === 'needs-reply') {
    where.isResolved = false;
    where.replies = { none: {} };
  } else if (query.resolved === 'true' || query.resolved === 'false' || query.status === 'resolved') {
    where.isResolved = query.resolved === 'false' ? false : true;
  }
  if (query.search) where.OR = [
    { title: { contains: query.search, mode: 'insensitive' } },
    { content: { contains: query.search, mode: 'insensitive' } }
  ];
  return where;
};

const questionSortOrder = (sort) => {
  if (sort === 'replies') return [{ replies: { _count: 'desc' } }, { createdAt: 'desc' }, { id: 'desc' }];
  if (sort === 'upvoted') return [{ votes: { _count: 'desc' } }, { createdAt: 'desc' }, { id: 'desc' }];
  return [{ createdAt: 'desc' }, { id: 'desc' }];
};

const replySortOrder = (sort) => {
  if (sort === 'oldest') return [{ createdAt: 'asc' }, { id: 'asc' }];
  if (sort === 'newest') return [{ createdAt: 'desc' }, { id: 'desc' }];
  return [{ isAccepted: 'desc' }, { votes: { _count: 'desc' } }, { createdAt: 'desc' }, { id: 'desc' }];
};

const encodeCursor = (id, sort, kind) => Buffer.from(JSON.stringify({ id, sort, kind })).toString('base64url');
const decodeCursor = (value, sort, kind) => {
  if (!value) return null;
  try {
    const cursor = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
    if (!Number.isInteger(cursor.id) || cursor.id < 1 || cursor.sort !== sort || cursor.kind !== kind) {
      throw new Error('Invalid cursor');
    }
    return { id: cursor.id };
  } catch {
    throw fail(400, 'Invalid pagination cursor.');
  }
};

const replaceAreas = (areaIds) => ({ deleteMany: {}, create: areaLinks(areaIds) });

export const getFacultyProfiles = handle(async (req) => {
  const { page, limit, skip } = pagination(req.query);
  const where = facultyWhere(req.query);
  // "Current openings" checkbox: faculty with at least one OPEN opening under
  // the computed rule (explicit OPEN status, seats remaining, deadline not
  // passed) — never the stale stored flags alone.
  if (req.query.openings === 'true') {
    const openIds = await prisma.$queryRaw`
      SELECT DISTINCT fp."id" FROM "research_vault"."FacultyProfile" fp
      JOIN "research_vault"."ResearchOpenPosition" p ON p."facultyId" = fp."id"
      WHERE fp."isActive" = true AND p."isActive" = true AND p."status" = 'OPEN'
        AND p."positionsFilled" < p."positionsAvailable"
        AND (p."deadline" IS NULL OR p."deadline" >= NOW())
    `;
    where.id = { in: openIds.map((row) => row.id) };
  }
  const [data, total] = await Promise.all([
    prisma.facultyProfile.findMany({ where, include: facultyInclude, orderBy: { name: 'asc' }, skip, take: limit }),
    prisma.facultyProfile.count({ where })
  ]);
  return { data: data.map((profile) => withComputedOpenings(profile)), page, limit, total, totalPages: Math.ceil(total / limit) };
});

// Standalone openings list for a faculty profile (used if the profile view
// ever paginates; profile endpoint already embeds the openings array).
export const getFacultyOpenings = handle(async (req) => {
  const profile = await prisma.facultyProfile.findFirst({
    where: { isActive: true, id: parseId(req.params.id) },
    include: facultyInclude
  });
  if (!profile) throw fail(404, 'Faculty profile not found.');
  const { positions } = withComputedOpenings(profile);
  return { data: positions };
});

export const getFacultyProfileById = handle(async (req) => {
  const numericId = Number.parseInt(req.params.id, 10);
  const profile = await prisma.facultyProfile.findFirst({
    where: { isActive: true, OR: [
      ...(Number.isInteger(numericId) ? [{ id: numericId }] : []),
      { slug: req.params.id }
    ] },
    include: facultyInclude
  });
  if (!profile) throw fail(404, 'Faculty profile not found.');
  await prisma.$executeRaw`UPDATE "research_vault"."FacultyProfile" SET "profileViewCount" = "profileViewCount" + 1 WHERE "id" = ${profile.id}`;
  const data = await prisma.facultyProfile.findUnique({ where: { id: profile.id }, include: facultyInclude });
  return { data: withComputedOpenings(data) };
});

export const createFacultyProfile = handle(async (req) => {
  const { researchAreaIds, ...data } = req.body;
  if (!data.name || !data.slug) throw fail(400, 'Name and slug are required.');
  const profile = await prisma.facultyProfile.create({
    data: { ...data, researchAreas: { create: areaLinks(ids(researchAreaIds)) } },
    include: facultyInclude
  });
  return { status: 201, data: profile };
});

export const updateFacultyProfile = handle(async (req) => {
  const id = parseId(req.params.id);
  const { researchAreaIds, id: ignoredId, ...data } = req.body;
  if (researchAreaIds !== undefined) data.researchAreas = replaceAreas(ids(researchAreaIds));
  const profile = await prisma.facultyProfile.update({ where: { id }, data, include: facultyInclude });
  return { data: profile };
});

export const deleteFacultyProfile = handle(async (req) => {
  const id = parseId(req.params.id);
  await prisma.facultyProfile.update({ where: { id }, data: { isActive: false } });
  return { message: 'Faculty profile archived.' };
});

export const getResearchExperiences = handle(async (req) => {
  const { page, limit, skip } = pagination(req.query);
  const where = experienceWhere(req.query);
  const [data, total] = await Promise.all([
    prisma.studentResearchExperience.findMany({ where, include: experienceInclude, orderBy: { createdAt: 'desc' }, skip, take: limit }),
    prisma.studentResearchExperience.count({ where })
  ]);
  return { data, page, limit, total, totalPages: Math.ceil(total / limit) };
});

export const getResearchModerationQueue = handle(async () => {
  const data = await prisma.studentResearchExperience.findMany({
    where: { status: 'PENDING_REVIEW' },
    include: experienceInclude,
    orderBy: { createdAt: 'asc' }
  });
  return { data };
});

// Public detail: APPROVED is public; PENDING_REVIEW/REJECTED visible only to
// the author or a research admin (so "My Submissions" can open its own items).
export const getResearchExperienceById = handle(async (req) => {
  const experience = await prisma.studentResearchExperience.findUnique({
    where: { id: parseId(req.params.id) },
    include: experienceInclude
  });
  if (!experience) throw fail(404, 'Research experience not found.');
  const isOwner = req.user && experience.uploadedById === req.user.id;
  const canModerate = req.user && isAdmin(req.user);
  if (experience.status !== 'APPROVED' && !isOwner && !canModerate) {
    throw fail(404, 'Research experience not found.');
  }
  return { data: experience };
});

export const getMyResearchExperiences = handle(async (req) => {
  const data = await prisma.studentResearchExperience.findMany({
    where: { uploadedById: req.user.id },
    include: experienceInclude,
    orderBy: { createdAt: 'desc' }
  });
  return { data };
});

export const createResearchExperience = handle(async (req) => {
  const { researchAreaIds, ...data } = req.body;
  if (!data.title || !data.labName || !data.duration || !data.description) {
    throw fail(400, 'Title, lab name, duration, and the full narrative are required.');
  }
  if (data.experienceType && !EXPERIENCE_TYPES.includes(data.experienceType)) {
    throw fail(400, 'Invalid experience type.');
  }
  // A guide is either an internal FacultyProfile link OR external free-text
  // details — never both.
  const hasFaculty = Boolean(data.facultyId);
  const hasExternal = Boolean((data.externalGuideName || '').trim());
  if (hasFaculty && hasExternal) throw fail(400, 'Choose either a faculty member or an external guide, not both.');
  data.externalGuideName = hasExternal ? data.externalGuideName.trim() : null;
  data.externalGuideAffiliation = hasExternal ? (data.externalGuideAffiliation || '').trim() || null : null;
  if (!hasFaculty) delete data.facultyId;
  delete data.status;
  delete data.uploadedById;
  delete data.reviewNote;
  const experience = await prisma.studentResearchExperience.create({
    data: {
      ...data,
      status: 'PENDING_REVIEW',
      uploadedBy: { connect: { id: req.user.id } },
      researchAreas: { create: areaLinks(ids(researchAreaIds)) }
    },
    include: experienceInclude
  });
  return { status: 201, data: experience };
});

// Moderation decision — research admins only (no dedicated UI yet).
export const setResearchExperienceStatus = handle(async (req) => {
  const status = req.body.status;
  if (!['APPROVED', 'REJECTED', 'PENDING_REVIEW'].includes(status)) {
    throw fail(400, 'Invalid status.');
  }
  const data = { status };
  if (req.body.reviewNote !== undefined) data.reviewNote = req.body.reviewNote;
  const experience = await prisma.studentResearchExperience.update({
    where: { id: parseId(req.params.id) },
    data,
    include: experienceInclude
  });
  return { data: experience, message: `Experience ${status === 'APPROVED' ? 'approved' : status === 'REJECTED' ? 'rejected' : 'moved back to review'}.` };
});

export const updateResearchExperience = handle(async (req) => {
  const id = parseId(req.params.id);
  const current = await prisma.studentResearchExperience.findUnique({ where: { id } });
  if (!current) throw fail(404, 'Research experience not found.');
  if (current.uploadedById !== req.user.id && !isAdmin(req.user)) throw fail(403, 'You cannot edit this experience.');
  const { researchAreaIds, id: ignoredId, uploadedById, ...data } = req.body;
  // Status/reviewNote are never client-settable here (admins use the dedicated
  // status route); editing an approved/rejected experience re-enters moderation.
  delete data.status;
  delete data.reviewNote;
  if (data.experienceType && !EXPERIENCE_TYPES.includes(data.experienceType)) {
    throw fail(400, 'Invalid experience type.');
  }
  // Same mutual exclusion on edits; clearing the external name also clears the
  // affiliation so stale details cannot linger after a guide-mode switch.
  if (data.externalGuideName !== undefined) {
    const hasExternal = Boolean((data.externalGuideName || '').trim());
    const hasFaculty = data.facultyId !== undefined ? Boolean(data.facultyId) : Boolean(current.facultyId);
    if (hasFaculty && hasExternal) throw fail(400, 'Choose either a faculty member or an external guide, not both.');
    data.externalGuideName = hasExternal ? data.externalGuideName.trim() : null;
    if (data.externalGuideAffiliation === undefined) data.externalGuideAffiliation = hasExternal ? current.externalGuideAffiliation : null;
    data.externalGuideAffiliation = hasExternal ? ((data.externalGuideAffiliation || '').trim() || null) : null;
    if (!hasFaculty) data.facultyId = null;
  }
  if (researchAreaIds !== undefined) data.researchAreas = replaceAreas(ids(researchAreaIds));
  if (!isAdmin(req.user) && current.status !== 'PENDING_REVIEW') data.status = 'PENDING_REVIEW';
  const experience = await prisma.studentResearchExperience.update({ where: { id }, data, include: experienceInclude });
  return { data: experience };
});

export const deleteResearchExperience = handle(async (req) => {
  await prisma.studentResearchExperience.delete({ where: { id: parseId(req.params.id) } });
  return { message: 'Research experience deleted.' };
});

// ── Experience comments (flat, soft-deleted; only the article is moderated) ──

const commentInclude = {
  uploadedBy: userSummary,
  deletedBy: { select: { displayName: true, role: true } }
};

export const getExperienceComments = handle(async (req) => {
  const rows = await prisma.researchExperienceComment.findMany({
    where: { experienceId: parseId(req.params.id) },
    include: commentInclude,
    orderBy: { createdAt: 'asc' }
  });
  // Soft-deleted comments stay in the thread as anonymous "[deleted]"
  // placeholders so replies/replies-context is not lost.
  const data = rows.map((row) => row.deletedAt
    ? { id: row.id, content: '[deleted]', deleted: true, createdAt: row.createdAt }
    : { ...row, deleted: false });
  return { data };
});

export const createExperienceComment = handle(async (req) => {
  const content = (req.body.content || '').trim();
  if (!content) throw fail(400, 'Comment cannot be empty.');
  if (content.length > 5000) throw fail(400, 'Comment is too long.');
  const experience = await prisma.studentResearchExperience.findUnique({
    where: { id: parseId(req.params.id) },
    select: { id: true, status: true, uploadedById: true }
  });
  if (!experience) throw fail(404, 'Research experience not found.');
  if (experience.status !== 'APPROVED' && experience.uploadedById !== req.user.id && !isAdmin(req.user)) {
    throw fail(403, 'Comments are open on approved experiences.');
  }
  const comment = await prisma.researchExperienceComment.create({
    data: { content, experienceId: experience.id, uploadedById: req.user.id },
    include: commentInclude
  });
  return { status: 201, data: comment };
});

export const deleteExperienceComment = handle(async (req) => {
  const comment = await prisma.researchExperienceComment.findUnique({
    where: { id: parseId(req.params.commentId) },
    select: { id: true, uploadedById: true }
  });
  if (!comment) throw fail(404, 'Comment not found.');
  if (comment.uploadedById !== req.user.id && !isAdmin(req.user)) {
    throw fail(403, 'You cannot delete this comment.');
  }
  await prisma.researchExperienceComment.update({
    where: { id: comment.id },
    data: { deletedAt: new Date(), deletedById: req.user.id }
  });
  return { message: 'Comment deleted.' };
});

export const getResearchDiscussions = handle(async (req) => {
  const { page, limit, skip } = pagination(req.query);
  const where = discussionWhere(req.query);
  const [data, total] = await Promise.all([
    prisma.researchDiscussion.findMany({
      where,
      include: {
        ...discussionInclude,
        votes: { where: { userId: req.user.id }, select: { id: true } }
      },
      orderBy: [{ isResolved: 'asc' }, { createdAt: 'desc' }], skip, take: limit
    }),
    prisma.researchDiscussion.count({ where })
  ]);
  return {
    data: data.map(({ votes, ...discussion }) => ({ ...discussion, hasVoted: votes.length > 0 })),
    page, limit, total, totalPages: Math.ceil(total / limit)
  };
});

export const getResearchDiscussionById = handle(async (req) => {
  const discussion = await prisma.researchDiscussion.findUnique({ where: { id: parseId(req.params.id) }, include: discussionInclude });
  if (!discussion) throw fail(404, 'Discussion not found.');
  return { data: discussion };
});

export const createResearchDiscussion = handle(async (req) => {
  const { researchAreaIds, ...data } = req.body;
  if (!data.title || !data.content) throw fail(400, 'Title and content are required.');
  delete data.uploadedById;
  const discussion = await prisma.researchDiscussion.create({
    data: {
      title: data.title,
      content: data.content,
      uploadedBy: { connect: { id: req.user.id } },
      researchAreas: { create: areaLinks(ids(researchAreaIds)) }
    },
    include: discussionInclude
  });
  return { status: 201, data: discussion };
});

export const updateResearchDiscussion = handle(async (req) => {
  const id = parseId(req.params.id);
  const current = await prisma.researchDiscussion.findUnique({ where: { id } });
  if (!current) throw fail(404, 'Discussion not found.');
  if (current.uploadedById !== req.user.id && !isAdmin(req.user)) throw fail(403, 'You cannot edit this discussion.');
  const { researchAreaIds, id: ignoredId, uploadedById, ...data } = req.body;
  if (researchAreaIds !== undefined) data.researchAreas = replaceAreas(ids(researchAreaIds));
  const discussion = await prisma.researchDiscussion.update({ where: { id }, data, include: discussionInclude });
  return { data: discussion };
});

export const deleteResearchDiscussion = handle(async (req) => {
  await prisma.researchDiscussion.delete({ where: { id: parseId(req.params.id) } });
  return { message: 'Discussion deleted.' };
});

export const createResearchDiscussionReply = handle(async (req) => {
  const discussionId = parseId(req.params.id);
  const { content, parentId } = req.body;
  if (!content) throw fail(400, 'Reply content is required.');
  if (parentId) {
    const parent = await prisma.researchDiscussionReply.findUnique({ where: { id: parseId(parentId) } });
    if (!parent || parent.discussionId !== discussionId) throw fail(400, 'Parent reply does not belong to this discussion.');
  }
  const reply = await prisma.researchDiscussionReply.create({
    data: { content, parentId: parentId ? parseId(parentId) : null, discussionId, uploadedById: req.user.id },
    include: { uploadedBy: userSummary, votes: true }
  });
  return { status: 201, data: reply };
});

export const acceptResearchDiscussionReply = handle(async (req) => {
  const discussionId = parseId(req.params.id);
  const replyId = parseId(req.params.replyId);
  const discussion = await prisma.researchDiscussion.findUnique({
    where: { id: discussionId },
    select: { id: true, uploadedById: true }
  });
  if (!discussion) throw fail(404, 'Discussion not found.');
  if (discussion.uploadedById !== req.user.id && !isAdmin(req.user)) {
    throw fail(403, 'Only the question author or a Research Vault admin can accept an answer.');
  }

  const reply = await prisma.researchDiscussionReply.findUnique({
    where: { id: replyId },
    select: { id: true, discussionId: true }
  });
  if (!reply || reply.discussionId !== discussionId) throw fail(404, 'Reply not found in this discussion.');

  const data = await prisma.$transaction(async (transaction) => {
    await transaction.researchDiscussionReply.updateMany({
      where: { discussionId },
      data: { isAccepted: false }
    });
    const acceptedReply = await transaction.researchDiscussionReply.update({
      where: { id: replyId },
      data: { isAccepted: true },
      include: { uploadedBy: userSummary }
    });
    await transaction.researchDiscussion.update({
      where: { id: discussionId },
      data: { isResolved: true }
    });
    return acceptedReply;
  });

  return { data };
});

export const voteResearchDiscussion = handle(async (req) => {
  const discussionId = parseId(req.params.id);
  const value = Number(req.body.value) < 0 ? -1 : 1;
  const where = { discussionId_userId: { discussionId, userId: req.user.id } };
  const existingVote = await prisma.researchDiscussionVote.findUnique({ where });

  if (existingVote?.value === value) {
    await prisma.researchDiscussionVote.delete({ where });
  } else if (existingVote) {
    await prisma.researchDiscussionVote.update({ where, data: { value } });
  } else {
    await prisma.researchDiscussionVote.create({ data: { discussionId, userId: req.user.id, value } });
  }

  const [voteCount, currentVote] = await Promise.all([
    prisma.researchDiscussionVote.count({ where: { discussionId } }),
    prisma.researchDiscussionVote.findUnique({ where })
  ]);
  return { data: { voteCount, hasVoted: Boolean(currentVote) } };
});

export const voteResearchReply = handle(async (req) => {
  const discussionId = parseId(req.params.id);
  const replyId = parseId(req.params.replyId);
  const reply = await prisma.researchDiscussionReply.findUnique({
    where: { id: replyId },
    select: { discussionId: true }
  });
  if (!reply || reply.discussionId !== discussionId) throw fail(404, 'Reply not found in this discussion.');

  const where = { replyId_userId: { replyId, userId: req.user.id } };
  const existingVote = await prisma.researchReplyVote.findUnique({ where });
  if (existingVote?.value === 1) {
    await prisma.researchReplyVote.delete({ where });
  } else if (existingVote) {
    await prisma.researchReplyVote.update({ where, data: { value: 1 } });
  } else {
    await prisma.researchReplyVote.create({ data: { replyId, userId: req.user.id, value: 1 } });
  }

  const [voteCount, currentVote] = await Promise.all([
    prisma.researchReplyVote.count({ where: { replyId } }),
    prisma.researchReplyVote.findUnique({ where })
  ]);
  return { data: { voteCount, hasVoted: Boolean(currentVote) } };
});

// ── Resource helpers ─────────────────────────────────────────────────────────

const PENDING_CAP = 10;

// Allowed URL schemes; rejects javascript:, data:, file:, etc.
const validateResourceUrl = (raw) => {
  if (!raw) return null;
  const trimmed = String(raw).trim();
  if (!trimmed) return null;
  if (trimmed.length > 2048) throw fail(422, 'URL must be 2048 characters or fewer.');
  let parsed;
  try { parsed = new URL(trimmed); } catch { throw fail(422, 'URL is not valid. It must start with http:// or https://.'); }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw fail(422, 'Only http and https URLs are allowed.');
  }
  return trimmed;
};

const resourceInclude = {
  researchAreas: { include: { researchArea: true } },
  uploadedBy: { select: { id: true, displayName: true, rollNo: true } },
  customArea: true
};

const CUSTOM_AREA_MAX = 60;
const cleanCustomAreaName = (value) => String(value || '').trim().replace(/\s+/g, ' ').slice(0, CUSTOM_AREA_MAX);

const resourceSortOrder = (sort) => {
  if (sort === 'most_viewed') return [{ viewCount: 'desc' }, { createdAt: 'desc' }];
  if (sort === 'most_downloaded') return [{ downloadCount: 'desc' }, { createdAt: 'desc' }];
  return [{ createdAt: 'desc' }]; // newest (default)
};

// ── Public resource browse (approved only) ───────────────────────────────────

export const getResearchResources = handle(async (req) => {
  const { page, limit, skip } = pagination(req.query);
  const where = { status: 'APPROVED' };
  if (req.query.category) where.resourceType = req.query.category;
  if (req.query.format) where.format = req.query.format;
  if (req.query.areaId) where.researchAreas = { some: { researchAreaId: parseId(req.query.areaId) } };
  if (req.query.search) {
    where.AND = [{
      OR: [
        { title: { contains: req.query.search, mode: 'insensitive' } },
        { description: { contains: req.query.search, mode: 'insensitive' } }
      ]
    }];
  }
  const sort = req.query.sort || 'newest';
  const [data, total] = await Promise.all([
    prisma.researchResource.findMany({
      where,
      include: resourceInclude,
      orderBy: resourceSortOrder(sort),
      skip,
      take: limit
    }),
    prisma.researchResource.count({ where })
  ]);
  return { data, page, limit, total, totalPages: Math.ceil(total / limit) };
});

// ── Record a unique view (one per user per resource) ─────────────────────────

export const recordResearchResourceView = handle(async (req) => {
  const resourceId = parseId(req.params.id);
  const userId = req.user.id;

  // Only count views on approved resources
  const resource = await prisma.researchResource.findFirst({
    where: { id: resourceId, status: 'APPROVED' },
    select: { id: true }
  });
  if (!resource) throw fail(404, 'Resource not found.');

  // Atomic upsert into ResourceView; increment view_count only on first insert
  const existing = await prisma.resourceView.findUnique({
    where: { resourceId_userId: { resourceId, userId } }
  });

  if (!existing) {
    await prisma.$transaction([
      prisma.resourceView.create({ data: { resourceId, userId } }),
      prisma.researchResource.update({
        where: { id: resourceId },
        data: { viewCount: { increment: 1 } }
      })
    ]);
  }

  const updated = await prisma.researchResource.findUnique({
    where: { id: resourceId },
    select: { viewCount: true }
  });
  return { data: { viewCount: updated.viewCount } };
});

// ── Download endpoint (authenticated, approved + file resources only) ─────────

export const downloadResearchResource = handle(async (req) => {
  const resourceId = parseId(req.params.id);

  const resource = await prisma.researchResource.findFirst({
    where: { id: resourceId, status: 'APPROVED' }
  });
  if (!resource) throw fail(404, 'Resource not found.');
  if (!resource.filePath) throw fail(404, 'This resource does not have a downloadable file.');

  // Increment download count
  await prisma.researchResource.update({
    where: { id: resourceId },
    data: { downloadCount: { increment: 1 } }
  });

  // Sanitize filename from title
  const safeTitle = (resource.title || 'resource')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 100);
  const ext = resource.mimeType === 'application/pdf' ? '.pdf'
    : resource.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ? '.docx'
    : '';
  const filename = `${safeTitle}${ext}`;

  // Stream from MinIO
  const stream = await storage.getObject(bucketName, resource.filePath);
  const inline = req.query.inline === '1' && resource.mimeType === 'application/pdf';

  // Return a special sentinel so handle() doesn't try to call res.json()
  const result = { __stream__: true, stream, filename, mimeType: resource.mimeType, inline };
  return result;
});

// Streaming handler needs direct access to res, so we use a wrapper
export const downloadResearchResourceHandler = async (req, res) => {
  const resourceId = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(resourceId) || resourceId < 1) {
    return res.status(400).json({ success: false, message: 'A valid ID is required.' });
  }
  try {
    const resource = await prisma.researchResource.findFirst({
      where: { id: resourceId, status: 'APPROVED' }
    });
    if (!resource) return res.status(404).json({ success: false, message: 'Resource not found.' });
    if (!resource.filePath) return res.status(404).json({ success: false, message: 'This resource does not have a downloadable file.' });

    await prisma.researchResource.update({
      where: { id: resourceId },
      data: { downloadCount: { increment: 1 } }
    });

    const safeTitle = (resource.title || 'resource')
      .replace(/[^\w\s-]/g, '').replace(/\s+/g, '_').slice(0, 100);
    const ext = resource.mimeType === 'application/pdf' ? '.pdf'
      : resource.mimeType?.includes('wordprocessingml') ? '.docx' : '';
    const filename = `${safeTitle}${ext}`;
    const inline = req.query.inline === '1' && resource.mimeType === 'application/pdf';
    const disposition = inline ? `inline; filename="${filename}"` : `attachment; filename="${filename}"`;

    res.setHeader('Content-Disposition', disposition);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (resource.mimeType) res.setHeader('Content-Type', resource.mimeType);
    if (resource.fileSize) res.setHeader('Content-Length', resource.fileSize);

    const stream = await storage.getObject(bucketName, resource.filePath);
    stream.pipe(res);
    stream.on('error', (err) => {
      console.error('MinIO stream error:', err);
      if (!res.headersSent) res.status(500).json({ success: false, message: 'File streaming failed.' });
    });
  } catch (err) {
    console.error('downloadResearchResourceHandler error:', err);
    if (!res.headersSent) res.status(500).json({ success: false, message: 'Research Vault request failed.' });
  }
};

// ── Old simple download counter (kept for admin panel compatibility) ──────────
export const recordResearchResourceDownload = handle(async (req) => {
  const data = await prisma.researchResource.update({
    where: { id: parseId(req.params.id) },
    data: { downloadCount: { increment: 1 } }
  });
  return { data };
});

// ── User resource submission (link-only, pending) ─────────────────────────────

export const submitResearchResource = handle(async (req) => {
  const userId = req.user.id;

  // Pending cap check
  const pendingCount = await prisma.researchResource.count({
    where: { uploadedById: userId, status: 'PENDING' }
  });
  if (pendingCount >= PENDING_CAP) {
    throw fail(429, `You already have ${PENDING_CAP} submissions pending review. Wait for some to be reviewed before submitting more.`);
  }

  const title = String(req.body.title || '').trim();
  const description = String(req.body.description || '').trim();
  const category = String(req.body.category || req.body.resourceType || 'GUIDE').trim().toUpperCase();
  const rawUrl = req.body.url;
  const researchAreaIds = ids(req.body.researchAreaIds);
  const consentConfirmed = req.body.consent_confirmed === true || req.body.consent_confirmed === 'true';

  if (!title) throw fail(400, 'Title is required.');
  if (title.length > 200) throw fail(422, 'Title must be 200 characters or fewer.');
  if (description.length > 1000) throw fail(422, 'Description must be 1000 characters or fewer.');
  if (!rawUrl) throw fail(400, 'A URL is required. Users may only submit links.');
  if (!consentConfirmed) throw fail(422, 'You must confirm that you have permission to share this content.');

  const url = validateResourceUrl(rawUrl);

  // Warn (don't block) on duplicate URL – return flag in response
  const duplicateApproved = await prisma.researchResource.findFirst({
    where: { url, status: 'APPROVED' },
    select: { id: true }
  });
  const duplicateOwn = await prisma.researchResource.findFirst({
    where: { url, uploadedById: userId },
    select: { id: true, status: true }
  });

  const resource = await prisma.researchResource.create({
    data: {
      title,
      description: description || null,
      url,
      format: 'link',
      sourceType: 'EXTERNAL_LINK',
      resourceType: category,
      status: 'PENDING',
      consent_confirmed: true,
      uploadedById: userId,
      researchAreas: { create: areaLinks(researchAreaIds) }
    },
    include: resourceInclude
  });

  // Custom "Other" research area: stored as a free-text tag flagged for
  // admin review/normalization — never added to the shared ResearchArea list.
  const customAreaName = cleanCustomAreaName(req.body.customArea);
  if (customAreaName) {
    await prisma.customResearchArea.create({
      data: { name: customAreaName, resourceId: resource.id }
    });
  }

  return {
    status: 201,
    data: resource,
    warnings: [
      duplicateApproved ? 'A resource with this URL is already published.' : null,
      (!duplicateApproved && duplicateOwn) ? 'You have already submitted a resource with this URL.' : null
    ].filter(Boolean)
  };
});

// ── My submissions ────────────────────────────────────────────────────────────

export const getMyResearchResources = handle(async (req) => {
  const data = await prisma.researchResource.findMany({
    where: { uploadedById: req.user.id },
    include: resourceInclude,
    orderBy: { createdAt: 'desc' }
  });
  return { data };
});

export const updateMyResearchResource = handle(async (req) => {
  const resourceId = parseId(req.params.id);
  const userId = req.user.id;

  const resource = await prisma.researchResource.findFirst({
    where: { id: resourceId, uploadedById: userId }
  });
  // Use 404 for both not-found and not-owned (no information leakage)
  if (!resource) throw fail(404, 'Resource not found.');
  if (resource.status !== 'PENDING') {
    throw fail(409, 'Only pending submissions can be edited.');
  }

  const title = req.body.title !== undefined ? String(req.body.title).trim() : resource.title;
  const description = req.body.description !== undefined ? String(req.body.description).trim() : resource.description;
  const category = req.body.category !== undefined
    ? String(req.body.category).trim().toUpperCase()
    : resource.resourceType;
  const researchAreaIds = req.body.researchAreaIds !== undefined ? ids(req.body.researchAreaIds) : null;

  if (!title) throw fail(400, 'Title is required.');
  if (title.length > 200) throw fail(422, 'Title must be 200 characters or fewer.');
  if (description && description.length > 1000) throw fail(422, 'Description must be 1000 characters or fewer.');

  // URL update for link resources
  let url = resource.url;
  if (req.body.url !== undefined) {
    url = validateResourceUrl(req.body.url);
  }

  const updateData = {
    title,
    description: description || null,
    url,
    resourceType: category,
    sourceType: 'EXTERNAL_LINK'
  };
  if (researchAreaIds !== null) {
    updateData.researchAreas = replaceAreas(researchAreaIds);
  }

  const updated = await prisma.researchResource.update({
    where: { id: resourceId },
    data: updateData,
    include: resourceInclude
  });

  // Keep the custom area tag in sync with the edit.
  if (req.body.customArea !== undefined) {
    const customAreaName = cleanCustomAreaName(req.body.customArea);
    const existingCustom = await prisma.customResearchArea.findUnique({ where: { resourceId } });
    if (!customAreaName) {
      if (existingCustom) await prisma.customResearchArea.delete({ where: { id: existingCustom.id } });
    } else if (existingCustom) {
      await prisma.customResearchArea.update({ where: { id: existingCustom.id }, data: { name: customAreaName } });
    } else {
      await prisma.customResearchArea.create({ data: { name: customAreaName, resourceId } });
    }
  }
  return { data: updated };
});

export const deleteMyResearchResource = handle(async (req) => {
  const resourceId = parseId(req.params.id);
  const userId = req.user.id;

  const resource = await prisma.researchResource.findFirst({
    where: { id: resourceId, uploadedById: userId }
  });
  if (!resource) throw fail(404, 'Resource not found.');
  if (resource.status !== 'PENDING') {
    throw fail(409, 'Only pending submissions can be withdrawn.');
  }

  await prisma.researchResource.delete({ where: { id: resourceId } });
  return { message: 'Submission withdrawn.' };
});

// ── Admin resource CRUD (unchanged) ──────────────────────────────────────────

export const createResearchResource = handle(async (req) => {
  const { researchAreaIds, ...data } = req.body;
  if (!data.title || (!data.url && !data.filePath)) throw fail(400, 'A title and resource URL or file are required.');
  delete data.uploadedById;
  delete data.sourceType; // derived, never client-supplied
  const resource = await prisma.researchResource.create({
    data: {
      ...data,
      sourceType: data.filePath ? 'FILE' : 'EXTERNAL_LINK',
      uploadedById: req.user.id,
      researchAreas: { create: areaLinks(ids(researchAreaIds)) }
    },
    include: resourceInclude
  });
  return { status: 201, data: resource };
});

export const updateResearchResource = handle(async (req) => {
  const id = parseId(req.params.id);
  const { researchAreaIds, id: ignoredId, uploadedById, sourceType, ...data } = req.body;
  if (researchAreaIds !== undefined) data.researchAreas = replaceAreas(ids(researchAreaIds));
  // Keep sourceType in sync when an admin changes filePath/url.
  if (data.filePath !== undefined || data.url !== undefined) {
    data.sourceType = data.filePath ? 'FILE' : 'EXTERNAL_LINK';
  }
  const resource = await prisma.researchResource.update({
    where: { id }, data, include: resourceInclude
  });
  return { data: resource };
});

export const deleteResearchResource = handle(async (req) => {
  await prisma.researchResource.delete({ where: { id: parseId(req.params.id) } });
  return { message: 'Research resource deleted.' };
});

export const getResearchResourceModerationQueue = handle(async (req) => {
  const data = await prisma.researchResource.findMany({
    where: { status: 'PENDING' },
    include: resourceInclude,
    orderBy: { createdAt: 'asc' }
  });
  return { data };
});

export const setResearchResourceStatus = handle(async (req) => {
  const id = parseId(req.params.id);
  const { status, reviewNote } = req.body;
  if (!['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
    throw fail(400, 'Invalid status.');
  }
  const current = await prisma.researchResource.findUnique({ where: { id } });
  if (!current) throw fail(404, 'Resource not found.');

  const data = { status, reviewedAt: new Date() };
  if (status === 'APPROVED') {
    data.approvedById = req.user.id;
    data.rejection_reason = null;
  } else if (status === 'REJECTED') {
    data.rejection_reason = reviewNote || null;
    data.approvedById = null;
  }
  
  const resource = await prisma.researchResource.update({
    where: { id },
    data,
    include: resourceInclude
  });
  return { data: resource, message: `Resource ${status.toLowerCase()}.` };
});

export const getResearchAreas = handle(async (req) => {
  const search = String(req.query.search || '').trim();
  const data = await prisma.researchArea.findMany({
    where: search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    } : {},
    orderBy: { name: 'asc' }
  });
  return { data };
});

export const createResearchArea = handle(async (req) => {
  const name = String(req.body.name || '').trim();
  const slug = String(req.body.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')).trim();
  if (!name || !slug) throw fail(400, 'Research area name and slug are required.');
  const data = await prisma.researchArea.create({ data: { name, slug, description: req.body.description || null } });
  return { status: 201, data };
});

const normalizeMatchText = (value) => String(value || '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

const relevanceScore = (query, candidate) => {
  if (!query || !candidate) return 0;
  const normalizedQuery = normalizeMatchText(query);
  const normalizedCandidate = normalizeMatchText(candidate);
  if (!normalizedQuery || !normalizedCandidate) return 0;
  if (normalizedQuery === normalizedCandidate) return 1;

  const terms = normalizedQuery.split(' ').filter((term) => term.length > 1);
  if (!terms.length) return normalizedCandidate.includes(normalizedQuery) ? 0.8 : 0;
  const matchedTerms = terms.filter((term) => normalizedCandidate.includes(term));
  return matchedTerms.length / terms.length;
};

const positionTypeAliases = {
  'summer research': ['SUMMER', 'SUMMER_RESEARCH'],
  thesis: ['THESIS', 'THESIS_SLOT'],
  'reading project': ['READING', 'READING_PROJECT'],
  'ra ship': ['RA', 'RA_SHIP', 'RESEARCH_ASSISTANTSHIP']
};

export const getInterestMatch = handle(async (req) => {
  const department = String(req.body.department || '').trim();
  const subArea = String(req.body.subArea || '').trim();
  const projectType = String(req.body.projectType || '').trim();
  if (!department && !subArea && !projectType) {
    throw fail(400, 'Choose at least one interest to get faculty recommendations.');
  }

  await prisma.researchInterest.upsert({
    where: { userId: req.user.id },
    create: { userId: req.user.id, department: department || null, subArea: subArea || null, projectType: projectType || null },
    update: { department: department || null, subArea: subArea || null, projectType: projectType || null }
  });

  const faculty = await prisma.facultyProfile.findMany({
    where: { isActive: true },
    include: facultyInclude,
    orderBy: { name: 'asc' }
  });
  const normalizedProjectType = normalizeMatchText(projectType);
  const expectedPositionTypes = positionTypeAliases[normalizedProjectType] || [];
  const possiblePoints = (department ? 4 : 0) + (subArea ? 6 : 0) + (projectType ? 2 : 0);

  const data = faculty.map((profile) => {
    const departmentMatch = relevanceScore(department, profile.department);
    const profileAreas = profile.researchAreas.map(({ researchArea }) => researchArea);
    const areaMatches = subArea
      ? profileAreas
        .map((area) => ({ area, score: relevanceScore(subArea, `${area.name} ${area.description || ''}`) }))
        .filter(({ score }) => score > 0)
        .sort((left, right) => right.score - left.score)
      : [];
    const areaMatch = areaMatches[0]?.score || 0;
    // Only computed-OPEN openings count toward the project-type signal —
    // recommending a closed/filled/expired opening would mislead students.
    const openPositions = profile.positions.filter((position) => isOpenOpening(position));
    const matchingPositions = projectType && expectedPositionTypes.length
      ? openPositions.filter((position) => expectedPositionTypes.includes(normalizeMatchText(position.positionType).replaceAll(' ', '_')))
      : [];
    const projectMatch = matchingPositions.length ? 1 : 0;
    let points = departmentMatch * 4 + areaMatch * 6 + projectMatch * 2;
    // Deprioritize (never exclude) profiles with nothing open right now.
    if (!openPositions.length) points *= 0.5;
    const matchReasons = [];

    if (departmentMatch) matchReasons.push(`Department: ${profile.department}`);
    if (areaMatches.length) matchReasons.push(`Research area: ${areaMatches[0].area.name}`);
    if (matchingPositions.length) matchReasons.push(`Has an active ${projectType} opening`);
    else if (openPositions.length) matchReasons.push(`${openPositions.length} open position${openPositions.length === 1 ? '' : 's'}`);

    const annotated = withComputedOpenings(profile);
    return {
      ...annotated,
      matchScore: Math.round((points / possiblePoints) * 100),
      matchReasons
    };
  })
    .filter((profile) => profile.matchScore > 0)
    .sort((left, right) => right.matchScore - left.matchScore || left.name.localeCompare(right.name))
    .slice(0, 5);

  return { data };
});

export const followFaculty = handle(async (req) => {
  const facultyProfileId = parseId(req.body.facultyId);
  const data = await prisma.researchFacultyFollow.upsert({
    where: { userId_facultyProfileId: { userId: req.user.id, facultyProfileId } },
    create: { userId: req.user.id, facultyProfileId },
    update: {}
  });
  return { status: 201, data };
});

export const getResearchFollows = handle(async (req) => {
  const [facultyFollows, areaFollows] = await Promise.all([
    prisma.researchFacultyFollow.findMany({ where: { userId: req.user.id }, select: { facultyProfileId: true } }),
    prisma.researchAreaFollow.findMany({ where: { userId: req.user.id }, select: { researchAreaId: true } })
  ]);
  return {
    data: {
      facultyIds: facultyFollows.map(({ facultyProfileId }) => facultyProfileId),
      areaIds: areaFollows.map(({ researchAreaId }) => researchAreaId)
    }
  };
});

export const getFollowingUpdates = handle(async (req) => {
  const [facultyFollows, areaFollows, positionBookmarks] = await Promise.all([
    prisma.researchFacultyFollow.findMany({ where: { userId: req.user.id }, select: { facultyProfileId: true } }),
    prisma.researchAreaFollow.findMany({ where: { userId: req.user.id }, select: { researchAreaId: true } }),
    prisma.researchOpenPositionBookmark.findMany({ where: { userId: req.user.id }, select: { positionId: true } })
  ]);
  const followedFacultyIds = facultyFollows.map(({ facultyProfileId }) => facultyProfileId);
  const followedAreaIds = areaFollows.map(({ researchAreaId }) => researchAreaId);
  const bookmarkedPositionIds = positionBookmarks.map(({ positionId }) => positionId);
  if (!followedFacultyIds.length && !followedAreaIds.length && !bookmarkedPositionIds.length) return { data: [] };

  const filterFacultyIds = req.query.facultyIds ? req.query.facultyIds.split(',').map(id => parseInt(id)).filter(id => !isNaN(id)) : [];
  const filterAreaIds = req.query.areaIds ? req.query.areaIds.split(',').map(id => parseInt(id)).filter(id => !isNaN(id)) : [];

  let facultyIds = filterFacultyIds.length ? filterFacultyIds : followedFacultyIds;
  let areaIds = filterAreaIds.length ? filterAreaIds : followedAreaIds;

  if (filterFacultyIds.length > 0 && filterAreaIds.length === 0) {
    const facultyAreas = await prisma.facultyProfile.findMany({
      where: { id: { in: facultyIds } },
      select: { researchAreas: { select: { researchAreaId: true } } }
    });
    const facultyAreaIds = facultyAreas.flatMap(f => f.researchAreas.map(ra => ra.researchAreaId));
    areaIds = [...new Set([...areaIds, ...facultyAreaIds])];
  }

  const activityAreas = { researchAreas: { include: { researchArea: true } } };
  const areaSource = (entries) => entries.map(({ researchArea }) => researchArea.name).join(', ');
  const areaFilter = areaIds.length ? [{ researchAreas: { some: { researchAreaId: { in: areaIds } } } }] : [];
  const facultyFilter = facultyIds.length ? [{ facultyId: { in: facultyIds } }] : [];
  const discussionFilter = areaIds.length ? { researchAreas: { some: { researchAreaId: { in: areaIds } } } } : null;

  const [experiences, positions, discussions, resources] = await Promise.all([
    prisma.studentResearchExperience.findMany({
      // ExperienceStatus enum (PENDING_REVIEW/APPROVED/REJECTED) replaced the
      // old ContentStatus values on this model; querying 'PUBLISHED' throws.
      where: { status: 'APPROVED', OR: [...facultyFilter, ...areaFilter] },
      include: { ...activityAreas, faculty: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }, take: 20
    }),
    (facultyIds.length || bookmarkedPositionIds.length) ? prisma.researchOpenPosition.findMany({
      where: {
        isActive: true,
        OR: [
          ...(facultyIds.length ? [{ facultyId: { in: facultyIds } }] : []),
          ...(bookmarkedPositionIds.length ? [{ id: { in: bookmarkedPositionIds } }] : [])
        ]
      },
      include: { faculty: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }, take: 20
    }) : Promise.resolve([]),
    discussionFilter ? prisma.researchDiscussion.findMany({
      where: discussionFilter,
      include: { ...activityAreas, uploadedBy: userSummary },
      orderBy: { createdAt: 'desc' }, take: 20
    }) : Promise.resolve([]),
    areaIds.length ? prisma.researchResource.findMany({
      where: { researchAreas: { some: { researchAreaId: { in: areaIds } } } },
      include: activityAreas,
      orderBy: { createdAt: 'desc' }, take: 20
    }) : Promise.resolve([])
  ]);

  const data = [
    ...experiences.map((item) => ({
      id: `experience-${item.id}`, type: 'experience', title: item.title,
      detail: item.description, source: item.faculty?.name || areaSource(item.researchAreas),
      createdAt: item.createdAt
    })),
    ...positions.map((item) => ({
      id: `position-${item.id}`, type: 'position', title: item.title,
      detail: item.description, source: item.faculty?.name || 'Followed faculty',
      url: `/dashboard/research-vault/positions/${item.id}`,
      createdAt: item.createdAt
    })),
    ...discussions.map((item) => ({
      id: `discussion-${item.id}`, type: 'discussion', title: item.title,
      detail: item.content, source: areaSource(item.researchAreas) || item.uploadedBy?.displayName || 'Followed research area',
      createdAt: item.createdAt
    })),
    ...resources.map((item) => ({
      id: `resource-${item.id}`, type: 'resource', title: item.title,
      detail: item.description, source: areaSource(item.researchAreas),
      createdAt: item.createdAt
    }))
  ].sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt)).slice(0, 30);

  return { data };
});

export const unfollowFaculty = handle(async (req) => {
  await prisma.researchFacultyFollow.deleteMany({ where: { userId: req.user.id, facultyProfileId: parseId(req.params.id) } });
  return { message: 'Faculty follow removed.' };
});

export const followResearchArea = handle(async (req) => {
  const researchAreaId = parseId(req.body.areaId);
  const data = await prisma.researchAreaFollow.upsert({
    where: { userId_researchAreaId: { userId: req.user.id, researchAreaId } },
    create: { userId: req.user.id, researchAreaId },
    update: {}
  });
  return { status: 201, data };
});

export const unfollowResearchArea = handle(async (req) => {
  await prisma.researchAreaFollow.deleteMany({ where: { userId: req.user.id, researchAreaId: parseId(req.params.id) } });
  return { message: 'Research area follow removed.' };
});

const positionInclude = {
  faculty: { select: { id: true, name: true, slug: true, designation: true, department: true, photoURL: true } },
  researchAreas: { include: { researchArea: true } },
};

export const getOpenPositions = handle(async (req) => {
  const includeClosed = req.query.includeClosed === 'true';
  const now = new Date();
  const where = {};
  if (!includeClosed) {
    // Active + not past deadline (auto-archive expired postings)
    where.isActive = true;
    where.OR = [{ deadline: null }, { deadline: { gte: now } }];
  }
  if (req.query.facultyId) where.facultyId = parseId(req.query.facultyId);
  if (req.query.department) where.faculty = { department: { contains: req.query.department, mode: 'insensitive' } };
  if (req.query.areaId) where.researchAreas = { some: { researchAreaId: parseId(req.query.areaId) } };
  if (req.query.positionType) where.positionType = req.query.positionType;
  if (req.query.search) {
    where.OR = [
      { title: { contains: req.query.search, mode: 'insensitive' } },
      { faculty: { name: { contains: req.query.search, mode: 'insensitive' } } }
    ];
  }
  const sort = req.query.sort || 'deadline';
  const orderBy =
    sort === 'newest' ? [{ createdAt: 'desc' }] :
    sort === 'department' ? [{ faculty: { department: 'asc' } }, { deadline: 'asc' }] :
    [{ deadline: 'asc' }, { createdAt: 'desc' }];
  const data = await prisma.researchOpenPosition.findMany({
    where,
    include: positionInclude,
    orderBy
  });
  // Per-user bookmark flags (getResearchPositions included for consistency)
  let bookmarkedIds = new Set();
  if (req.user) {
    const bookmarks = await prisma.researchOpenPositionBookmark.findMany({
      where: { userId: req.user.id },
      select: { positionId: true }
    });
    bookmarkedIds = new Set(bookmarks.map((b) => b.positionId));
  }
  return { data: data.map((p) => ({ ...p, bookmarked: bookmarkedIds.has(p.id) })) };
});

export const getOpenPositionById = handle(async (req) => {
  const position = await prisma.researchOpenPosition.findUnique({
    where: { id: parseId(req.params.id) },
    include: positionInclude
  });
  if (!position) throw fail(404, 'Position not found.');
  let bookmarked = false;
  if (req.user) {
    const bookmark = await prisma.researchOpenPositionBookmark.findUnique({
      where: { positionId_userId: { positionId: position.id, userId: req.user.id } }
    });
    bookmarked = Boolean(bookmark);
  }
  return { data: { ...position, bookmarked } };
});

// ── Position bookmarks (same pattern as faculty/area follows) ────────────────

export const bookmarkPosition = handle(async (req) => {
  const positionId = parseId(req.body.positionId);
  const position = await prisma.researchOpenPosition.findUnique({ where: { id: positionId }, select: { id: true } });
  if (!position) throw fail(404, 'Position not found.');
  await prisma.researchOpenPositionBookmark.upsert({
    where: { positionId_userId: { positionId, userId: req.user.id } },
    create: { positionId, userId: req.user.id },
    update: {}
  });
  return { status: 201, message: 'Position saved.' };
});

export const unbookmarkPosition = handle(async (req) => {
  await prisma.researchOpenPositionBookmark.deleteMany({
    where: { userId: req.user.id, positionId: parseId(req.params.id) }
  });
  return { message: 'Position bookmark removed.' };
});

export const getResearchPositionBookmarks = handle(async (req) => {
  const bookmarks = await prisma.researchOpenPositionBookmark.findMany({
    where: { userId: req.user.id },
    select: { positionId: true }
  });
  return { data: { positionIds: bookmarks.map((b) => b.positionId) } };
});

export const createOpenPosition = handle(async (req) => {
  const { id: ignoredId, uploadedById, ...data } = req.body;
  if (!data.title) throw fail(400, 'Position title is required.');
  if (data.deadline) data.deadline = new Date(data.deadline);
  if (data.facultyId) data.facultyId = parseId(data.facultyId);
  const position = await prisma.researchOpenPosition.create({
    data: { ...data, uploadedById: req.user.id },
    include: { faculty: true }
  });
  return { status: 201, data: position };
});

export const updateOpenPosition = handle(async (req) => {
  const { id: ignoredId, uploadedById, ...data } = req.body;
  if (data.deadline === '') data.deadline = null;
  else if (data.deadline) data.deadline = new Date(data.deadline);
  if (data.facultyId) data.facultyId = parseId(data.facultyId);
  const position = await prisma.researchOpenPosition.update({
    where: { id: parseId(req.params.id) }, data, include: { faculty: true }
  });
  return { data: position };
});

export const deleteOpenPosition = handle(async (req) => {
  await prisma.researchOpenPosition.delete({ where: { id: parseId(req.params.id) } });
  return { message: 'Research position deleted.' };
});

export const getResearchAnalytics = handle(async () => {
  const [facultyCount, experienceCount, pendingExperiences, discussionCount, unansweredDiscussions, resources, faculty] = await Promise.all([
    prisma.facultyProfile.count({ where: { isActive: true } }),
    prisma.studentResearchExperience.count({ where: { status: 'APPROVED' } }),
    prisma.studentResearchExperience.count({ where: { status: 'PENDING_REVIEW' } }),
    prisma.researchDiscussion.count(),
    prisma.researchDiscussion.count({ where: { isResolved: false, replies: { none: {} } } }),
    prisma.researchResource.findMany({ orderBy: [{ viewCount: 'desc' }, { downloadCount: 'desc' }], take: 10 }),
    prisma.$queryRaw`SELECT "id", "name", "department", "profileViewCount" FROM "research_vault"."FacultyProfile" WHERE "isActive" = true ORDER BY "profileViewCount" DESC LIMIT 10`
  ]);
  const researchAreas = await prisma.researchArea.findMany({
    include: { _count: { select: { facultyProfiles: true, experiences: true, discussions: true, resources: true } } },
    orderBy: { name: 'asc' }
  });
  return {
    data: {
      facultyCount, experienceCount, pendingExperiences, discussionCount, unansweredDiscussions,
      topResources: resources, topFaculty: faculty, researchAreas
    }
  };
});

export const getQuestionList = handle(async (req) => {
  const sort = ['newest', 'replies', 'upvoted'].includes(req.query.sort) ? req.query.sort : 'newest';
  const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
  const cursor = decodeCursor(req.query.cursor, sort, 'question');
  const where = discussionWhere(req.query);
  const [rows, total] = await Promise.all([
    prisma.researchDiscussion.findMany({
      where,
      orderBy: questionSortOrder(sort),
      ...(cursor ? { cursor, skip: 1 } : {}),
      take: limit + 1,
      include: {
        uploadedBy: userSummary,
        researchAreas: { include: { researchArea: true } },
        votes: { where: { userId: req.user.id }, select: { id: true } },
        _count: { select: { replies: true, votes: true } }
      }
    }),
    prisma.researchDiscussion.count({ where })
  ]);

  const hasMore = rows.length > limit;
  const page = rows.slice(0, limit).map(({ votes, _count, ...question }) => ({
    ...question,
    hasVoted: votes.length > 0,
    replyCount: _count.replies,
    voteCount: _count.votes
  }));
  const last = page.at(-1);
  return {
    data: {
      items: page,
      total,
      has_more: hasMore,
      next_cursor: hasMore && last ? encodeCursor(last.id, sort, 'question') : null
    }
  };
});

export const getQuestionDetail = handle(async (req) => {
  const id = parseId(req.params.id);
  const sort = ['newest', 'replies', 'upvoted'].includes(req.query.sort) ? req.query.sort : 'newest';
  const listWhere = discussionWhere(req.query);

  const question = await prisma.researchDiscussion.findFirst({
    where: { AND: [listWhere, { id }] },
    include: {
      uploadedBy: userSummary,
      researchAreas: { include: { researchArea: true } },
      votes: { where: { userId: req.user.id }, select: { id: true } },
      _count: { select: { replies: true, votes: true } }
    }
  });
  if (!question) throw fail(404, 'Question not found.');

  const [replyCount, initialReplies, previous, next, total, position] = await Promise.all([
    prisma.researchDiscussionReply.count({ where: { discussionId: id } }),
    prisma.researchDiscussionReply.findMany({
      where: { discussionId: id, parentId: null },
      orderBy: replySortOrder('top'),
      take: 3,
      include: {
        uploadedBy: userSummary,
        votes: { where: { userId: req.user.id }, select: { id: true } },
        _count: { select: { votes: true, replies: true } }
      }
    }),
    prisma.researchDiscussion.findMany({ where: listWhere, orderBy: questionSortOrder(sort), cursor: { id }, skip: 1, take: -1, select: { id: true } }),
    prisma.researchDiscussion.findMany({ where: listWhere, orderBy: questionSortOrder(sort), cursor: { id }, skip: 1, take: 1, select: { id: true } }),
    prisma.researchDiscussion.count({ where: listWhere }),
    sort === 'newest'
      ? prisma.researchDiscussion.count({
        where: {
          AND: [listWhere, {
            OR: [
              { createdAt: { gt: question.createdAt } },
              { createdAt: question.createdAt, id: { gt: id } }
            ]
          }]
        }
      })
      : Promise.resolve(null)
  ]);

  const replies = initialReplies.map(({ votes, _count, ...reply }) => ({
    ...reply,
    hasVoted: votes.length > 0,
    voteCount: _count.votes,
    childReplyCount: _count.replies
  }));
  const lastReply = replies.at(-1);
  const { votes, _count, ...questionData } = question;

  return {
    data: {
      ...questionData,
      hasVoted: votes.length > 0,
      voteCount: _count.votes,
      replyCount,
      replies,
      replies_has_more: replyCount > replies.length,
      replies_next_cursor: lastReply ? encodeCursor(lastReply.id, 'top', 'reply') : null,
      previous_id: previous[0]?.id || null,
      next_id: next[0]?.id || null,
      position: position === null ? null : position + 1,
      total
    }
  };
});

export const getQuestionReplies = handle(async (req) => {
  const discussionId = parseId(req.params.id);
  const sort = ['top', 'newest', 'oldest'].includes(req.query.sort) ? req.query.sort : 'top';
  const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
  const cursor = decodeCursor(req.query.cursor, sort, 'reply');
  const discussionExists = await prisma.researchDiscussion.findUnique({ where: { id: discussionId }, select: { id: true } });
  if (!discussionExists) throw fail(404, 'Question not found.');

  const where = { discussionId, parentId: null };
  const [rows, total] = await Promise.all([
    prisma.researchDiscussionReply.findMany({
      where,
      orderBy: replySortOrder(sort),
      ...(cursor ? { cursor, skip: 1 } : {}),
      take: limit + 1,
      include: {
        uploadedBy: userSummary,
        votes: { where: { userId: req.user.id }, select: { id: true } },
        _count: { select: { votes: true, replies: true } }
      }
    }),
    prisma.researchDiscussionReply.count({ where })
  ]);

  const hasMore = rows.length > limit;
  const page = rows.slice(0, limit).map(({ votes, _count, ...reply }) => ({
    ...reply,
    hasVoted: votes.length > 0,
    voteCount: _count.votes,
    childReplyCount: _count.replies
  }));
  const last = page.at(-1);
  return {
    data: {
      items: page,
      total,
      has_more: hasMore,
      next_cursor: hasMore && last ? encodeCursor(last.id, sort, 'reply') : null
    }
  };
});

export const getCustomAreasQueue = async (req, res, next) => {
  try {
    const customAreas = await prisma.customResearchArea.findMany({
      where: { status: 'PENDING' },
      include: {
        resource: { select: { id: true, title: true, url: true } }
      },
      orderBy: { createdAt: 'asc' }
    });
    res.json({ success: true, data: customAreas });
  } catch (err) { next(err); }
};

export const moderateCustomArea = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { status, action, slug, name, researchAreaId } = req.body;
    
    const customArea = await prisma.customResearchArea.findUnique({ where: { id } });
    if (!customArea) return res.status(404).json({ success: false, message: 'Not found' });

    if (status === 'REJECTED') {
      await prisma.customResearchArea.update({ where: { id }, data: { status: 'REJECTED' } });
      return res.json({ success: true, message: 'Rejected' });
    }

    if (status === 'APPROVED') {
      let finalAreaId = researchAreaId;
      if (action === 'CREATE') {
        const finalName = name || customArea.name;
        const finalSlug = String(slug || finalName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')).trim();
        const newArea = await prisma.researchArea.create({
          data: { name: finalName, slug: finalSlug }
        });
        finalAreaId = newArea.id;
      }
      
      if (finalAreaId && customArea.resourceId) {
        await prisma.researchResourceResearchArea.upsert({
          where: { resourceId_researchAreaId: { resourceId: customArea.resourceId, researchAreaId: finalAreaId } },
          create: { resourceId: customArea.resourceId, researchAreaId: finalAreaId },
          update: {}
        });
      }
      await prisma.customResearchArea.update({ where: { id }, data: { status: 'APPROVED' } });
      return res.json({ success: true, message: 'Approved' });
    }

    res.status(400).json({ success: false, message: 'Invalid status' });
  } catch (err) { next(err); }
};