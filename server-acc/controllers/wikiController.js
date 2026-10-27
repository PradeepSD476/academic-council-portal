import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const getCategories = async (req, res) => {
  try {
    const categories = await prisma.wikiCategory.findMany({
      include: { _count: { select: { articles: true } } },
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getArticles = async (req, res) => {
  try {
    const articles = await prisma.wikiArticle.findMany({
      where: { isPublished: true },
      include: { category: true },
    });
    res.json(articles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getArticleBySlug = async (req, res) => {
  try {
    const article = await prisma.wikiArticle.findUnique({
      where: { slug: req.params.slug },
      include: { category: true },
    });
    if (!article) return res.status(404).json({ error: 'Article not found' });
    
    // Increment view count
    await prisma.wikiArticle.update({
      where: { slug: req.params.slug },
      data: { views: { increment: 1 } },
    });

    res.json(article);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name, slug, description } = req.body;
    const category = await prisma.wikiCategory.create({
      data: { name, slug, description },
    });
    res.status(201).json(category);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const createArticle = async (req, res) => {
  try {
    const { title, slug, content, categoryId, authorId } = req.body;
    const article = await prisma.wikiArticle.create({
      data: { title, slug, content, categoryId: Number(categoryId), authorId: authorId ? Number(authorId) : null },
    });
    res.status(201).json(article);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteArticle = async (req, res) => {
  try {
    await prisma.wikiArticle.delete({
      where: { id: Number(req.params.id) },
    });
    res.json({ message: 'Article deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};