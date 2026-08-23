import { prisma } from '../../lib/prisma.js';
import { sendBulkAnnouncement } from '../../lib/mailer.js';

export const getAdminConfig = async (req, res) => {
    try {
        const config = await prisma.systemConfig.findFirst();
        if (!config) {
            return res.status(404).json({ success: false, message: 'System configuration not found' });
        }
        res.json({success: true, ...config});
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error fetching config' });
    }
};

export const updateAdminConfig = async (req, res) => {
    try {
        const {
            isRegistrationOpen,
            isAllocationComplete,
            isFeedbackOpen,
            currentAcademicYear,
            firstYearBatchPrefix,
            secondYearBatchPrefix,
            thirdYearBatchPrefix,
            allowFirstYearLogin,
            allowSecondYearLogin,
            allowThirdYearLogin
        } = req.body;

        const config = await prisma.systemConfig.findFirst();
        if (!config) return res.status(404).json({ success: false, message: 'System config not found' });

        if (isAllocationComplete) {
            const groupCount = await prisma.group.count();
            if (groupCount === 0) {
                return res.status(400).json({ success: false, message: 'Cannot mark allocation as complete when no groups have been formed yet.' });
            }
        }

        const updatedConfig = await prisma.systemConfig.update({
            where: { id: config.id },
            data: {
                isRegistrationOpen,
                isAllocationComplete,
                isFeedbackOpen,
                currentAcademicYear,
                firstYearBatchPrefix,
                secondYearBatchPrefix,
                thirdYearBatchPrefix,
                allowFirstYearLogin,
                allowSecondYearLogin,
                allowThirdYearLogin
            }
        });

        res.json({ success: true, message: 'Configuration updated successfully', config: updatedConfig });
    } catch (error) {
        console.error("Config Update Error:", error);
        res.status(500).json({ success: false, message: error.message || 'Server error updating config' });
    }
};

export const resetDatabase = async (req, res) => {
    try {
        // Delete all feedback and meetings
        await prisma.feedback.deleteMany();
        await prisma.meeting.deleteMany();

        // Delete all groups
        await prisma.group.deleteMany();
        
        // Delete all questionnaire responses
        await prisma.questionnaireResponse.deleteMany();
        
        // Delete all non-admin users
        await prisma.user.deleteMany({
            where: { role: { not: 'ADMIN' } }
        });

        // Reset config flags
        const config = await prisma.systemConfig.findFirst();
        if (config) {
            await prisma.systemConfig.update({
                where: { id: config.id },
                data: {
                    isRegistrationOpen: false,
                    isAllocationComplete: false
                }
            });
        }

        res.json({ success: true, message: 'Database reset successfully. All non-admin data wiped.' });
    } catch (error) {
        console.error("Reset Error:", error);
        res.status(500).json({ success: false, message: 'Server error resetting database' });
    }
};

export const sendAnnouncement = async (req, res) => {
    try {
        const { subject, message } = req.body;

        if (!subject?.trim() || !message?.trim()) {
            return res.status(400).json({ success: false, message: 'Subject and message are required' });
        }

        const recipients = await prisma.user.findMany({
            where: { role: { not: 'ADMIN' } },
            select: { email: true }
        });

        const emails = recipients.map(user => user.email).filter(Boolean);
        if (emails.length === 0) {
            return res.status(404).json({ success: false, message: 'No recipients found for announcement' });
        }

        await sendBulkAnnouncement(emails, subject, message);

        res.json({
            success: true,
            message: 'Announcement sent successfully',
            recipientCount: emails.length
        });
    } catch (error) {
        console.error('Announcement send error:', error);
        res.status(500).json({ success: false, message: 'Server error sending announcement' });
    }
};

export const getGroupAnalytics = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', sortBy = 'meetings', order = 'desc' } = req.query;
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.max(1, parseInt(limit));

        const groups = await prisma.group.findMany({
            include: {
                mentor: { select: { id: true, name: true, rollNumber: true, email: true } },
                coMentors: { select: { id: true, name: true, rollNumber: true, email: true } },
                mentees: { select: { id: true, name: true, rollNumber: true, email: true } },
                meetings: true
            }
        });

        let analytics = groups.map(group => {
            const meetingCount = group.meetings.length;
            const momCount = group.meetings.filter(m => m.momUrl).length;
            const totalMembers = (group.mentees?.length || 0) + (group.coMentors?.length || 0);

            let totalAttendances = 0;
            group.meetings.forEach(m => {
                totalAttendances += (m.attendeeIds?.length || 0);
            });

            const maxPossibleAttendances = meetingCount * totalMembers;
            const avgAttendancePercentage = maxPossibleAttendances > 0 
                ? Math.round((totalAttendances / maxPossibleAttendances) * 100) 
                : 100;

            return {
                id: group.id,
                groupName: group.groupName,
                academicYear: group.academicYear,
                mentor: group.mentor,
                coMentorCount: group.coMentors.length,
                menteeCount: group.mentees.length,
                totalMembers,
                meetingCount,
                momCount,
                avgAttendancePercentage,
                meetings: group.meetings
            };
        });

        if (search) {
            const s = search.toLowerCase();
            analytics = analytics.filter(g => g.groupName.toLowerCase().includes(s));
        }

        // Sorting
        analytics.sort((a, b) => {
            let valA = a.meetingCount;
            let valB = b.meetingCount;
            if (sortBy === 'attendance') {
                valA = a.avgAttendancePercentage;
                valB = b.avgAttendancePercentage;
            } else if (sortBy === 'name') {
                return order === 'asc' ? a.groupName.localeCompare(b.groupName) : b.groupName.localeCompare(a.groupName);
            }
            return order === 'asc' ? valA - valB : valB - valA;
        });

        const totalCount = analytics.length;
        const totalPages = Math.ceil(totalCount / limitNum) || 1;
        const paginatedGroups = analytics.slice((pageNum - 1) * limitNum, pageNum * limitNum);

        res.json({
            success: true,
            groups: paginatedGroups,
            totalCount,
            totalPages,
            currentPage: pageNum
        });
    } catch (error) {
        console.error('Get group analytics error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching group analytics' });
    }
};

export const getUserAttendanceAnalytics = async (req, res) => {
    try {
        const { page = 1, limit = 10, filter = 'all', search = '', sortBy = 'absent', order = 'desc' } = req.query;
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.max(1, parseInt(limit));

        const users = await prisma.user.findMany({
            where: {
                role: { not: 'ADMIN' },
                ...(search ? {
                    OR: [
                        { name: { contains: search, mode: 'insensitive' } },
                        { rollNumber: { contains: search, mode: 'insensitive' } }
                    ]
                } : {})
            },
            include: {
                menteeGroups: { include: { meetings: true } },
                coMentorGroups: { include: { meetings: true } },
                mentorGroups: { include: { meetings: true } }
            }
        });

        let userStats = users.map(user => {
            const groups = [...(user.menteeGroups || []), ...(user.coMentorGroups || []), ...(user.mentorGroups || [])];
            const primaryGroup = groups[0] || null;

            let totalGroupMeetings = 0;
            let meetingsAttended = 0;

            groups.forEach(g => {
                g.meetings.forEach(m => {
                    totalGroupMeetings += 1;
                    if (m.attendeeIds?.includes(user.id)) {
                        meetingsAttended += 1;
                    }
                });
            });

            const isHostMentor = user.smpRole === 'MENTOR';
            const meetingsAbsent = isHostMentor ? 0 : (totalGroupMeetings - meetingsAttended);
            const attendancePercentage = isHostMentor
                ? 100
                : (totalGroupMeetings > 0 ? Math.round((meetingsAttended / totalGroupMeetings) * 100) : 100);

            if (isHostMentor) {
                meetingsAttended = totalGroupMeetings;
            }

            return {
                id: user.id,
                name: user.name,
                rollNumber: user.rollNumber,
                email: user.email,
                smpRole: user.smpRole,
                isHostMentor,
                groupName: primaryGroup?.groupName || 'Unassigned',
                totalGroupMeetings,
                meetingsAttended,
                meetingsAbsent,
                attendancePercentage
            };
        });

        // Filter
        if (filter === 'absent') {
            userStats = userStats.filter(u => u.meetingsAbsent > 0);
        } else if (filter === 'low_attendance') {
            userStats = userStats.filter(u => u.attendancePercentage < 75 && u.totalGroupMeetings > 0);
        }

        // Sort
        userStats.sort((a, b) => {
            let valA = a.meetingsAbsent;
            let valB = b.meetingsAbsent;
            if (sortBy === 'attendance') {
                valA = a.attendancePercentage;
                valB = b.attendancePercentage;
            } else if (sortBy === 'name') {
                return order === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
            }
            return order === 'asc' ? valA - valB : valB - valA;
        });

        const totalCount = userStats.length;
        const totalPages = Math.ceil(totalCount / limitNum) || 1;
        const paginatedUsers = userStats.slice((pageNum - 1) * limitNum, pageNum * limitNum);

        res.json({
            success: true,
            users: paginatedUsers,
            totalCount,
            totalPages,
            currentPage: pageNum
        });
    } catch (error) {
        console.error('Get user attendance analytics error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching user attendance analytics' });
    }
};

export const getFeedbackAnalytics = async (req, res) => {
    try {
        const { page = 1, limit = 10, badOnly = 'false', minRating, maxRating, search = '', sortBy = 'createdAt', order = 'desc' } = req.query;
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.max(1, parseInt(limit));

        const where = {};
        if (badOnly === 'true') {
            where.rating = { lte: 2 };
        } else if (minRating || maxRating) {
            where.rating = {};
            if (minRating) where.rating.gte = parseInt(minRating);
            if (maxRating) where.rating.lte = parseInt(maxRating);
        }

        let feedbackList = await prisma.feedback.findMany({
            where,
            include: {
                fromUser: {
                    select: { id: true, name: true, rollNumber: true, email: true, smpRole: true }
                },
                toUser: {
                    select: { id: true, name: true, rollNumber: true, email: true, smpRole: true }
                },
                group: {
                    select: { id: true, groupName: true }
                }
            },
            orderBy: sortBy === 'rating' ? { rating: order } : { createdAt: order }
        });

        if (search) {
            const s = search.toLowerCase();
            feedbackList = feedbackList.filter(f => 
                (f.comments && f.comments.toLowerCase().includes(s)) ||
                (f.fromUser?.name && f.fromUser.name.toLowerCase().includes(s)) ||
                (f.fromUser?.rollNumber && f.fromUser.rollNumber.toLowerCase().includes(s)) ||
                (f.toUser?.name && f.toUser.name.toLowerCase().includes(s)) ||
                (f.toUser?.rollNumber && f.toUser.rollNumber.toLowerCase().includes(s)) ||
                (f.group?.groupName && f.group.groupName.toLowerCase().includes(s))
            );
        }

        const totalCount = feedbackList.length;
        const totalPages = Math.ceil(totalCount / limitNum) || 1;
        const paginatedFeedback = feedbackList.slice((pageNum - 1) * limitNum, pageNum * limitNum);

        res.json({
            success: true,
            feedback: paginatedFeedback,
            totalCount,
            totalPages,
            currentPage: pageNum
        });
    } catch (error) {
        console.error('Get feedback analytics error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching feedback analytics' });
    }
};

export const renewFeedbackCycle = async (req, res) => {
    try {
        const result = await prisma.feedback.deleteMany();

        res.json({
            success: true,
            message: `Feedback process renewed successfully. Cleared ${result.count} feedback submission(s).`,
            deletedCount: result.count
        });
    } catch (error) {
        console.error('Renew feedback error:', error);
        res.status(500).json({ success: false, message: 'Server error renewing feedback process' });
    }
};

function escapeCSV(val) {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
}

export const exportUsersCSV = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            where: { role: { not: 'ADMIN' } },
            include: {
                mentorGroups: { select: { groupName: true } },
                coMentorGroups: { select: { groupName: true } },
                menteeGroups: { select: { groupName: true } },
                response: { select: { branch: true, academicYear: true } }
            },
            orderBy: [{ smpRole: 'asc' }, { rollNumber: 'asc' }]
        });

        const headers = [
            'Roll Number',
            'Name',
            'Email',
            'Role',
            'Branch',
            'Assigned Groups',
            'Academic Year',
            'Questionnaire Submitted'
        ];

        const rows = users.map(u => {
            const assignedGroups = [
                ...((u.mentorGroups || []).map(g => `${g.groupName} (Mentor)`)),
                ...((u.coMentorGroups || []).map(g => `${g.groupName} (Co-Mentor)`)),
                ...((u.menteeGroups || []).map(g => `${g.groupName} (Mentee)`))
            ].join('; ') || 'None';

            const branch = u.response?.branch || 'N/A';
            const academicYear = u.response?.academicYear || 'N/A';
            const hasSubmitted = u.response ? 'Yes' : 'No';

            return [
                escapeCSV(u.rollNumber),
                escapeCSV(u.name),
                escapeCSV(u.email),
                escapeCSV(u.smpRole || 'UNASSIGNED'),
                escapeCSV(branch),
                escapeCSV(assignedGroups),
                escapeCSV(academicYear),
                escapeCSV(hasSubmitted)
            ].join(',');
        });

        const csvContent = [headers.map(h => `"${h}"`).join(','), ...rows].join('\r\n');

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="smp_all_users.csv"');
        return res.status(200).send(csvContent);
    } catch (error) {
        console.error('Export users CSV error:', error);
        res.status(500).json({ success: false, message: 'Server error exporting users CSV' });
    }
};

export const exportGroupsCSV = async (req, res) => {
    try {
        const { format = 'roster' } = req.query; // 'roster' (official matrix) or 'members' (row-by-row table)
        const groups = await prisma.group.findMany({
            include: {
                mentor: { select: { name: true, rollNumber: true, email: true } },
                coMentors: { select: { name: true, rollNumber: true, email: true } },
                mentees: { select: { name: true, rollNumber: true, email: true } }
            },
            orderBy: { groupName: 'asc' }
        });

        let csvContent = '';

        if (format === 'members') {
            // Normalized table: 1 row per student assignment
            const headers = [
                'Group Name',
                'Academic Year',
                'Role In Group',
                'Member Name',
                'Roll Number',
                'Email'
            ];

            const rows = [];
            for (const g of groups) {
                if (g.mentor) {
                    rows.push([
                        escapeCSV(g.groupName),
                        escapeCSV(g.academicYear),
                        escapeCSV('Lead Mentor'),
                        escapeCSV(g.mentor.name),
                        escapeCSV(g.mentor.rollNumber),
                        escapeCSV(g.mentor.email)
                    ].join(','));
                }
                for (const co of (g.coMentors || [])) {
                    rows.push([
                        escapeCSV(g.groupName),
                        escapeCSV(g.academicYear),
                        escapeCSV('Co-Mentor'),
                        escapeCSV(co.name),
                        escapeCSV(co.rollNumber),
                        escapeCSV(co.email)
                    ].join(','));
                }
                for (const m of (g.mentees || [])) {
                    rows.push([
                        escapeCSV(g.groupName),
                        escapeCSV(g.academicYear),
                        escapeCSV('Mentee'),
                        escapeCSV(m.name),
                        escapeCSV(m.rollNumber),
                        escapeCSV(m.email)
                    ].join(','));
                }
            }
            csvContent = [headers.map(h => `"${h}"`).join(','), ...rows].join('\r\n');
        } else {
            // Official Master Roster: 1 row per group with Name & Roll Numbers
            const headers = [
                'Group Name',
                'Academic Year',
                'Lead Mentor (Name & Roll)',
                'Lead Mentor Email',
                'Co-Mentors (Name & Roll)',
                'Mentees (Name & Roll)',
                'Total Co-Mentors',
                'Total Mentees',
                'Total Group Size'
            ];

            const rows = groups.map(g => {
                const mentorInfo = g.mentor ? `${g.mentor.name} (${g.mentor.rollNumber})` : 'Unassigned';
                const mentorEmail = g.mentor?.email || 'N/A';
                const coMentorsInfo = (g.coMentors || []).map(co => `${co.name} (${co.rollNumber})`).join('; ') || 'None';
                const menteesInfo = (g.mentees || []).map(m => `${m.name} (${m.rollNumber})`).join('; ') || 'None';
                const totalCo = (g.coMentors || []).length;
                const totalMe = (g.mentees || []).length;
                const totalSize = (g.mentor ? 1 : 0) + totalCo + totalMe;

                return [
                    escapeCSV(g.groupName),
                    escapeCSV(g.academicYear),
                    escapeCSV(mentorInfo),
                    escapeCSV(mentorEmail),
                    escapeCSV(coMentorsInfo),
                    escapeCSV(menteesInfo),
                    escapeCSV(totalCo),
                    escapeCSV(totalMe),
                    escapeCSV(totalSize)
                ].join(',');
            });

            csvContent = [headers.map(h => `"${h}"`).join(','), ...rows].join('\r\n');
        }

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="smp_official_groups_${format}.csv"`);
        return res.status(200).send(csvContent);
    } catch (error) {
        console.error('Export groups CSV error:', error);
        res.status(500).json({ success: false, message: 'Server error exporting groups CSV' });
    }
};


