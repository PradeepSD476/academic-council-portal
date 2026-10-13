import prisma from '../../config/db.js';
import { success, paginated, error } from '../../utils/response.js';
import { getPublicUrl } from '../../utils/signedUrl.js';
import { normalizeResearchAreas, resolveStoredAreaName, resolveStoredAreaNames } from '../../constants/researchAreas.js';
import { resolveDepartmentAliases } from '../../constants/departments.js';

// Helper to extract and validate experience-only fields into `meta` Json
export const buildResourceMeta = (type, body) => {
  if (type !== 'EXPERIENCE') {
    return body.meta && typeof body.meta === 'object' ? body.meta : null;
  }

  // For EXPERIENCE, package labName, duration, prerequisites, etc. into meta
  const metaInput = body.meta && typeof body.meta === 'object' ? body.meta : {};

  return {
    experienceType: body.experienceType || metaInput.experienceType || 'INTERNSHIP',
    department: body.department?.trim() || metaInput.department?.trim() || null,
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
  const effectiveType = meta.resourceType || meta.category || item.type || 'GUIDE';

  const trimmedFilePath = item.filePath?.trim() || null;
  const fileExt = trimmedFilePath ? trimmedFilePath.split('.').pop()?.toLowerCase() : null;
  const resolvedFormat = item.format || (fileExt === 'pdf' ? 'pdf' : (fileExt === 'docx' || fileExt === 'doc') ? 'docx' : (fileExt === 'pptx' || fileExt === 'ppt') ? 'pptx' : trimmedFilePath ? 'file' : item.url ? 'link' : null);
  const resolvedSourceType = trimmedFilePath ? 'FILE' : (item.sourceType || 'LINK');

  return {
    ...item,
    sourceType: resolvedSourceType,
    format: resolvedFormat,
    hasFile: Boolean(trimmedFilePath),
    hasLink: Boolean(item.url?.trim()),
    resourceType: effectiveType,
    category: effectiveType,
    ...(isExp
      ? {
          experienceType: meta.experienceType || 'INTERNSHIP',
          department: meta.department || item.faculty?.department || null,
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

export const attachFileURL = async (item) => {
  if (!item) return null;
  const shaped = shapeResource(item);
  const trimmed = shaped.filePath?.trim();
  if (trimmed) {
    try {
      shaped.fileURL = await getPublicUrl({
        bucketName: process.env.MINIO_BUCKET_NAME || 'acc-media',
        filePath: trimmed,
      });
    } catch {
      shaped.fileURL = null;
    }
  } else {
    shaped.fileURL = null;
  }
  return shaped;
};

// GET /api/v1/vault/resources - Public browse approved resources & guides
export const getResearchResources = async (req, res, forcedType = null) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 12));
    const skip = (page - 1) * limit;

    const {
      type: queryType,
      category,
      format,
      sort = 'newest',
      search,
      area,
      areaId,
      tag,
      facultyId,
      department,
      experienceType,
      status = 'APPROVED',
    } = req.query;

    const explicitForcedType = typeof forcedType === 'string' ? forcedType : null;
    const requestedCategory = (category || queryType || '').trim();
    const effectiveType = explicitForcedType || requestedCategory;

    const where = {
      sourceType: { not: 'AREA_DIRECTORY' },
    };

    // 1. Status Filter (default shows only APPROVED unless status='ALL' is passed)
    if (status && status !== 'ALL') {
      where.status = status;
    }

    // 2. Category / Type Filter
    if (effectiveType && effectiveType !== 'ALL') {
      const validEnumTypes = ['GUIDE', 'PAPER', 'TEMPLATE', 'EXPERIENCE'];
      if (validEnumTypes.includes(effectiveType)) {
        const typeOrConditions = [
          { type: effectiveType },
          { meta: { path: ['resourceType'], equals: effectiveType } },
          { meta: { path: ['category'], equals: effectiveType } },
        ];
        if (!where.AND) where.AND = [];
        where.AND.push({ OR: typeOrConditions });
      } else {
        // Sub-categories (e.g. SOP_WRITING, LOR, COLD_EMAILING, PHD_APPLICATIONS, GRANT_WRITING)
        const getCategoryKeywords = (cat) => {
          const norm = cat.toUpperCase().replace(/-/g, '_');
          if (norm.includes('COLD') && norm.includes('EMAIL')) {
            return ['cold-email', 'cold email', 'cold emailing', 'cold-emailing'];
          }
          if (norm.includes('SOP')) {
            return ['sop', 'statement of purpose'];
          }
          if (norm.includes('LOR')) {
            return ['lor', 'letter of recommendation', 'recommendation letter'];
          }
          if (norm.includes('PHD')) {
            return ['phd', 'doctoral', 'ph.d'];
          }
          if (norm.includes('GRANT')) {
            return ['grant', 'funding', 'fellowship'];
          }
          const spaced = cat.replace(/_/g, ' ');
          const hyphenated = cat.replace(/_/g, '-');
          return Array.from(new Set([cat, spaced, hyphenated]));
        };

        const keywords = getCategoryKeywords(effectiveType);
        const subCatConditions = [
          { meta: { path: ['resourceType'], equals: effectiveType } },
          { meta: { path: ['category'], equals: effectiveType } },
        ];
        keywords.forEach((kw) => {
          subCatConditions.push({ title: { contains: kw, mode: 'insensitive' } });
          subCatConditions.push({ description: { contains: kw, mode: 'insensitive' } });
          subCatConditions.push({ content: { contains: kw, mode: 'insensitive' } });
        });

        if (!where.AND) where.AND = [];
        where.AND.push({ OR: subCatConditions });
      }
    } else if (explicitForcedType === null && (!queryType || queryType === 'ALL')) {
      // General resource browse excludes student experiences by default
      where.type = { not: 'EXPERIENCE' };
    }

    // 3. Format Filter (link, pdf, docx)
    const reqFormat = (format || '').trim().toLowerCase();
    if (reqFormat) {
      if (!where.AND) where.AND = [];
      if (reqFormat === 'link') {
        where.AND.push({
          OR: [
            { sourceType: 'LINK' },
            { format: { equals: 'link', mode: 'insensitive' } },
            { url: { not: null } },
          ],
        });
      } else if (reqFormat === 'pdf') {
        where.AND.push({
          OR: [
            { format: { equals: 'pdf', mode: 'insensitive' } },
            { mimeType: { contains: 'pdf', mode: 'insensitive' } },
            { filePath: { endsWith: '.pdf', mode: 'insensitive' } },
            { url: { contains: '.pdf', mode: 'insensitive' } },
          ],
        });
      } else if (reqFormat === 'docx' || reqFormat === 'doc') {
        where.AND.push({
          OR: [
            { format: { equals: 'docx', mode: 'insensitive' } },
            { mimeType: { contains: 'word', mode: 'insensitive' } },
            { mimeType: { contains: 'document', mode: 'insensitive' } },
            { filePath: { endsWith: '.docx', mode: 'insensitive' } },
            { filePath: { endsWith: '.doc', mode: 'insensitive' } },
            { AND: [{ sourceType: 'FILE' }, { format: null }, { mimeType: null }] },
          ],
        });
      }
    }

    // 4. Faculty Filter
    if (facultyId) {
      where.facultyId = Number(facultyId);
    }

    // 5. Experience Type Filter
    if (experienceType && experienceType !== 'All' && experienceType !== '') {
      if (experienceType === 'INTERNSHIP') {
        where.OR = [
          { meta: { path: ['experienceType'], equals: 'INTERNSHIP' } },
          { meta: { path: ['experienceType'], equals: null } },
        ];
      } else {
        where.meta = {
          path: ['experienceType'],
          equals: experienceType,
        };
      }
    }

    // 6. Department Filter
    if (department && department !== 'All') {
      const deptTerm = department.trim();
      const aliases = resolveDepartmentAliases(deptTerm);
      const deptConditions = aliases.flatMap((a) => [
        { faculty: { department: { contains: a, mode: 'insensitive' } } },
        { meta: { path: ['department'], string_contains: a } },
      ]);
      if (!where.AND) where.AND = [];
      where.AND.push({ OR: deptConditions });
    }

    // 7. Research Area / Tag Filter
    const areaQuery = (tag || area || areaId || '').trim();
    if (areaQuery && areaQuery !== 'All') {
      const resolvedAreas = await resolveStoredAreaNames(prisma, 'ResearchResource', areaQuery);
      const areaMatches = resolvedAreas.length > 0 ? resolvedAreas : [areaQuery];
      if (!where.AND) where.AND = [];
      where.AND.push({
        OR: [
          { researchAreas: { hasSome: areaMatches } },
          { meta: { path: ['customArea', 'name'], equals: areaQuery } },
        ],
      });
    }

    // 8. Search Keyword Filter
    if (search && search.trim()) {
      const term = search.trim();
      const searchConditions = [
        { title: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
        { content: { contains: term, mode: 'insensitive' } },
        { faculty: { name: { contains: term, mode: 'insensitive' } } },
        { uploadedBy: { displayName: { contains: term, mode: 'insensitive' } } },
      ];
      if (!where.AND) where.AND = [];
      where.AND.push({ OR: searchConditions });
    }

    // 9. Sorting
    let orderBy = [{ createdAt: 'desc' }];
    if (sort === 'most_viewed') {
      orderBy = [{ viewCount: 'desc' }, { createdAt: 'desc' }];
    } else if (sort === 'most_downloaded') {
      orderBy = [{ downloadCount: 'desc' }, { createdAt: 'desc' }];
    } else if (sort === 'oldest') {
      orderBy = [{ createdAt: 'asc' }];
    } else {
      orderBy = [{ createdAt: 'desc' }];
    }

    const [resources, total] = await Promise.all([
      prisma.researchResource.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          faculty: {
            select: { id: true, name: true, department: true, designation: true, photoUrl: true },
          },
          uploadedBy: {
            select: { id: true, displayName: true, email: true, photoURL: true, role: true, rollNo: true },
          },
          _count: {
            select: { discussions: true },
          },
        },
      }),
      prisma.researchResource.count({ where }),
    ]);

    const shaped = await Promise.all(resources.map(attachFileURL));
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

    return success(res, await attachFileURL(resource), 'Resource detail fetched');
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
      type: rawType,
      resourceType: rawResourceType,
      url,
      filePath,
      fileSize,
      mimeType,
      format,
      sourceType = 'LINK',
      researchAreas,
      researchArea,
      facultyId,
      consentConfirmed,
      status: explicitStatus,
    } = req.body;

    if (!title || !title.trim()) {
      return error(res, 'Title is required', 400);
    }

    const requestedType = rawType || rawResourceType || 'GUIDE';
    const validTypes = ['GUIDE', 'PAPER', 'TEMPLATE', 'EXPERIENCE'];
    const dbType = validTypes.includes(requestedType) ? requestedType : 'GUIDE';

    // Validate type EXPERIENCE requirements
    if (dbType === 'EXPERIENCE') {
      if (!description && !content) {
        return error(res, 'Experience description or content markdown is required', 400);
      }
    }

    const baseMeta = buildResourceMeta(dbType, req.body) || {};
    const meta = {
      ...baseMeta,
      resourceType: requestedType,
      category: requestedType,
    };

    let areaList = researchAreas || researchArea || [];
    if (!Array.isArray(areaList) && typeof areaList === 'string') {
      areaList = [areaList];
    }
    const normalizedAreas = normalizeResearchAreas(areaList);

    // Auto-approve official materials (guides, templates) if submitted by admin/faculty or direct admin create
    const userRole = req.user?.role;
    const isDirectAdmin = Boolean(req.body.isDirectAdminCreate || explicitStatus === 'APPROVED' || ['RESEARCH_ADMIN', 'SUPER_ADMIN'].includes(userRole));
    const isAutoApproved = isDirectAdmin || (dbType !== 'EXPERIENCE' && ['FACULTY'].includes(userRole));
    const trimmedFilePath = filePath?.trim() || null;
    const trimmedUrl = url?.trim() || null;
    const fileExt = trimmedFilePath ? trimmedFilePath.split('.').pop()?.toLowerCase() : null;
    const derivedFormat = format || (fileExt === 'pdf' ? 'pdf' : (fileExt === 'docx' || fileExt === 'doc') ? 'docx' : (fileExt === 'pptx' || fileExt === 'ppt') ? 'pptx' : trimmedFilePath ? 'file' : trimmedUrl ? 'link' : null);
    const derivedSourceType = req.body.sourceType || (trimmedFilePath ? 'FILE' : 'LINK');

    const resource = await prisma.researchResource.create({
      data: {
        title: title.trim(),
        description: description || null,
        type: dbType,
        content: content || null,
        meta,
        url: trimmedUrl,
        filePath: trimmedFilePath,
        fileSize: fileSize ? Number(fileSize) : null,
        mimeType: mimeType || null,
        format: derivedFormat,
        sourceType: derivedSourceType,
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
      await attachFileURL(resource),
      isAutoApproved ? 'Resource published successfully' : 'Resource submitted for review',
      201
    );
  } catch (err) {
    return error(res, 'Failed to submit resource', 500, err);
  }
};

// POST /api/v1/vault/resources - Admin direct create
export const createResearchResource = async (req, res) => {
  req.body.isDirectAdminCreate = true;
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
    if (b.filePath !== undefined) {
      updateData.filePath = b.filePath?.trim() || null;
      if (updateData.filePath) {
        updateData.sourceType = b.sourceType || 'FILE';
        const fileExt = updateData.filePath.split('.').pop()?.toLowerCase();
        updateData.format = b.format || (fileExt === 'pdf' ? 'pdf' : (fileExt === 'docx' || fileExt === 'doc') ? 'docx' : (fileExt === 'pptx' || fileExt === 'ppt') ? 'pptx' : 'file');
      }
    }
    if (b.sourceType !== undefined && !updateData.sourceType) updateData.sourceType = b.sourceType;
    if (b.format !== undefined && !updateData.format) updateData.format = b.format;
    if (b.researchAreas !== undefined) updateData.researchAreas = normalizeResearchAreas(b.researchAreas);
    if (b.facultyId !== undefined) updateData.facultyId = b.facultyId ? Number(b.facultyId) : null;

    if (b.meta !== undefined || updateType === 'EXPERIENCE') {
      updateData.meta = buildResourceMeta(updateType, b);
    }

    const updated = await prisma.researchResource.update({
      where: { id },
      data: updateData,
    });

    return success(res, await attachFileURL(updated), 'Resource updated successfully');
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
export const getMyResearchResources = async (req, res, forcedType = null) => {
  try {
    const userId = Number(req.user.id);
    const explicitForcedType = typeof forcedType === 'string' ? forcedType : null;
    const queryType = req.query?.type || req.query?.category;
    const type = explicitForcedType || queryType;

    const where = { uploadedById: userId, sourceType: { not: 'AREA_DIRECTORY' } };
    if (type && type !== 'ALL') {
      where.type = type;
    } else if (explicitForcedType === null && (!queryType || queryType === 'ALL')) {
      where.type = { not: 'EXPERIENCE' };
    }

    const resources = await prisma.researchResource.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        faculty: {
          select: { id: true, name: true, department: true, designation: true, photoUrl: true },
        },
        uploadedBy: {
          select: { id: true, displayName: true, email: true, photoURL: true },
        },
        _count: { select: { discussions: true } },
      },
    });

    return success(res, await Promise.all(resources.map(attachFileURL)), 'My resources fetched');
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

    let targetUrl = resource.url;
    if (resource.filePath) {
      targetUrl = await getPublicUrl({
        bucketName: process.env.MINIO_BUCKET_NAME || 'acc-media',
        filePath: resource.filePath,
      });
    }

    if (!targetUrl) return error(res, 'No download target available', 404);

    return res.redirect(targetUrl);
  } catch (err) {
    return error(res, 'Failed to process resource download', 500, err);
  }
};

// GET /api/v1/vault/admin/resources - Moderation queue
export const getResearchResourceModerationQueue = async (req, res, forcedType = null) => {
  try {
    const status = req.query?.status || 'PENDING';
    const queryType = req.query?.type || req.query?.category;
    const explicitForcedType = typeof forcedType === 'string' ? forcedType : null;
    const type = explicitForcedType || queryType;
    const where = {
      sourceType: { not: 'AREA_DIRECTORY' },
    };
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (type && type !== 'ALL') {
      where.type = type;
    } else if (explicitForcedType === null && (!queryType || queryType === 'ALL')) {
      where.type = { not: 'EXPERIENCE' };
    }

    const resources = await prisma.researchResource.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        uploadedBy: { select: { id: true, displayName: true, email: true } },
      },
    });

    return success(res, await Promise.all(resources.map(attachFileURL)), 'Moderation queue fetched');
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

    return success(res, await attachFileURL(updated), `Resource status set to ${newStatus}`);
  } catch (err) {
    return error(res, 'Failed to update resource status', 500, err);
  }
};

// ── Experience Compatibility Aliases (maps /experiences endpoints to ResearchResource) ──
export const getResearchExperiences = async (req, res) => {
  return getResearchResources(req, res, 'EXPERIENCE');
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
  return getMyResearchResources(req, res, 'EXPERIENCE');
};

export const setResearchExperienceStatus = async (req, res) => {
  return setResearchResourceStatus(req, res);
};

export const getResearchModerationQueue = async (req, res) => {
  return getResearchResourceModerationQueue(req, res, 'EXPERIENCE');
};
