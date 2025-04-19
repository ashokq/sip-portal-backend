// controllers/announcementController.js
import Announcement from '../models/Announcement.js';
import asyncHandler from 'express-async-handler';
// Import WebSocket server instance if implementing real-time (e.g., import { io } from '../server.js')

// @desc    Create a new announcement
// @route   POST /api/v1/announcements
// @access  Private (Admin)
const createAnnouncement = asyncHandler(async (req, res) => {
  const { title, content, targetRoles } = req.body;

  if (!title || !content) {
    res.status(400);
    throw new Error('Please provide title and content');
  }

  // Validate targetRoles if provided
  const validRoles = ['Admin', 'Mentor', 'Mentee', 'All'];
  if (targetRoles && !targetRoles.every(role => validRoles.includes(role))) {
      res.status(400);
      throw new Error('Invalid target role specified');
  }

  const announcement = new Announcement({
    title,
    content,
    author: req.user._id, // Admin user ID from protect middleware
    targetRoles: targetRoles || ['All'], // Default to 'All' if not specified
  });

  const createdAnnouncement = await announcement.save();

  // --- Real-time Update (WebSocket Example Outline) ---
  // if (io) { // Check if WebSocket server instance exists
  //   // Emit event to relevant clients based on targetRoles
  //   io.to('announcements').emit('new_announcement', createdAnnouncement); // Basic example: emit to all in a room
  //   // More advanced: Emit only to sockets associated with target roles
  // }
  // --- End Real-time Update ---


  res.status(201).json(createdAnnouncement);
});

// @desc    Get announcements relevant to the logged-in user's role
// @route   GET /api/v1/announcements
// @access  Private (Authenticated Users)
const getAnnouncements = asyncHandler(async (req, res) => {
  const userRole = req.user.role;
  const { limit = 10 } = req.query; // Allow limiting results, default 10

  // Find announcements where targetRoles includes the user's role OR 'All'
  const query = {
      targetRoles: { $in: [userRole, 'All'] }
      // Optional: Add condition for expiry date if implemented: expiresAt: { $gte: new Date() }
  };

  const announcements = await Announcement.find(query)
    .populate('author', 'firstName lastName') // Show author details
    .sort({ createdAt: -1 }) // Get the latest ones first
    .limit(parseInt(limit)); // Limit the number of results

  res.json(announcements);
});

// @desc    Delete an announcement
// @route   DELETE /api/v1/announcements/:id
// @access  Private (Admin)
const deleteAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id);

  if (!announcement) {
    res.status(404);
    throw new Error('Announcement not found');
  }

  // No specific ownership check needed as only Admins can access this route (via router config)

  await announcement.deleteOne();

   // --- Real-time Update (WebSocket Example Outline) ---
   // if (io) {
   //   io.to('announcements').emit('delete_announcement', { id: req.params.id });
   // }
   // --- End Real-time Update ---

  res.json({ message: 'Announcement removed' });
});

// Add getAnnouncementById, updateAnnouncement if needed

export {
  createAnnouncement,
  getAnnouncements,
  deleteAnnouncement,
};