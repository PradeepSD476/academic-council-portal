import { prisma } from '../../lib/prisma.js';
import { getPublicUrl } from '../../utils/signedUrl.js';

export const getUserStatus = async (req, res) => {
    try {
        const config = await prisma.systemConfig.findFirst();
        res.json({ 
            isAllocationComplete: config?.isAllocationComplete || false,
            isFeedbackOpen: config?.isFeedbackOpen || false 
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching status' });
    }
};

export const getUserGroup = async (req, res) => {
    try {
        const userId = req.user.id;

        if (req.user.role !== 'ADMIN') {
            const config = await prisma.systemConfig.findFirst();
            if (!config || !config.isAllocationComplete) {
                return res.status(403).json({ isAllocationComplete: false, message: 'Allocation is not completed yet.' });
            }
        }

        // Find all groups where the user is either a mentor, co-mentor, or mentee
        const groups = await prisma.group.findMany({
            where: {
                OR: [
                    { mentorId: userId },
                    { coMentorIds: { has: userId } },
                    { menteeIds: { has: userId } }
                ]
            },
            include: {
                mentor: true,
                coMentors: true,
                mentees: true
            }
        });

        if (!groups || groups.length === 0) {
            return res.status(404).json({ message: 'User is not assigned to any group.' });
        }

        // Dynamically resolve public signed URLs for profile pictures for all groups
        for (let group of groups) {
            if (group.mentor && group.mentor.profilePic) {
                group.mentor.profilePicUrl = await getPublicUrl({ filePath: group.mentor.profilePic });
            }
            if (group.coMentors) {
                for (let co of group.coMentors) {
                    if (co.profilePic) {
                        co.profilePicUrl = await getPublicUrl({ filePath: co.profilePic });
                    }
                }
            }
            if (group.mentees) {
                for (let m of group.mentees) {
                    if (m.profilePic) {
                        m.profilePicUrl = await getPublicUrl({ filePath: m.profilePic });
                    }
                }
            }
        }

        res.json({ ...groups[0], groups });
    } catch (error) {
        console.error("Error fetching user group:", error);
        res.status(500).json({ message: 'Server error fetching group data' });
    }
};

export const updateUserProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { bio, description, profilePic } = req.body;

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                bio,
                description,
                profilePic
            }
        });

        // Resolve public profile pic url if exists
        let profilePicUrl = null;
        if (updatedUser.profilePic) {
            profilePicUrl = await getPublicUrl({ filePath: updatedUser.profilePic });
        }

        // Exclude password hash from response
        const { passwordHash, ...userResponse } = updatedUser;

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                ...userResponse,
                profilePicUrl
            }
        });
    } catch (error) {
        console.error("Error updating user profile:", error);
        res.status(500).json({ success: false, message: 'Server error updating profile' });
    }
};
