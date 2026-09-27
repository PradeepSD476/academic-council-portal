import prisma from '../config/db.js';

const userSummary = {
  select: { id: true, displayName: true, photoURL: true, role: true }
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
  if (query.resolved === 'true' || query.resolved === 'false') where.isResolved = query.resolved === 'true';
  if (query.search) where.OR = [
    { title: { contains: query.search, mode: 'insensitive' } },
    { content: { contains: query.search, mode: 'insensitive' } }
  ];
  return where;
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
    prisma.researchDiscussion.findMany({ where, include: discussionInclude, orderBy: [{ isResolved: 'asc' }, { createdAt: 'desc' }], skip, take: limit }),
    prisma.researchDiscussion.count({ where })
  ]);
  return { data, page, limit, total, totalPages: Math.ceil(total / limit) };
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

export const voteResearchDiscussion = handle(async (req) => {
  const discussionId = parseId(req.params.id);
  const value = Number(req.body.value) < 0 ? -1 : 1;
  const vote = await prisma.researchDiscussionVote.upsert({
    where: { discussionId_userId: { discussionId, userId: req.user.id } },
    create: { discussionId, userId: req.user.id, value },
    update: { value }
  });
  return { data: vote };
});

export const getResearchResources = handle(async (req) => {
  const { page, limit, skip } = pagination(req.query);
  const where = {};
  if (req.query.category) where.resourceType = req.query.category;
  if (req.query.areaId) where.researchAreas = { some: { researchAreaId: parseId(req.query.areaId) } };
  if (req.query.search) where.OR = [
    { title: { contains: req.query.search, mode: 'insensitive' } },
    { description: { contains: req.query.search, mode: 'insensitive' } }
  ];
  const [data, total] = await Promise.all([
    prisma.researchResource.findMany({ where, include: { researchAreas: { include: { researchArea: true } } }, orderBy: { createdAt: 'desc' }, skip, take: limit }),
    prisma.researchResource.count({ where })
  ]);
  return { data, page, limit, total, totalPages: Math.ceil(total / limit) };
});

export const recordResearchResourceView = handle(async (req) => {
  const data = await prisma.researchResource.update({
    where: { id: parseId(req.params.id) },
    data: { viewCount: { increment: 1 } }
  });
  return { data };
});

export const recordResearchResourceDownload = handle(async (req) => {
  const data = await prisma.researchResource.update({
    where: { id: parseId(req.params.id) },
    data: { downloadCount: { increment: 1 } }
  });
  return { data };
});

export const createResearchResource = handle(async (req) => {
  const { researchAreaIds, ...data } = req.body;
  if (!data.title || (!data.url && !data.filePath)) throw fail(400, 'A title and resource URL or file are required.');
  delete data.uploadedById;
  const resource = await prisma.researchResource.create({
    data: {
      ...data,
      uploadedById: req.user.id,
      researchAreas: { create: areaLinks(ids(researchAreaIds)) }
    },
    include: { researchAreas: { include: { researchArea: true } } }
  });
  return { status: 201, data: resource };
});

export const updateResearchResource = handle(async (req) => {
  const id = parseId(req.params.id);
  const { researchAreaIds, id: ignoredId, uploadedById, ...data } = req.body;
  if (researchAreaIds !== undefined) data.researchAreas = replaceAreas(ids(researchAreaIds));
  const resource = await prisma.researchResource.update({
    where: { id }, data, include: { researchAreas: { include: { researchArea: true } } }
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