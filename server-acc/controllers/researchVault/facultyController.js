import prisma from '../../config/db.js';
import { success, paginated, error } from '../../utils/response.js';
import { normalizeResearchAreas } from '../../constants/researchAreas.js';

// Helper to generate a clean URL-friendly slug
const generateSlug = (name) => {
  return (name || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

// GET /api/v1/vault/faculty - List faculty profiles with filters & pagination
export const getFacultyProfiles = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 12));
    const skip = (page - 1) * limit;

    const { search, department, area, isActive } = req.query;

    const where = {};

    // By default, only show active profiles to students unless explicitly requested
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    } else {
      where.isActive = true;
    }

    if (department && department !== 'All') {
      where.department = { equals: department, mode: 'insensitive' };
    }

    if (area && area !== 'All') {
      where.researchAreas = { has: area };
    }

    if (search && search.trim()) {
      const term = search.trim();
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { designation: { contains: term, mode: 'insensitive' } },
        { biography: { contains: term, mode: 'insensitive' } },
        { department: { contains: term, mode: 'insensitive' } },
      ];
    }

    const [faculty, total] = await Promise.all([
      prisma.facultyProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: {
              openings: {
                where: {
                  status: 'OPEN',
                  OR: [{ deadline: null }, { deadline: { gte: new Date() } }],
                },
              },
              resources: {
                where: { status: 'APPROVED' },
              },
            },
          },
        },
      }),
      prisma.facultyProfile.count({ where }),
    ]);

    return paginated(res, faculty, { page, limit, total }, 'Faculty profiles fetched');
  } catch (err) {
    return error(res, 'Failed to fetch faculty profiles', 500, err);
  }
};

// GET /api/v1/vault/faculty/:id - Detail view by ID or Slug
export const getFacultyProfileById = async (req, res) => {
  try {
    const { id } = req.params;
    const isNumeric = !isNaN(Number(id));

    const faculty = await prisma.facultyProfile.findUnique({
      where: isNumeric ? { id: Number(id) } : { slug: id },
      include: {
        openings: {
          where: {
            status: 'OPEN',
            OR: [{ deadline: null }, { deadline: { gte: new Date() } }],
          },
          orderBy: { createdAt: 'desc' },
        },
        resources: {
          where: { status: 'APPROVED' },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!faculty) {
      return error(res, 'Faculty profile not found', 404);
    }

    return success(res, faculty, 'Faculty profile fetched');
  } catch (err) {
    return error(res, 'Failed to fetch faculty profile', 500, err);
  }
};

// POST /api/v1/vault/faculty/:id/view - Atomic profile view counter
export const recordFacultyProfileView = async (req, res) => {
  try {
    const { id } = req.params;
    const isNumeric = !isNaN(Number(id));

    const updated = await prisma.facultyProfile.update({
      where: isNumeric ? { id: Number(id) } : { slug: id },
      data: {
        profileViewCount: { increment: 1 },
      },
      select: { id: true, profileViewCount: true },
    });

    return success(res, updated, 'Profile view recorded');
  } catch (err) {
    return error(res, 'Failed to record profile view', 500, err);
  }
};

// GET /api/v1/vault/faculty/openings/:id - Open positions by faculty ID
export const getFacultyOpenings = async (req, res) => {
  try {
    const { id } = req.params;
    const isNumeric = !isNaN(Number(id));

    const facultyWhere = isNumeric ? { id: Number(id) } : { slug: id };
    const faculty = await prisma.facultyProfile.findUnique({
      where: facultyWhere,
      select: { id: true, name: true, department: true },
    });

    if (!faculty) {
      return error(res, 'Faculty profile not found', 404);
    }

    const openings = await prisma.researchOpenPosition.findMany({
      where: {
        facultyId: faculty.id,
        status: 'OPEN',
        OR: [{ deadline: null }, { deadline: { gte: new Date() } }],
      },
      orderBy: { createdAt: 'desc' },
    });

    return success(res, openings, 'Faculty openings fetched');
  } catch (err) {
    return error(res, 'Failed to fetch faculty openings', 500, err);
  }
};

// POST /api/v1/vault/faculty - Admin create faculty profile
export const createFacultyProfile = async (req, res) => {
  try {
    const {
      name,
      slug: customSlug,
      designation,
      department,
      email,
      phone,
      officeLocation,
      photoUrl,
      photo,
      websiteUrl,
      website,
      personalWebsiteUrl,
      googleScholarUrl,
      scholarUrl,
      linkedinUrl,
      linkedin,
      biography,
      publications,
      researchAreas,
      isActive = true,
    } = req.body;

    if (!name || !name.trim()) {
      return error(res, 'Faculty name is required', 400);
    }

    const baseSlug = customSlug?.trim() || generateSlug(name);
    let finalSlug = baseSlug;
    let count = 1;

    // Ensure unique slug
    while (await prisma.facultyProfile.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${baseSlug}-${count++}`;
    }

    const normalizedAreas = normalizeResearchAreas(researchAreas);

    const faculty = await prisma.facultyProfile.create({
      data: {
        name: name.trim(),
        slug: finalSlug,
        designation: designation?.trim() || null,
        department: department?.trim() || null,
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        officeLocation: officeLocation?.trim() || null,
        photoUrl: photoUrl?.trim() || photo?.trim() || null,
        websiteUrl: websiteUrl?.trim() || website?.trim() || null,
        personalWebsiteUrl: personalWebsiteUrl?.trim() || null,
        googleScholarUrl: googleScholarUrl?.trim() || scholarUrl?.trim() || null,
        linkedinUrl: linkedinUrl?.trim() || linkedin?.trim() || null,
        biography: biography || null,
        publications: publications || null,
        researchAreas: normalizedAreas,
        isActive: Boolean(isActive),
      },
    });

    return success(res, faculty, 'Faculty profile created successfully', 201);
  } catch (err) {
    if (err.code === 'P2002') {
      return error(res, 'A faculty profile with this email or slug already exists', 409);
    }
    return error(res, 'Failed to create faculty profile', 500, err);
  }
};

// PUT /api/v1/vault/faculty/:id - Admin update faculty profile
export const updateFacultyProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const isNumeric = !isNaN(Number(id));
    const where = isNumeric ? { id: Number(id) } : { slug: id };

    const existing = await prisma.facultyProfile.findUnique({ where });
    if (!existing) {
      return error(res, 'Faculty profile not found', 404);
    }

    const data = {};
    const b = req.body;

    if (b.name !== undefined) data.name = b.name.trim();
    if (b.designation !== undefined) data.designation = b.designation?.trim() || null;
    if (b.department !== undefined) data.department = b.department?.trim() || null;
    if (b.email !== undefined) data.email = b.email?.trim() || null;
    if (b.phone !== undefined) data.phone = b.phone?.trim() || null;
    if (b.officeLocation !== undefined) data.officeLocation = b.officeLocation?.trim() || null;
    if (b.photoUrl !== undefined || b.photo !== undefined) {
      data.photoUrl = (b.photoUrl || b.photo)?.trim() || null;
    }
    if (b.websiteUrl !== undefined || b.website !== undefined) {
      data.websiteUrl = (b.websiteUrl || b.website)?.trim() || null;
    }
    if (b.personalWebsiteUrl !== undefined) {
      data.personalWebsiteUrl = b.personalWebsiteUrl?.trim() || null;
    }
    if (b.googleScholarUrl !== undefined || b.scholarUrl !== undefined) {
      data.googleScholarUrl = (b.googleScholarUrl || b.scholarUrl)?.trim() || null;
    }
    if (b.linkedinUrl !== undefined || b.linkedin !== undefined) {
      data.linkedinUrl = (b.linkedinUrl || b.linkedin)?.trim() || null;
    }
    if (b.biography !== undefined) data.biography = b.biography;
    if (b.publications !== undefined) data.publications = b.publications;
    if (b.isActive !== undefined) data.isActive = Boolean(b.isActive);
    if (b.researchAreas !== undefined) {
      data.researchAreas = normalizeResearchAreas(b.researchAreas);
    }

    const updated = await prisma.facultyProfile.update({
      where: { id: existing.id },
      data,
    });

    return success(res, updated, 'Faculty profile updated successfully');
  } catch (err) {
    if (err.code === 'P2002') {
      return error(res, 'Email or slug conflict with another profile', 409);
    }
    return error(res, 'Failed to update faculty profile', 500, err);
  }
};

// DELETE /api/v1/vault/faculty/:id - Admin delete faculty profile
export const deleteFacultyProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const isNumeric = !isNaN(Number(id));
    const where = isNumeric ? { id: Number(id) } : { slug: id };

    await prisma.facultyProfile.delete({ where });
    return success(res, null, 'Faculty profile deleted successfully');
  } catch (err) {
    return error(res, 'Failed to delete faculty profile', 500, err);
  }
};
