import express from 'express';
import { registerUser, loginUser, getMe } from '../controllers/authController.js'; // Adjust path as needed
import { protect } from '../middleware/authMiddleware.js'; // Adjust path as needed

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe); // Example: Protect the 'getMe' route

export default router;