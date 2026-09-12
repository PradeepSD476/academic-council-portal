import prisma from '../config/db.js';

export const getAllRoadmaps = async (req, res) => {
  try {
    const roadmaps = await prisma.roadmap.findMany({
      where: req.user ? {} : { isPublished: true },
      include: {
        sections: {
          orderBy: { order: 'asc' },
          include: {
            chapters: {
              orderBy: { order: 'asc' },
              select: {
                id: true,
                title: true,
                slug: true,
                content: true,
                order: true,
                duration: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      data: roadmaps,
    });
  } catch (error) {
    console.error('Error fetching roadmaps:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch roadmaps.',
    });
  }
};

export const getRoadmapBySlug = async (req, res) => {
  const { slug } = req.params;
  try {
    const roadmap = await prisma.roadmap.findUnique({
      where: { slug },
      include: {
        sections: {
          orderBy: { order: 'asc' },
          include: {
            chapters: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });

    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: 'Roadmap not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: roadmap,
    });
  } catch (error) {
    console.error('Error fetching roadmap:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch roadmap.',
    });
  }
};

export const getChapter = async (req, res) => {
  const { chapterId } = req.params;
  try {
    const chapter = await prisma.roadmapChapter.findUnique({
      where: { id: parseInt(chapterId) },
      include: {
        section: {
          include: {
            roadmap: {
              include: {
                sections: {
                  orderBy: { order: 'asc' },
                  include: {
                    chapters: {
                      orderBy: { order: 'asc' },
                      select: { id: true, title: true, slug: true, order: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: chapter,
    });
  } catch (error) {
    console.error('Error fetching chapter:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch chapter.',
    });
  }
};

export const createRoadmap = async (req, res) => {
  const { title, slug, description, domain, icon } = req.body;
  if (!title) {
    return res.status(400).json({
      success: false,
      message: 'Title is required.',
    });
  }

  const generatedSlug = (slug || title)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

  try {
    const newRoadmap = await prisma.roadmap.create({
      data: {
        title,
        slug: generatedSlug,
        description,
        domain: domain || 'General',
        icon: icon || 'BookOpen',
      },
    });

    return res.status(201).json({
      success: true,
      data: newRoadmap,
    });
  } catch (error) {
    console.error('Error creating roadmap:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create roadmap.',
    });
  }
};

export const updateRoadmap = async (req, res) => {
  const { id } = req.params;
  const { title, description, domain, icon, isPublished } = req.body;

  try {
    const updated = await prisma.roadmap.update({
      where: { id: parseInt(id) },
      data: {
        title,
        description,
        domain,
        icon,
        isPublished,
      },
    });

    return res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('Error updating roadmap:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update roadmap.',
    });
  }
};

export const deleteRoadmap = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.roadmap.delete({
      where: { id: parseInt(id) },
    });

    return res.status(200).json({
      success: true,
      message: 'Roadmap deleted successfully.',
    });
  } catch (error) {
    console.error('Error deleting roadmap:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete roadmap.',
    });
  }
};

export const createSection = async (req, res) => {
  const { roadmapId, title, order } = req.body;
  if (!roadmapId || !title) {
    return res.status(400).json({
      success: false,
      message: 'Roadmap ID and Section Title are required.',
    });
  }

  try {
    const section = await prisma.roadmapSection.create({
      data: {
        roadmapId: parseInt(roadmapId),
        title,
        order: order || 0,
      },
    });

    return res.status(201).json({
      success: true,
      data: section,
    });
  } catch (error) {
    console.error('Error creating section:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create section.',
    });
  }
};

export const updateSection = async (req, res) => {
  const { id } = req.params;
  const { title, order } = req.body;

  try {
    const updated = await prisma.roadmapSection.update({
      where: { id: parseInt(id) },
      data: { title, order },
    });

    return res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('Error updating section:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update section.',
    });
  }
};

export const deleteSection = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.roadmapSection.delete({
      where: { id: parseInt(id) },
    });

    return res.status(200).json({
      success: true,
      message: 'Section deleted successfully.',
    });
  } catch (error) {
    console.error('Error deleting section:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete section.',
    });
  }
};

export const createChapter = async (req, res) => {
  const { sectionId, title, slug, content, order, duration } = req.body;
  if (!sectionId || !title) {
    return res.status(400).json({
      success: false,
      message: 'Section ID and Title are required.',
    });
  }

  const generatedSlug = (slug || title)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

  try {
    const chapter = await prisma.roadmapChapter.create({
      data: {
        sectionId: parseInt(sectionId),
        title,
        slug: generatedSlug,
        content: content || '',
        order: order || 0,
        duration: duration || '10 mins',
      },
    });

    return res.status(201).json({
      success: true,
      data: chapter,
    });
  } catch (error) {
    console.error('Error creating chapter:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create chapter.',
    });
  }
};

export const updateChapter = async (req, res) => {
  const { id } = req.params;
  const { title, slug, content, order, duration } = req.body;

  try {
    const updated = await prisma.roadmapChapter.update({
      where: { id: parseInt(id) },
      data: {
        title,
        slug,
        content,
        order,
        duration,
      },
    });

    return res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('Error updating chapter:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update chapter.',
    });
  }
};

export const deleteChapter = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.roadmapChapter.delete({
      where: { id: parseInt(id) },
    });

    return res.status(200).json({
      success: true,
      message: 'Chapter deleted successfully.',
    });
  } catch (error) {
    console.error('Error deleting chapter:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete chapter.',
    });
  }
};
