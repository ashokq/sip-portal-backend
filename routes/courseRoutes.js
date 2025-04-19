// routes/courseRoutes.js
import express from 'express';
// ... other imports ...
import moduleRouter from './moduleRoutes.js'; // Import the module router
import { createModule, getModulesForCourse } from '../controllers/moduleController.js'; // Import needed module controllers

const router = express.Router();

// --- Course Routes ---
// ... existing course routes ...

// --- Nested Module Routes ---
// Route for getting/creating modules for a specific course
 router.route('/:courseId/modules')
     .post(protect, authorize('Mentor', 'Admin'), createModule) // Ownership checked in controller
     .get(protect, getModulesForCourse); // Access controlled in controller

// Mount the separate module router for routes like /:courseId/modules/:moduleId/...
router.use('/modules', moduleRouter); // This needs careful handling if module routes are defined relative to /modules/:id

// ---- OR ---- (Simpler Nesting - Define all module routes directly here if preferred)
/*
router.route('/:courseId/modules')
     .post(protect, authorize('Mentor', 'Admin'), createModule); // Ownership checked in controller
     .get(protect, getModulesForCourse); // Access controlled in controller

// Mount content item routes nested under modules (requires importing contentItemRouter)
// Requires careful router setup
// router.use('/:courseId/modules/:moduleId/content-items', contentItemRouter);

// Define PUT/DELETE for modules directly here
router.route('/:courseId/modules/:moduleId') // Use :moduleId instead of :id if nesting this way
     .put(protect, authorize('Mentor','Admin'), updateModule) // Need controller adapted to use :moduleId
     .delete(protect, authorize('Mentor','Admin'), deleteModule); // Need controller adapted to use :moduleId
*/

export default router;