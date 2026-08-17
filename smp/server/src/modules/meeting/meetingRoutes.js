import express from 'express';
import { protect } from '../../middlewares/authMiddleware.js';
import { 
    createMeeting, 
    getGroupMeetings, 
    updateMeetingMOM, 
    updateMeetingAttendance 
} from './meetingController.js';

const router = express.Router();

router.post('/', protect, createMeeting);
router.get('/group/:groupId', protect, getGroupMeetings);
router.put('/:id/mom', protect, updateMeetingMOM);
router.put('/:id/attendance', protect, updateMeetingAttendance);

export default router;
