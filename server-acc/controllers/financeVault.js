import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Create a new Finance Opportunity
export const createOpportunity = async (req, res) => {
    console.log("========== Finance create route reached ==========");
    console.log("Request Body:", req.body);
    console.log("User:", req.user);

    try {
        const userId = req.user.id;
        const data = req.body;

        // Clean and validate date fields
        if (data.deadline === "" || data.deadline === undefined || data.deadline === null) {
            data.deadline = null;
        } else {
            const parsedDate = new Date(data.deadline);
            if (!isNaN(parsedDate.getTime())) {
                data.deadline = parsedDate.toISOString();
            } else {
                data.deadline = null;
            }
        }

        // Prevent primary key mutations if id is passed in req.body
        delete data.id;

        const newOpportunity = await prisma.financeVault.create({
            data: {
                ...data
            }
        });

        res.status(201).json({
            success: true,
            data: newOpportunity,
        });
    } catch (error) {
        console.error("========================");
        console.error(error);
        console.error(error.message);
        console.error("========================");

        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
// Update an existing Finance Opportunity
export const updateOpportunity = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        // Clean and validate date fields
        if (data.deadline === "" || data.deadline === undefined || data.deadline === null) {
            data.deadline = null;
        } else {
            const parsedDate = new Date(data.deadline);
            if (!isNaN(parsedDate.getTime())) {
                data.deadline = parsedDate.toISOString();
            } else {
                data.deadline = null;
            }
        }

        // Prevent updating the ID field
        delete data.id;

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

/**
 * Bidirectional income normalizer.
 *
 * Parses user input (plain number OR shorthand like 30k / 8L / 1.5L)
 * into a raw integer, then generates every string variant that the
 * database might store for that amount:
 *   30000 → ["30000", "30k", "30K", "30,000", "30,000"]
 *
 * This way "30000" finds rows storing "30k", and "30k" finds rows
 * storing "30000" — completely bidirectional.
 *
 * If the input cannot be parsed as a number, a plain case-insensitive
 * substring match is performed on the raw string.
 */
const expandIncomeVariants = (raw) => {
    if (!raw) return null;
    const str = raw.trim();

    // ── Parse input to a raw integer ──────────────────────────────────
    let numValue = null;

    const kMatch = str.match(/^(\d+(?:\.\d+)?)\s*[kK]$/);
    if (kMatch) numValue = Math.round(parseFloat(kMatch[1]) * 1_000);

    if (numValue === null) {
        const lMatch = str.match(/^(\d+(?:\.\d+)?)\s*[lL]$/);
        if (lMatch) numValue = Math.round(parseFloat(lMatch[1]) * 100_000);
    }

    if (numValue === null) {
        // Plain number, possibly with commas
        const plain = str.replace(/,/g, '');
        if (/^\d+$/.test(plain)) numValue = parseInt(plain, 10);
    }

    // ── Could not parse → plain substring fallback ────────────────────
    if (numValue === null || isNaN(numValue)) {
        return { type: 'plain', value: str };
    }

    // ── Generate all storage variants for this amount ─────────────────
    const variants = new Set();

    // Plain integer
    variants.add(String(numValue));

    // k-notation (only when cleanly divisible)
    if (numValue % 1_000 === 0) {
        const k = numValue / 1_000;
        variants.add(`${k}k`);
        variants.add(`${k}K`);
        variants.add(`${k}k/-`);   // common Indian format
    }

    // L / lakh notation
    if (numValue % 100_000 === 0) {
        const l = numValue / 100_000;
        variants.add(`${l}L`);
        variants.add(`${l}l`);
        variants.add(`${l} lakh`);
        variants.add(`${l} Lakh`);
    }

    // Comma-separated formats (Indian and international)
    variants.add(numValue.toLocaleString('en-IN'));   // "30,000"
    variants.add(numValue.toLocaleString('en-US'));   // "30,000"

    return { type: 'variants', values: [...variants] };
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

        // We may need to combine multiple OR/AND conditions safely.
        // Keep track of top-level AND conditions separately.
        const andConditions = [];
        
        if (search) {
            andConditions.push({
                OR: [
                    { title: { contains: search, mode: 'insensitive' } },
                    { provider: { contains: search, mode: 'insensitive' } }
                ]
            });
        }

        if (category) {
            where.category = category;
        }

        if (gender) {
            where.genderEligibility = gender;
        }

        if (income) {
            // Expand user input into all possible stored variants for bidirectional matching.
            // e.g. typing "30000" finds records storing "30k", and typing "30k" finds "30000".
            const expanded = expandIncomeVariants(income);
            if (expanded) {
                if (expanded.type === 'plain') {
                    // Non-numeric input → simple substring match
                    where.incomeEligibility = { contains: expanded.value, mode: 'insensitive' };
                } else {
                    // Numeric input → OR across every possible string form
                    andConditions.push({
                        OR: expanded.values.map(v => ({
                            incomeEligibility: { contains: v, mode: 'insensitive' }
                        }))
                    });
                }
            }
        }
        
        if (activeStatus !== undefined && activeStatus !== '') {
            where.isActive = activeStatus === 'true';
        }

        if (branch) {
            // Branch values from the frontend dropdown are already uppercase (CSE, ECE, etc.)
            where.applicableBranch = { hasSome: [branch.trim().toUpperCase()] };
        }

        // Merge andConditions into the where clause
        if (andConditions.length === 1) {
            // Single condition — can be flattened directly
            Object.assign(where, andConditions[0]);
        } else if (andConditions.length > 1) {
            where.AND = andConditions;
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
