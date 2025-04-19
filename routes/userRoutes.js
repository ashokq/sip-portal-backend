// routes/userRoutes.js
import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js'; // Adjust path
// Import the implemented controller functions
import {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser
} from '../controllers/userController.js'; // Adjust path

const router = express.Router();

// Protect all user routes and authorize only Admins
router.use(protect);
router.use(authorize('Admin'));

// Define routes using the controller functions
router.route('/')
    .get(getAllUsers)
    .post(createUser);

router.route('/:id')
    .get(getUserById)
    .put(updateUser)
    .delete(deleteUser);

export default router;