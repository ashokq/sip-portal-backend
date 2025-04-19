// controllers/userController.js
import User from '../models/User.js'; // Adjust path
import asyncHandler from 'express-async-handler';

// @desc    Get all users (Admin only)
// @route   GET /api/v1/users
// @access  Private (Admin)
const getAllUsers = asyncHandler(async (req, res) => {
    // Add pagination later if needed
    const users = await User.find({}).select('-password'); // Exclude password
    res.json(users);
});

// @desc    Get user by ID (Admin only)
// @route   GET /api/v1/users/:id
// @access  Private (Admin)
const getUserById = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select('-password');
    if (user) {
        res.json(user);
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Create a new user (Admin only)
// @route   POST /api/v1/users
// @access  Private (Admin)
const createUser = asyncHandler(async (req, res) => {
    const { firstName, lastName, email, password, role } = req.body;

    // Basic validation
    if (!firstName || !lastName || !email || !password || !role) {
       res.status(400);
       throw new Error('Please provide all required fields (firstName, lastName, email, password, role)');
    }
    if (!['Admin', 'Mentor', 'Mentee'].includes(role)) {
        res.status(400);
        throw new Error('Invalid role specified');
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(400);
        throw new Error('User already exists with this email');
    }

    // Password hashing is handled by the pre-save hook in the User model
    const user = await User.create({
        firstName,
        lastName,
        email,
        password, // Pass plain password
        role,
    });

    if (user) {
        // Don't send password back
        const userResponse = {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
        };
        res.status(201).json(userResponse);
    } else {
        res.status(400); // Should have thrown error earlier if creation failed
        throw new Error('Invalid user data');
    }
});

// @desc    Update user details (Admin only)
// @route   PUT /api/v1/users/:id
// @access  Private (Admin)
const updateUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    // Get fields to update from request body
    const { firstName, lastName, email, role, password } = req.body;

    // Update basic fields if provided
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.role = role || user.role;

    // Handle email update (check for uniqueness if changed)
    if (email && email !== user.email) {
        const emailExists = await User.findOne({ email });
        if (emailExists) {
            res.status(400);
            throw new Error('Email address is already registered');
        }
        user.email = email;
    }

    // Handle password update (only if a new password is provided)
    if (password) {
        // The pre-save hook in the model will hash this new password
        user.password = password;
    }

    // Add logic to update assignedMentorId or assignedMenteeIds if needed

    const updatedUser = await user.save(); // Triggers pre-save hook if password changed

    // Respond with updated user details (excluding password)
    const userResponse = {
        _id: updatedUser._id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        role: updatedUser.role,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
    };

    res.json(userResponse);
});

// @desc    Delete a user (Admin only)
// @route   DELETE /api/v1/users/:id
// @access  Private (Admin)
const deleteUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    // Optional: Add checks to prevent deleting the last Admin user?

    // TODO: Consider cleanup logic:
    // - What happens to courses created by a deleted Mentor? (Reassign? Delete?)
    // - What happens to enrollments/schedules of a deleted Mentee/Mentor?
    // This depends heavily on application requirements. For now, just delete the user.

    await user.deleteOne();
    res.json({ message: 'User removed successfully' });
});


export {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
};