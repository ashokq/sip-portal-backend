// routes/scheduleRoutes.js
import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
    requestMeeting,
    getMySchedules,
    updateMeetingStatus,
} from '../controllers/scheduleController.js';

const router = express.Router();

// Route for Mentees to request a meeting
router.post('/request', protect, authorize('Mentee'), requestMeeting);

// Route for users to get their relevant schedules (Mentee/Mentor view)
router.get('/', protect, authorize('Mentee', 'Mentor', 'Admin'), getMySchedules); // Allow Admin too?

// Route for Mentors (or Admins) to update the status of a request
router.put('/:id/status', protect, authorize('Mentor', 'Admin'), updateMeetingStatus);

// Add other routes as needed:
// router.get('/:id', protect, getScheduleById); // Needs controller + authorization logic
// router.delete('/:id', protect, authorize('Mentee'), cancelMyRequest); // Needs controller

export default router;