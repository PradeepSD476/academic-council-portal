import { prisma } from '../../lib/prisma.js';

export const submitFeedback = async (req, res) => {
    try {
        const { toUserId, groupId, rating, comments } = req.body;
        
        if (!toUserId || !groupId || rating == null) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const config = await prisma.systemConfig.findFirst();
        if (!config || !config.isFeedbackOpen) {
            return res.status(400).json({ success: false, message: 'Feedback is currently closed' });
        }

        const group = await prisma.group.findUnique({ where: { id: groupId } });
        if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
        
        const isMember = group.menteeIds.includes(req.user.id) || group.coMentorIds.includes(req.user.id);
        if (!isMember) return res.status(403).json({ success: false, message: 'You are not a member of this group' });
        
        const isSeniorInGroup = group.mentorId === toUserId || group.coMentorIds.includes(toUserId);
        if (!isSeniorInGroup) {
            return res.status(400).json({ success: false, message: 'Target user is not a mentor or co-mentor of this group' });
        }

        const existingFeedback = await prisma.feedback.findFirst({
            where: {
                fromUserId: req.user.id,
                toUserId,
                groupId
            }
        });

        if (existingFeedback) {
            return res.status(400).json({ success: false, message: 'You have already submitted feedback for this user.' });
        }

        const feedback = await prisma.feedback.create({
            data: {
                fromUserId: req.user.id,
                toUserId,
                groupId,
                rating,
                comments
            }
        });

        res.status(201).json({ success: true, feedback });
    } catch (error) {
        console.error('Submit feedback error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getMentorFeedback = async (req, res) => {
    try {
        const targetUserId = req.params.mentorId || req.params.userId || req.params.seniorId;
        
        // Ensure only ADMIN or the Senior themselves can view feedback
        if (req.user.role !== 'ADMIN' && req.user.id !== targetUserId) {
            return res.status(403).json({ success: false, message: 'Not authorized to view feedback' });
        }

        let feedback = await prisma.feedback.findMany({
            where: { toUserId: targetUserId },
            include: {
                fromUser: {
                    select: { id: true, name: true, rollNumber: true }
                },
                group: {
                    select: { groupName: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Anonymize feedback if the viewer is the senior (and not an admin)
        if (req.user.role !== 'ADMIN' && req.user.id === targetUserId) {
            feedback = feedback.map(f => {
                const anonymized = { ...f };
                delete anonymized.fromUser;
                return anonymized;
            });
        }

        res.json({ success: true, feedback });
    } catch (error) {
        console.error('Get feedback error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getMyFeedbackSubmissions = async (req, res) => {
    try {
        const { groupId } = req.query;
        const where = { fromUserId: req.user.id };
        if (groupId) where.groupId = groupId;

        const submissions = await prisma.feedback.findMany({
            where,
            select: { toUserId: true }
        });

        const submittedToUserIds = submissions.map(s => s.toUserId);
        res.json({ success: true, submittedToUserIds });
    } catch (error) {
        console.error('Get my feedback submissions error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
