import User from '../models/User.js'; // Adjust path as needed
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// Helper function to generate JWT
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });
};

// @desc    Register a new user
// @route   POST /api/v1/auth/register
// @access  Public (or Admin only, depending on requirements)
const registerUser = async (req, res) => {
  const { firstName, lastName, email, password, role } = req.body;

  try {
    // Basic validation
    if (!firstName || !lastName || !email || !password || !role) {
       return res.status(400).json({ message: 'Please provide all required fields' });
    }
     // Check if valid role
    if (!['Admin', 'Mentor', 'Mentee'].includes(role)) {
       return res.status(400).json({ message: 'Invalid role specified' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create user (password hashing is handled by pre-save hook in model)
    const user = await User.create({
      firstName,
      lastName,
      email,
      password, // Pass plain password here, model hashes it
      role,
    });

    if (user) {
      // Don't send password back, even hashed
      const userResponse = {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        token: generateToken(user._id, user.role), // Optionally send token on register
      };
      res.status(201).json(userResponse);
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Registration Error:', error);
    // Handle potential validation errors from Mongoose
    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(val => val.message);
        return res.status(400).json({ message: messages.join('. ') });
    }
    res.status(500).json({ message: 'Server Error during registration' });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/v1/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Check for user by email, explicitly select password
    const user = await User.findOne({ email }).select('+password');

    // Check if user exists and password matches
    if (user && (await user.matchPassword(password))) {
        const token = generateToken(user._id, user.role);

        // Option 1: Send token in response body
        res.json({
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            token: token,
        });

        // Option 2: Send token in HttpOnly cookie (more secure for web)
        /*
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV !== 'development', // Use secure cookies in production
            sameSite: 'strict', // Prevent CSRF attacks
            maxAge: 24 * 60 * 60 * 1000 // Example: 1 day expiry
        });
        res.status(200).json({ // Send user data without token if using cookies
             _id: user._id,
             firstName: user.firstName,
             lastName: user.lastName,
             email: user.email,
             role: user.role,
        });
        */

    } else {
      res.status(401).json({ message: 'Invalid email or password' }); // Use generic message
    }
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Server Error during login' });
  }
};

// @desc    Get current user profile (example protected route)
// @route   GET /api/v1/auth/me
// @access  Private (requires login)
const getMe = async (req, res) => {
    // req.user is attached by the 'protect' middleware
    if (req.user) {
      res.status(200).json(req.user);
    } else {
       // This case should ideally not be reached if 'protect' middleware works correctly
      res.status(401).json({ message: 'User not found or not authorized' });
    }
};


export { registerUser, loginUser, getMe };