import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Create a new Finance Opportunity
export const createOpportunity = async (req, res) => {
    try {
        const userId = req.user.id;
        const data = req.body;

        const newOpportunity = await prisma.financeVault.create({
            data: {
                ...data
            }
        });

        res.status(201).json({ success: true, data: newOpportunity });
    } catch (error) {
        console.error("Error creating finance opportunity:", error);
        res.status(500).json({ success: false, message: 'Failed to create finance opportunity', error: error.message });
    }
};

// Update an existing Finance Opportunity
export const updateOpportunity = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        const updatedOpportunity = await prisma.financeVault.update({
            where: { id: parseInt(id) },
            data: data
        });

        res.status(200).json({ success: true, data: updatedOpportunity });
    } catch (error) {
        console.error("Error updating finance opportunity:", error);
        res.status(500).json({ success: false, message: 'Failed to update finance opportunity', error: error.message });
    }
};

// Delete a Finance Opportunity
export const deleteOpportunity = async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.financeVault.delete({
            where: { id: parseInt(id) }
        });

        res.status(200).json({ success: true, message: 'Finance opportunity deleted successfully' });
    } catch (error) {
        console.error("Error deleting finance opportunity:", error);
        res.status(500).json({ success: false, message: 'Failed to delete finance opportunity', error: error.message });
    }
};

// Get a single Finance Opportunity by ID
export const getOpportunityById = async (req, res) => {
    try {
        const { id } = req.params;

        const opportunity = await prisma.financeVault.findUnique({
            where: { id: parseInt(id) }
        });

        if (!opportunity) {
            return res.status(404).json({ success: false, message: 'Finance opportunity not found' });
        }

        res.status(200).json({ success: true, data: opportunity });
    } catch (error) {
        console.error("Error fetching finance opportunity:", error);
        res.status(500).json({ success: false, message: 'Failed to fetch finance opportunity', error: error.message });
    }
};

// Get multiple Finance Opportunities with Pagination, Search, and Filtering
export const getOpportunities = async (req, res) => {
    try {
        const { page = 1, limit = 10, search, category, gender, income, branch, activeStatus } = req.query;
        
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Build the where clause
        const where = {};
        
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { provider: { contains: search, mode: 'insensitive' } }
            ];
        }

        if (category) {
            where.category = category;
        }

        if (gender) {
            where.genderEligibility = gender;
        }

        if (income) {
            where.incomeEligibility = { contains: income, mode: 'insensitive' };
        }
        
        if (branch) {
            where.applicableBranch = { has: branch };
        }
        
        if (activeStatus !== undefined) {
            where.isActive = activeStatus === 'true';
        }

        const [data, total] = await Promise.all([
            prisma.financeVault.findMany({
                where,
                skip,
                take: limitNum,
                orderBy: { createdAt: 'desc' }
            }),
            prisma.financeVault.count({ where })
        ]);

        const totalPages = Math.ceil(total / limitNum);

        res.status(200).json({
            success: true,
            data,
            page: pageNum,
            limit: limitNum,
            total,
            totalPages
        });

    } catch (error) {
        console.error("Error fetching finance opportunities:", error);
        res.status(500).json({ success: false, message: 'Failed to fetch finance opportunities', error: error.message });
    }
};

// Get marquee opportunities
export const getMarqueeOpportunities = async (req, res) => {
    try {
        const opportunities = await prisma.financeVault.findMany({
            where: {
                isActive: true,
                deadline: { gte: new Date() }
            },
            orderBy: {
                deadline: 'asc'
            },
            take: 10
        });

        res.status(200).json({ success: true, data: opportunities });
    } catch (error) {
        console.error("Error fetching marquee opportunities:", error);
        res.status(500).json({ success: false, message: 'Failed to fetch marquee opportunities', error: error.message });
    }
};
