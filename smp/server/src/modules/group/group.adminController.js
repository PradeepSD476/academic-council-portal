import { prisma } from '../../lib/prisma.js';

export const getGroups = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12; // 12 for cards
        const search = req.query.search || '';
        const skip = (page - 1) * limit;

        const where = search ? {
            groupName: { contains: search, mode: 'insensitive' }
        } : {};

        const [total, groups] = await prisma.$transaction([
            prisma.group.count({ where }),
            prisma.group.findMany({
                where,
                skip,
                take: limit,
                include: {
                    mentor: true,
                    coMentors: true,
                    mentees: true
                }
            })
        ]);

        res.json({ success: true, data: groups, meta: { total, page, totalPages: Math.ceil(total / limit) } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error fetching groups' });
    }
};

export const getGroupDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const group = await prisma.group.findUnique({
            where: { id },
            include: {
                mentor: { include: { response: true } },
                coMentors: { include: { response: true } },
                mentees: { include: { response: true } }
            }
        });

        if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

        res.json(group);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error fetching group detail' });
    }
};

export const createGroup = async (req, res) => {
    try {
        const { groupName, academicYear } = req.body;
        
        if (!groupName || !academicYear) {
            return res.status(400).json({ success: false, message: 'Missing groupName or academicYear' });
        }

        const group = await prisma.group.create({
            data: {
                groupName,
                academicYear,
            }
        });

        res.json(group);
    } catch (error) {
        console.error("Create group error:", error);
        res.status(500).json({ success: false, message: 'Server error creating group' });
    }
};

export const moveUser = async (req, res) => {
    try {
        const { userId, targetGroupId, targetRole } = req.body;

        if (!userId || !targetGroupId || !targetRole) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const validRoles = ['MENTOR', 'CO_MENTOR', 'MENTEE'];
        if (!validRoles.includes(targetRole)) {
            return res.status(400).json({ success: false, message: 'Invalid targetRole' });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                mentorGroups: true,
                coMentorGroups: true,
                menteeGroups: true
            }
        });

        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const group = await prisma.group.findUnique({ where: { id: targetGroupId } });
        if (!group) return res.status(404).json({ success: false, message: 'Target group not found' });

        if (targetRole === 'MENTOR' && group.mentorId && group.mentorId !== userId) {
            return res.status(400).json({ success: false, message: 'Target group already has a mentor. Please remove them first.' });
        }

        let updateData = {
            smpRole: targetRole,
        };

        if (user.smpRole === 'MENTOR' && user.mentorGroups && user.mentorGroups.length > 0) {
            if (targetRole === 'MENTOR') {
                if (user.mentorGroups.some(g => g.id === targetGroupId)) {
                    return res.status(400).json({ success: false, message: 'User is already assigned to this group.' });
                }
                if (user.mentorGroups.length >= 2) {
                    return res.status(400).json({ success: false, message: 'Mentor already manages 2 groups. Please remove them from a group first.' });
                }
            } else {
                updateData.mentorGroups = { disconnect: user.mentorGroups.map(g => ({ id: g.id })) };
            }
        } else if (user.smpRole === 'CO_MENTOR' && user.coMentorGroups.length > 0) {
            updateData.coMentorGroups = { disconnect: user.coMentorGroups.map(g => ({ id: g.id })) };
        } else if (user.smpRole === 'MENTEE' && user.menteeGroups.length > 0) {
            updateData.menteeGroups = { disconnect: user.menteeGroups.map(g => ({ id: g.id })) };
        }

        if (targetRole === 'MENTOR') {
            updateData.mentorGroups = { ...(updateData.mentorGroups || {}), connect: { id: targetGroupId } };
        } else if (targetRole === 'CO_MENTOR') {
            updateData.coMentorGroups = { ...(updateData.coMentorGroups || {}), connect: { id: targetGroupId } };
        } else if (targetRole === 'MENTEE') {
            updateData.menteeGroups = { ...(updateData.menteeGroups || {}), connect: { id: targetGroupId } };
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData
        });

        res.json({ success: true, message: 'User moved successfully', user: updatedUser });
    } catch (error) {
        console.error("Move user error:", error);
        if (error.code === 'P2002') {
             return res.status(400).json({ success: false, message: 'Unique constraint failed, group already has a mentor.' });
        }
        res.status(500).json({ success: false, message: 'Server error moving user' });
    }
};

export const deleteGroup = async (req, res) => {
    try {
        const { id } = req.params;
        
        const group = await prisma.group.findUnique({
            where: { id },
            include: { mentor: true, coMentors: true, mentees: true }
        });

        if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

        const userIdsToUnassign = [
            ...(group.mentor ? [group.mentor.id] : []),
            ...group.coMentors.map(m => m.id),
            ...group.mentees.map(m => m.id)
        ];

        if (userIdsToUnassign.length > 0) {
            await prisma.user.updateMany({
                where: { id: { in: userIdsToUnassign } },
                data: { 
                    smpRole: 'UNASSIGNED',
                    coMentorIds: [],
                    menteeIds: []
                }
            });
        }

        await prisma.feedback.deleteMany({ where: { groupId: id } });
        await prisma.meeting.deleteMany({ where: { groupId: id } });

        await prisma.group.delete({ where: { id } });

        res.json({ success: true, message: 'Group deleted successfully' });
    } catch (error) {
        console.error("Delete group error:", error);
        res.status(500).json({ success: false, message: 'Server error deleting group' });
    }
};

export const removeUserFromGroup = async (req, res) => {
    try {
        const { userId, groupId } = req.body;
        if (!userId || !groupId) {
            return res.status(400).json({ success: false, message: 'Missing userId or groupId' });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { mentorGroups: true, coMentorGroups: true, menteeGroups: true }
        });

        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        let updateData = {};
        let groupsLeft = 0;

        if (user.smpRole === 'MENTOR') {
            updateData.mentorGroups = { disconnect: { id: groupId } };
            groupsLeft = user.mentorGroups.length - 1;
        } else if (user.smpRole === 'CO_MENTOR') {
            updateData.coMentorGroups = { disconnect: { id: groupId } };
            groupsLeft = user.coMentorGroups.length - 1;
        } else if (user.smpRole === 'MENTEE') {
            updateData.menteeGroups = { disconnect: { id: groupId } };
            groupsLeft = user.menteeGroups.length - 1;
        }

        if (groupsLeft <= 0) {
            updateData.smpRole = 'UNASSIGNED';
        }

        await prisma.user.update({
            where: { id: userId },
            data: updateData
        });

        res.json({ success: true, message: 'User removed from group successfully' });
    } catch (error) {
        console.error("Remove user error:", error);
        res.status(500).json({ success: false, message: 'Server error removing user' });
    }
};
