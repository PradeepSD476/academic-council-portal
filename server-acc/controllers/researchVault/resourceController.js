import prisma from '../../config/db.js';
import { success, paginated, error } from '../../utils/response.js';
import { normalizeResearchAreas } from '../../constants/researchAreas.js';

// Helper to extract and validate experience-only fields into `meta` Json
export const buildResourceMeta = (type, body) => {
  if (type !== 'EXPERIENCE') {
    return body.meta && typeof body.meta === 'object' ? body.meta : null;
  }

  // For EXPERIENCE, package labName, duration, prerequisites, etc. into meta
  const metaInput = body.meta && typeof body.meta === 'object' ? body.meta : {};

  return {
    labName: body.labName?.trim() || metaInput.labName?.trim() || null,
    duration: body.duration?.trim() || metaInput.duration?.trim() || null,
    prerequisites: body.prerequisites || metaInput.prerequisites || null,
    keyLearnings: body.keyLearnings || metaInput.keyLearnings || null,
    outcome: body.outcome || metaInput.outcome || null,
    externalGuideName: body.externalGuideName?.trim() || metaInput.externalGuideName?.trim() || null,
    stipend: body.stipend || metaInput.stipend || null,
    role: body.role?.trim() || metaInput.role?.trim() || 'Research Intern',
    ...metaInput,
  };
};

// Shape resource / experience record for frontend consumption
export const shapeResource = (item) => {
  if (!item) return null;
  const isExp = item.type === 'EXPERIENCE';
  const meta = item.meta && typeof item.meta === 'object' ? item.meta : {};

  return {
    ...item,
    ...(isExp
      ? {
          labName: meta.labName || null,
          duration: meta.duration || null,
          prerequisites: meta.prerequisites || null,
          keyLearnings: meta.keyLearnings || null,
          outcome: meta.outcome || null,
          externalGuideName: meta.externalGuideName || null,
          stipend: meta.stipend || null,
          role: meta.role || 'Research Intern',
        }
      : {}),
    commentCount: item._count?.discussions ?? 0,
  };
};

// GET /api/v1/vault/resources - Public browse approved resources & guides
export const getResearchResources = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 12));
    const skip = (page - 1) * limit;

    const { type, search, area, facultyId, status = 'APPROVED' } = req.query;

    const where = {};

    // By default, public browse shows only APPROVED
    if (status) {
      where.status = status;
    }

    if (type && type !== 'ALL') {
      where.type = type;
    }

    if (facultyId) {
      where.facultyId = Number(facultyId);
    }

    if (area && area !== 'All') {
      where.researchAreas = { has: area };
    }

    if (search && search.trim()) {
      const term = search.trim();
      where.OR = [
        { title: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
        { content: { contains: term, mode: 'insensitive' } },
      ];
    }

    const [resources, total] = await Promise.all([
      prisma.researchResource.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          faculty: {
            select: { id: true, name: true, department: true, designation: true, photoUrl: true },
          },
          uploadedBy: {
            select: { id: true, displayName: true, email: true, photoURL: true },
          },
          _count: {
            select: { discussions: true },
          },
        },
      }),
      prisma.researchResource.count({ where }),
    ]);

    const shaped = resources.map(shapeResource);
    return paginated(res, shaped, { page, limit, total }, 'Resources fetched');
  } catch (err) {
    return error(res, 'Failed to fetch resources', 500, err);
  }
};

// GET /api/v1/vault/resources/:id - Resource detail view
export const getResearchResourceById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return error(res, 'Invalid resource ID', 400);

    const resource = await prisma.researchResource.findUnique({
      where: { id },
      include: {
        faculty: {
          select: { id: true, name: true, department: true, designation: true, photoUrl: true, slug: true },
        },
        uploadedBy: {
          select: { id: true, displayName: true, email: true, photoURL: true },
        },
        approvedBy: {
          select: { id: true, displayName: true },
        },
        _count: {
          select: { discussions: true },
        },
      },
    });

    if (!resource) return error(res, 'Resource not found', 404);

    return success(res, shapeResource(resource), 'Resource detail fetched');
  } catch (err) {
    return error(res, 'Failed to fetch resource', 500, err);
  }
};

// POST /api/v1/vault/resources/submit - Student resource submission (link, file, or experience)
export const submitResearchResource = async (req, res) => {
  try {
    const {
      title,
      description,
      content,
      type = 'GUIDE',
      url,
      filePath,
      fileSize,
      mimeType,
      format,
      sourceType = 'LINK',
      researchAreas,
      facultyId,
      consentConfirmed,
    } = req.body;

    if (!title || !title.trim()) {
      return error(res, 'Title is required', 400);
    }

    const validTypes = ['GUIDE', 'PAPER', 'TEMPLATE', 'EXPERIENCE'];
    const resourceType = validTypes.includes(type) ? type : 'GUIDE';

    // Validate type EXPERIENCE requirements
    if (resourceType === 'EXPERIENCE') {
      if (!description && !content) {
        return error(res, 'Experience description or content markdown is required', 400);
      }
    }

    const meta = buildResourceMeta(resourceType, req.body);
    const normalizedAreas = normalizeResearchAreas(researchAreas);

    // Auto-approve if submitted by admin or faculty
    const userRole = req.user?.role;
    const isAutoApproved = ['RESEARCH_ADMIN', 'SUPER_ADMIN', 'FACULTY'].includes(userRole);

    const resource = await prisma.researchResource.create({
      data: {
        title: title.trim(),
        description: description || null,
        type: resourceType,
        content: content || null,
        meta,
        url: url?.trim() || null,
        filePath: filePath?.trim() || null,
        fileSize: fileSize ? Number(fileSize) : null,
        mimeType: mimeType || null,
        format: format || null,
        sourceType: sourceType || 'LINK',
        status: isAutoApproved ? 'APPROVED' : 'PENDING',
        consentConfirmed: Boolean(consentConfirmed),
        researchAreas: normalizedAreas,
        facultyId: facultyId ? Number(facultyId) : null,
        uploadedById: req.user.id,
        approvedById: isAutoApproved ? req.user.id : null,
        reviewedAt: isAutoApproved ? new Date() : null,
      },
      include: {
        uploadedBy: {
          select: { id: true, displayName: true, email: true },
        },
      },
    });

    return success(
      res,
      shapeResource(resource),
      isAutoApproved ? 'Resource published successfully' : 'Resource submitted for review',
      201
    );
  } catch (err) {
    return error(res, 'Failed to submit resource', 500, err);
  }
};

// POST /api/v1/vault/resources - Admin direct create
export const createResearchResource = async (req, res) => {
  return submitResearchResource(req, res);
};

// PUT /api/v1/vault/resources/:id - Update resource
export const updateResearchResource = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return error(res, 'Invalid resource ID', 400);

    const existing = await prisma.researchResource.findUnique({ where: { id } });
    if (!existing) return error(res, 'Resource not found', 404);

    const isOwner = existing.uploadedById === req.user.id;
    const isAdmin = ['RESEARCH_ADMIN', 'SUPER_ADMIN', 'FACULTY'].includes(req.user.role);

    if (!isOwner && !isAdmin) {
      return error(res, 'Not authorized to edit this resource', 403);
    }

    const b = req.body;
    const updateType = b.type || existing.type;
    const updateData = {};

    if (b.title !== undefined) updateData.title = b.title.trim();
    if (b.description !== undefined) updateData.description = b.description;
    if (b.content !== undefined) updateData.content = b.content;
    if (b.type !== undefined) updateData.type = b.type;
    if (b.url !== undefined) updateData.url = b.url?.trim() || null;
    if (b.filePath !== undefined) updateData.filePath = b.filePath?.trim() || null;
    if (b.sourceType !== undefined) updateData.sourceType = b.sourceType;
    if (b.researchAreas !== undefined) updateData.researchAreas = normalizeResearchAreas(b.researchAreas);
    if (b.facultyId !== undefined) updateData.facultyId = b.facultyId ? Number(b.facultyId) : null;

    if (b.meta !== undefined || updateType === 'EXPERIENCE') {
      updateData.meta = buildResourceMeta(updateType, b);
    }

    const updated = await prisma.researchResource.update({
      where: { id },
      data: updateData,
    });

    return success(res, shapeResource(updated), 'Resource updated successfully');
  } catch (err) {
    return error(res, 'Failed to update resource', 500, err);
  }
};

// DELETE /api/v1/vault/resources/:id - Delete resource
export const deleteResearchResource = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return error(res, 'Invalid resource ID', 400);

    const existing = await prisma.researchResource.findUnique({ where: { id } });
    if (!existing) return error(res, 'Resource not found', 404);

    const isOwner = existing.uploadedById === req.user.id;
    const isAdmin = ['RESEARCH_ADMIN', 'SUPER_ADMIN', 'FACULTY'].includes(req.user.role);

    if (!isOwner && !isAdmin) {
      return error(res, 'Not authorized to delete this resource', 403);
    }

    await prisma.researchResource.delete({ where: { id } });
    return success(res, null, 'Resource deleted successfully');
  } catch (err) {
    return error(res, 'Failed to delete resource', 500, err);
  }
};

// GET /api/v1/vault/resources/mine - User's uploaded resources
export const getMyResearchResources = async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const { type } = req.query;

    const where = { uploadedById: userId };
    if (type && type !== 'ALL') where.type = type;

    const resources = await prisma.researchResource.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { discussions: true } },
      },
    });

    return success(res, resources.map(shapeResource), 'My resources fetched');
  } catch (err) {
    return error(res, 'Failed to fetch your resources', 500, err);
  }
};

// PATCH /api/v1/vault/resources/mine/:id
export const updateMyResearchResource = async (req, res) => {
  return updateResearchResource(req, res);
};

// DELETE /api/v1/vault/resources/mine/:id
export const deleteMyResearchResource = async (req, res) => {
  return deleteResearchResource(req, res);
};

// POST /api/v1/vault/resources/:id/view - Atomic view counter
export const recordResearchResourceView = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return error(res, 'Invalid resource ID', 400);

    const updated = await prisma.researchResource.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
      select: { id: true, viewCount: true },
    });

    return success(res, updated, 'Resource view recorded');
  } catch (err) {
    return error(res, 'Failed to record resource view', 500, err);
  }
};

// POST /api/v1/vault/resources/:id/download - Atomic download counter
export const recordResearchResourceDownload = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return error(res, 'Invalid resource ID', 400);

    const updated = await prisma.researchResource.update({
      where: { id },
      data: { downloadCount: { increment: 1 } },
      select: { id: true, downloadCount: true },
    });

    return success(res, updated, 'Resource download recorded');
  } catch (err) {
    return error(res, 'Failed to record download', 500, err);
  }
};

// GET /api/v1/vault/resources/:id/download - Stream/redirect download
export const downloadResearchResourceHandler = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return error(res, 'Invalid resource ID', 400);

    const resource = await prisma.researchResource.findUnique({
      where: { id },
      select: { id: true, url: true, filePath: true },
    });

    if (!resource) return error(res, 'Resource not found', 404);

    // Atomically increment download count
    await prisma.researchResource.update({
      where: { id },
      data: { downloadCount: { increment: 1 } },
    });

    const targetUrl = resource.filePath || resource.url;
    if (!targetUrl) return error(res, 'No download target available', 404);

    return res.redirect(targetUrl);
  } catch (err) {
    return error(res, 'Failed to process resource download', 500, err);
  }
};

// GET /api/v1/vault/admin/resources - Moderation queue
export const getResearchResourceModerationQueue = async (req, res) => {
  try {
    const { type, status = 'PENDING' } = req.query;
    const where = { status };
    if (type && type !== 'ALL') where.type = type;

    const resources = await prisma.researchResource.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        uploadedBy: { select: { id: true, displayName: true, email: true } },
      },
    });

    return success(res, resources.map(shapeResource), 'Moderation queue fetched');
  } catch (err) {
    return error(res, 'Failed to fetch moderation queue', 500, err);
  }
};

// PATCH /api/v1/vault/admin/resources/:id/status - Approve/reject resource
export const setResearchResourceStatus = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status: newStatus, rejectionReason } = req.body;

    if (!['APPROVED', 'REJECTED', 'PENDING'].includes(newStatus)) {
      return error(res, 'Invalid status value', 400);
    }

    const updated = await prisma.researchResource.update({
      where: { id },
      data: {
        status: newStatus,
        rejectionReason: newStatus === 'REJECTED' ? rejectionReason : null,
        approvedById: req.user.id,
        reviewedAt: new Date(),
      },
    });

    return success(res, shapeResource(updated), `Resource status set to ${newStatus}`);
  } catch (err) {
    return error(res, 'Failed to update resource status', 500, err);
  }
};

// ── Experience Compatibility Aliases (maps /experiences endpoints to ResearchResource) ──
export const getResearchExperiences = async (req, res) => {
  req.query.type = 'EXPERIENCE';
  return getResearchResources(req, res);
};

export const getResearchExperienceById = async (req, res) => {
  return getResearchResourceById(req, res);
};

export const createResearchExperience = async (req, res) => {
  req.body.type = 'EXPERIENCE';
  return submitResearchResource(req, res);
};

export const updateResearchExperience = async (req, res) => {
  req.body.type = 'EXPERIENCE';
  return updateResearchResource(req, res);
};

export const deleteResearchExperience = async (req, res) => {
  return deleteResearchResource(req, res);
};

export const getMyResearchExperiences = async (req, res) => {
  req.query.type = 'EXPERIENCE';
  return getMyResearchResources(req, res);
};

export const setResearchExperienceStatus = async (req, res) => {
  return setResearchResourceStatus(req, res);
};

export const getResearchModerationQueue = async (req, res) => {
  req.query.type = 'EXPERIENCE';
  return getResearchResourceModerationQueue(req, res);
};
