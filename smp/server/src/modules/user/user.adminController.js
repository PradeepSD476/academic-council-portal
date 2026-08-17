import { prisma } from '../../lib/prisma.js';

export const getUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const search = req.query.search || '';
        const skip = (page - 1) * limit;

        let where = { role: { not: 'ADMIN' } };
        
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { rollNumber: { contains: search, mode: 'insensitive' } }
            ];
        }

        const [total, users] = await prisma.$transaction([
            prisma.user.count({ where }),
            prisma.user.findMany({
                where,
                skip,
                take: limit,
                include: { 
                    response: true,
                    mentorGroups: true,
                    coMentorGroups: true,
                    menteeGroups: true
                }
            })
        ]);

        res.json({ success: true, data: users, meta: { total, page, totalPages: Math.ceil(total / limit) } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error fetching users' });
    }
};

export const getUserDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await prisma.user.findUnique({
            where: { id },
            include: { 
                response: true,
                mentorGroups: true,
                coMentorGroups: true,
                menteeGroups: true
            }
        });

        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        res.json(user);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error fetching user detail' });
    }
};

export const getUnassignedUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const search = req.query.search || '';
        const skip = (page - 1) * limit;

        const { role } = req.query; // optional filter e.g. ?role=MENTEE
        
        const config = await prisma.systemConfig.findFirst();
        if (!config) {
            return res.status(404).json({ success: false, message: 'System configuration not found' });
        }

        let whereClause = {
            smpRole: 'UNASSIGNED',
            role: { not: 'ADMIN' }
        };

        let rollNumberStarts = [];
        if (role) {
            let prefix = null;
            if (role === 'MENTEE') prefix = config.firstYearBatchPrefix;
            else if (role === 'CO_MENTOR') prefix = config.secondYearBatchPrefix;
            else if (role === 'MENTOR') prefix = config.thirdYearBatchPrefix;

            if (prefix) {
                rollNumberStarts.push({ rollNumber: { startsWith: prefix } });
            }
        }

        if (search) {
            let orQuery = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { rollNumber: { contains: search, mode: 'insensitive' } }
            ];
            
            if (rollNumberStarts.length > 0) {
                 whereClause = {
                     AND: [
                         { smpRole: 'UNASSIGNED', role: { not: 'ADMIN' } },
                         { OR: orQuery },
                         ...rollNumberStarts
                     ]
                 };
            } else {
                 whereClause.OR = orQuery;
            }
        } else if (rollNumberStarts.length > 0) {
            whereClause.rollNumber = rollNumberStarts[0].rollNumber;
        }

        const [total, unassignedUsers] = await prisma.$transaction([
            prisma.user.count({ where: whereClause }),
            prisma.user.findMany({
                where: whereClause,
                skip,
                take: limit,
                include: { response: true }
            })
        ]);

        res.json({ success: true, data: unassignedUsers, meta: { total, page, totalPages: Math.ceil(total / limit) } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error fetching unassigned users' });
    }
};
