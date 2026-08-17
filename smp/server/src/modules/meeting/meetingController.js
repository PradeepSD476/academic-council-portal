import { prisma } from '../../lib/prisma.js';

import { sendMeetingNotification } from '../../lib/mailer.js';

export const createMeeting = async (req, res) => {
    try {
        const { groupId, date, title, description } = req.body;
        
        if (!groupId || !date || !title) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const group = await prisma.group.findUnique({ 
            where: { id: groupId },
            include: { mentees: true, coMentors: true }
        });
        if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
        if (group.mentorId !== req.user.id && !group.coMentorIds.includes(req.user.id) && req.user.role !== 'ADMIN') {
            return res.status(403).json({ success: false, message: 'Not authorized to create meetings' });
        }

        const defaultAttendeeIds = [
            ...(group.mentees?.map(m => m.id) || []),
            ...(group.coMentors?.map(m => m.id) || [])
        ];

        const meeting = await prisma.meeting.create({
            data: {
                groupId,
                date: new Date(date),
                title,
                description,
                attendeeIds: defaultAttendeeIds
            }
        });

        const emails = [
            ...(group.mentees?.map(m => m.email) || []),
            ...(group.coMentors?.map(m => m.email) || [])
        ];
        sendMeetingNotification(emails, title, date, description);

        res.status(201).json({ success: true, meeting });
    } catch (error) {
        console.error('Create meeting error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getGroupMeetings = async (req, res) => {
    try {
        const { groupId } = req.params;
        
        const meetings = await prisma.meeting.findMany({
            where: { groupId },
            orderBy: { date: 'asc' },
            include: {
                attendees: {
                    select: { id: true, name: true, rollNumber: true }
                }
            }
        });

        res.json({ success: true, meetings });
    } catch (error) {
        console.error('Get meetings error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const updateMeetingMOM = async (req, res) => {
    try {
        const { id } = req.params;
        const { momUrl } = req.body;

        const meetingToUpdate = await prisma.meeting.findUnique({
            where: { id },
            include: { group: true }
        });

        if (!meetingToUpdate) return res.status(404).json({ success: false, message: 'Meeting not found' });
        
        if (meetingToUpdate.group.mentorId !== req.user.id && !meetingToUpdate.group.coMentorIds.includes(req.user.id) && req.user.role !== 'ADMIN') {
            return res.status(403).json({ success: false, message: 'Not authorized to update this meeting' });
        }

        const meeting = await prisma.meeting.update({
            where: { id },
            data: { momUrl }
        });

        res.json({ success: true, meeting });
    } catch (error) {
        console.error('Update MOM error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const updateMeetingAttendance = async (req, res) => {
    try {
        const { id } = req.params;
        const { attendeeIds } = req.body;

        const meetingToUpdate = await prisma.meeting.findUnique({
            where: { id },
            include: { group: true }
        });

        if (!meetingToUpdate) return res.status(404).json({ success: false, message: 'Meeting not found' });
        
        if (meetingToUpdate.group.mentorId !== req.user.id && !meetingToUpdate.group.coMentorIds.includes(req.user.id) && req.user.role !== 'ADMIN') {
            return res.status(403).json({ success: false, message: 'Not authorized to update this meeting' });
        }

        const meeting = await prisma.meeting.update({
            where: { id },
            data: { attendeeIds }
        });

        res.json({ success: true, meeting });
    } catch (error) {
        console.error('Update attendance error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
