// controllers/scheduleController.js
import Schedule from '../models/Schedule.js';
import User from '../models/User.js'; // To find assigned mentor/mentee details
import asyncHandler from 'express-async-handler';
import { sendMeetingRequestEmail, sendMeetingStatusUpdateEmail } from '../utils/emailSender.js'; // Import email utility

// @desc    Mentee requests a meeting with their assigned Mentor
// @route   POST /api/v1/schedules/request
// @access  Private (Mentee)
const requestMeeting = asyncHandler(async (req, res) => {
    const { requestedTime, durationMinutes, message } = req.body;
    const menteeId = req.user._id; // Logged-in user is the Mentee

    // --- Find the assigned mentor ---
    // This logic depends on how mentors are assigned. Assuming it's stored on the Mentee's User document.
    const menteeUser = await User.findById(menteeId);
    if (!menteeUser || !menteeUser.assignedMentorId) { // Make sure assignedMentorId field exists on User model for Mentees
        res.status(400);
        throw new Error('Assigned mentor not found for this user.');
    }
    const mentorId = menteeUser.assignedMentorId;
    // --- End Find Mentor ---

    if (!requestedTime || !durationMinutes) {
        res.status(400);
        throw new Error('Please provide requested time and duration');
    }

    // Optional: Add validation to prevent requesting meetings in the past
    if (new Date(requestedTime) < new Date()) {
         res.status(400);
         throw new Error('Cannot request a meeting in the past.');
    }

    const scheduleRequest = new Schedule({
        mentee: menteeId,
        mentor: mentorId,
        requestedTime,
        durationMinutes,
        message,
        status: 'Pending',
    });

    const createdRequest = await scheduleRequest.save();

    // --- Send Email Notification to Mentor ---
    try {
        const mentorUser = await User.findById(mentorId);
        if (mentorUser && menteeUser) {
             await sendMeetingRequestEmail(mentorUser, menteeUser, createdRequest);
        }
    } catch (emailError) {
        console.error("Failed to send meeting request email:", emailError);
        // Don't fail the request, just log the email error
    }
    // --- End Email Notification ---

    res.status(201).json(createdRequest);
});

// @desc    Get meetings relevant to the logged-in user (Mentee or Mentor)
// @route   GET /api/v1/schedules
// @access  Private (Mentee, Mentor, Admin)
const getMySchedules = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const userRole = req.user.role;
    const { status, upcoming, past } = req.query; // Optional query filters

    let query = {};

    // Filter by user role
    if (userRole === 'Mentee') {
        query.mentee = userId;
    } else if (userRole === 'Mentor') {
        query.mentor = userId;
    }
    // Admins might see all - requires separate logic or endpoint

    // Filter by status
    if (status) {
        query.status = status; // e.g., 'Pending', 'Confirmed'
    }

    // Filter by time (upcoming/past)
    const now = new Date();
    if (upcoming === 'true') {
        // Show pending requests OR confirmed meetings in the future
        query.$or = [
            { status: 'Pending' },
            { status: 'Confirmed', confirmedTime: { $gte: now } }
        ];
    }
    if (past === 'true') {
         // Show completed/rejected/cancelled OR confirmed meetings in the past
         query.$or = [
            { status: { $in: ['Completed', 'Rejected', 'Cancelled'] } },
            { status: 'Confirmed', confirmedTime: { $lt: now } }
        ];
        // Note: Combining $or conditions with other query fields requires careful structure if needed.
    }


    const schedules = await Schedule.find(query)
        .populate('mentee', 'firstName lastName email') // Populate user details
        .populate('mentor', 'firstName lastName email')
        .sort({ createdAt: -1 }); // Sort by creation date, adjust as needed

    res.json(schedules);
});


// @desc    Mentor updates the status of a meeting request
// @route   PUT /api/v1/schedules/:id/status
// @access  Private (Mentor of the request, Admin)
const updateMeetingStatus = asyncHandler(async (req, res) => {
    const { status, mentorNotes, confirmedTime } = req.body; // New status and optional notes/time
    const scheduleId = req.params.id;
    const mentorId = req.user._id; // Logged-in user is the Mentor

    const schedule = await Schedule.findById(scheduleId);

    if (!schedule) {
        res.status(404);
        throw new Error('Schedule request not found');
    }

    // Authorization: Ensure logged-in user is the mentor for this request or an Admin
    if (schedule.mentor.toString() !== mentorId.toString() && req.user.role !== 'Admin') {
        res.status(403);
        throw new Error('User not authorized to update this schedule request');
    }

    // Validate status transition (basic example)
    const allowedStatuses = ['Confirmed', 'Rejected', 'Completed', 'Cancelled']; // Mentor can change Pending to these
    if (schedule.status !== 'Pending' && !allowedStatuses.includes(status) ) {
         // Add more complex logic if needed (e.g., cannot change from Confirmed to Rejected easily)
         res.status(400);
         throw new Error(`Cannot change status from ${schedule.status} to ${status}`);
    }
     if (!allowedStatuses.includes(status)) {
         res.status(400);
         throw new Error(`Invalid target status: ${status}`);
     }

    // If confirming, require confirmedTime
    if (status === 'Confirmed' && !confirmedTime) {
        res.status(400);
        throw new Error('Confirmed time is required when confirming a meeting');
    }
     // Optional: Validate confirmedTime is in the future

    schedule.status = status;
    schedule.mentorNotes = mentorNotes || schedule.mentorNotes; // Update notes if provided
    if (status === 'Confirmed') {
        schedule.confirmedTime = confirmedTime;
    } else {
        // Clear confirmed time if status is not 'Confirmed'
        schedule.confirmedTime = undefined;
    }

    const updatedSchedule = await schedule.save();

    // --- Send Email Notification to Mentee ---
    try {
        const menteeUser = await User.findById(schedule.mentee);
        const mentorUser = await User.findById(schedule.mentor); // Req user is mentor
        if (menteeUser && mentorUser) {
            await sendMeetingStatusUpdateEmail(menteeUser, mentorUser, updatedSchedule);
        }
    } catch (emailError) {
        console.error("Failed to send meeting status update email:", emailError);
        // Log error, but don't fail the request
    }
    // --- End Email Notification ---

    res.json(updatedSchedule);
});

// Add more controllers if needed: getScheduleById, deleteScheduleRequest (Mentee perhaps?), etc.

export {
    requestMeeting,
    getMySchedules,
    updateMeetingStatus,
};