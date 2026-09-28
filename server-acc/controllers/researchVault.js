import prisma from '../config/db.js';
import { storage, bucketName } from '../config/minio.js';

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

const experienceInclude = {
  faculty: { select: { id: true, name: true, slug: true, department: true } },
  uploadedBy: userSummary,
  researchAreas: { include: { researchArea: true } },
  _count: { select: { likes: true, bookmarks: true } }
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
  if (query.openings === 'true') where.positions = { some: { isActive: true } };
  if (and.length) where.AND = and;
  return where;
};

const experienceWhere = (query, includeDrafts = false) => {
  const where = includeDrafts ? {} : { status: 'PUBLISHED' };
  if (query.facultyId) where.facultyId = parseId(query.facultyId);
  if (query.department) where.faculty = { department: { contains: query.department, mode: 'insensitive' } };
  if (query.areaId) where.researchAreas = { some: { researchAreaId: parseId(query.areaId) } };
  if (query.search) where.OR = [
    { title: { contains: query.search, mode: 'insensitive' } },
    { description: { contains: query.search, mode: 'insensitive' } },
    { labName: { contains: query.search, mode: 'insensitive' } },
    { guideName: { contains: query.search, mode: 'insensitive' } }
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
  const [data, total] = await Promise.all([
    prisma.facultyProfile.findMany({ where, include: facultyInclude, orderBy: { name: 'asc' }, skip, take: limit }),
    prisma.facultyProfile.count({ where })
  ]);
  return { data, page, limit, total, totalPages: Math.ceil(total / limit) };
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
  return { data };
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
    where: { status: 'DRAFT' },
    include: experienceInclude,
    orderBy: { createdAt: 'asc' }
  });
  return { data };
});

export const getResearchExperienceById = handle(async (req) => {
  const experience = await prisma.studentResearchExperience.findFirst({
    where: { id: parseId(req.params.id), status: 'PUBLISHED' },
    include: experienceInclude
  });
  if (!experience) throw fail(404, 'Research experience not found.');
  return { data: experience };
});

export const createResearchExperience = handle(async (req) => {
  const { researchAreaIds, ...data } = req.body;
  if (!data.title || !data.description) throw fail(400, 'Title and description are required.');
  delete data.status;
  delete data.uploadedById;
  const experience = await prisma.studentResearchExperience.create({
    data: {
      ...data,
      status: 'DRAFT',
      uploadedBy: { connect: { id: req.user.id } },
      researchAreas: { create: areaLinks(ids(researchAreaIds)) }
    },
    include: experienceInclude
  });
  return { status: 201, data: experience };
});

export const updateResearchExperience = handle(async (req) => {
  const id = parseId(req.params.id);
  const current = await prisma.studentResearchExperience.findUnique({ where: { id } });
  if (!current) throw fail(404, 'Research experience not found.');
  if (current.uploadedById !== req.user.id && !isAdmin(req.user)) throw fail(403, 'You cannot edit this experience.');
  const { researchAreaIds, id: ignoredId, uploadedById, ...data } = req.body;
  if (!isAdmin(req.user)) delete data.status;
  if (researchAreaIds !== undefined) data.researchAreas = replaceAreas(ids(researchAreaIds));
  const experience = await prisma.studentResearchExperience.update({ where: { id }, data, include: experienceInclude });
  return { data: experience };
});

export const deleteResearchExperience = handle(async (req) => {
  await prisma.studentResearchExperience.delete({ where: { id: parseId(req.params.id) } });
  return { message: 'Research experience deleted.' };
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
    const matchingPositions = projectType && expectedPositionTypes.length
      ? profile.positions.filter((position) => expectedPositionTypes.includes(normalizeMatchText(position.positionType).replaceAll(' ', '_')))
      : [];
    const projectMatch = matchingPositions.length ? 1 : 0;
    const points = departmentMatch * 4 + areaMatch * 6 + projectMatch * 2;
    const matchReasons = [];

    if (departmentMatch) matchReasons.push(`Department: ${profile.department}`);
    if (areaMatches.length) matchReasons.push(`Research area: ${areaMatches[0].area.name}`);
    if (matchingPositions.length) matchReasons.push(`Has an active ${projectType} opening`);

    return {
      ...profile,
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
  const [facultyFollows, areaFollows] = await Promise.all([
    prisma.researchFacultyFollow.findMany({ where: { userId: req.user.id }, select: { facultyProfileId: true } }),
    prisma.researchAreaFollow.findMany({ where: { userId: req.user.id }, select: { researchAreaId: true } })
  ]);
  const followedFacultyIds = facultyFollows.map(({ facultyProfileId }) => facultyProfileId);
  const followedAreaIds = areaFollows.map(({ researchAreaId }) => researchAreaId);
  if (!followedFacultyIds.length && !followedAreaIds.length) return { data: [] };

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

  console.log('[Backend getFollowingUpdates] filterFacultyIds:', filterFacultyIds, 'filterAreaIds:', filterAreaIds);
  console.log('[Backend] final facultyIds:', facultyIds, 'final areaIds:', areaIds);
  console.log('[Backend] followedFacultyIds:', followedFacultyIds, 'followedAreaIds:', followedAreaIds);

  const activityAreas = { researchAreas: { include: { researchArea: true } } };
  const areaSource = (entries) => entries.map(({ researchArea }) => researchArea.name).join(', ');
  const areaFilter = areaIds.length ? [{ researchAreas: { some: { researchAreaId: { in: areaIds } } } }] : [];
  const facultyFilter = facultyIds.length ? [{ facultyId: { in: facultyIds } }] : [];
  const discussionFilter = areaIds.length ? { researchAreas: { some: { researchAreaId: { in: areaIds } } } } : null;

  console.log('[Backend] areaFilter:', JSON.stringify(areaFilter), 'facultyFilter:', JSON.stringify(facultyFilter));
  console.log('[Backend] discussionFilter:', JSON.stringify(discussionFilter));

  const [experiences, positions, discussions, resources] = await Promise.all([
    prisma.studentResearchExperience.findMany({
      where: { status: 'PUBLISHED', OR: [...facultyFilter, ...areaFilter] },
      include: { ...activityAreas, faculty: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }, take: 20
    }),
    facultyIds.length ? prisma.researchOpenPosition.findMany({
      where: { isActive: true, facultyId: { in: facultyIds } },
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

  console.log('[Backend] experiences:', experiences.length, experiences.map(e => ({ id: e.id, facultyId: e.facultyId, areas: e.researchAreas?.map(ra => ra.researchAreaId) })));
  console.log('[Backend] positions:', positions.length, positions.map(p => ({ id: p.id, facultyId: p.facultyId })));
  console.log('[Backend] discussions:', discussions.length, discussions.map(d => ({ id: d.id, areas: d.researchAreas?.map(ra => ra.researchAreaId) })));
  console.log('[Backend] resources:', resources.length, resources.map(r => ({ id: r.id, areas: r.researchAreas?.map(ra => ra.researchAreaId) })));

  const data = [
    ...experiences.map((item) => ({
      id: `experience-${item.id}`, type: 'experience', title: item.title,
      detail: item.description, source: item.faculty?.name || areaSource(item.researchAreas),
      createdAt: item.createdAt
    })),
    ...positions.map((item) => ({
      id: `position-${item.id}`, type: 'position', title: item.title,
      detail: item.description, source: item.faculty?.name || 'Followed faculty',
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

export const getOpenPositions = handle(async (req) => {
  const where = { isActive: true };
  if (req.query.facultyId) where.facultyId = parseId(req.query.facultyId);
  if (req.query.department) where.faculty = { department: { contains: req.query.department, mode: 'insensitive' } };
  const data = await prisma.researchOpenPosition.findMany({
    where,
    include: { faculty: { select: { id: true, name: true, slug: true, department: true } } },
    orderBy: [{ deadline: 'asc' }, { createdAt: 'desc' }]
  });
  return { data };
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
    prisma.studentResearchExperience.count({ where: { status: 'PUBLISHED' } }),
    prisma.studentResearchExperience.count({ where: { status: 'DRAFT' } }),
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