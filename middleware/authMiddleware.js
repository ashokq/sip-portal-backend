import jwt from 'jsonwebtoken';
import User from '../models/User.js'; // Adjust path as needed

// Middleware to protect routes - checks for valid JWT
const protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header (Bearer token) or cookies
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token payload (using the id) and attach to request
      // Exclude password field
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
          return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      next(); // Proceed to the next middleware/route handler
    } catch (error) {
      console.error('Token verification failed:', error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }
  // Example: Check for token in cookies (if you choose that strategy)
  // else if (req.cookies.token) { ... similar logic ... }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Middleware for role-based authorization
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
        // Should be caught by 'protect' middleware first, but good practice to check
        return res.status(401).json({ message: 'Not authorized to access this route' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `User role '${req.user.role}' is not authorized to access this route`,
      });
    }
    next();
  };
};

export { protect, authorize };