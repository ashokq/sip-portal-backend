// routes/contentItemRoutes.js
import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
    createContentItem,
    getContentItemsForModule,
    getContentItemById, // Separate route to get single item
    updateContentItem,
    deleteContentItem,
    uploadResourceFile // Import upload handler
} from '../controllers/contentItemController.js';
import upload from '../middleware/uploadMiddleware.js'; // Import multer config

const router = express.Router({ mergeParams: true }); // mergeParams needed to access :moduleId

// Routes relative to /api/v1/modules/:moduleId/content-items

router.route('/')
    .post(protect, authorize('Mentor', 'Admin'), createContentItem) // Ownership checked in controller
    .get(protect, getContentItemsForModule); // Access controlled in controller

router.route('/:id') // Here :id refers to the content item ID
     .get(protect, getContentItemById) // Access controlled in controller
     .put(protect, authorize('Mentor', 'Admin'), updateContentItem) // Ownership checked in controller
     .delete(protect, authorize('Mentor', 'Admin'), deleteContentItem); // Ownership checked in controller

// Route for uploading resource files
router.route('/:id/upload-resource')
     .put(
         protect,
         authorize('Mentor', 'Admin'), // Check ownership/role
         upload.single('resourceFile'), // Use multer middleware - 'resourceFile' is the input field name
         uploadResourceFile
     );

export default router;