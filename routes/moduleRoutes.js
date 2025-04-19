// routes/moduleRoutes.js
import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
    updateModule,
    deleteModule,
    getModuleById // May not be needed if always accessed via course
} from '../controllers/moduleController.js';
import contentItemRouter from './contentItemRoutes.js'; // Import content item router

// If merging routers, ensure param names don't conflict
const router = express.Router({ mergeParams: true }); // mergeParams allows access to parent route params (like :courseId)

// Route for content items nested under modules
router.use('/:moduleId/content-items', contentItemRouter); // Nest content item routes

router.route('/:id') // Here :id refers to the module ID
    .get(protect, getModuleById) // Access control done in controller
    .put(protect, authorize('Mentor', 'Admin'), updateModule) // Ownership checked in controller
    .delete(protect, authorize('Mentor', 'Admin'), deleteModule); // Ownership checked in controller


export default router;