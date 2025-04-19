// routes/announcementRoutes.js
import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
    createAnnouncement,
    getAnnouncements,
    deleteAnnouncement
} from '../controllers/announcementController.js';

const router = express.Router();

// Create Announcement (Admin Only)
router.post('/', protect, authorize('Admin'), createAnnouncement);

// Get Announcements (All authenticated users - filtered by role in controller)
router.get('/', protect, getAnnouncements);

// Delete Announcement (Admin Only)
router.delete('/:id', protect, authorize('Admin'), deleteAnnouncement);

// Add GET /:id or PUT /:id if needed later

export default router;