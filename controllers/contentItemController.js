// controllers/contentItemController.js
import ContentItem from '../models/ContentItem.js';
import Module from '../models/Module.js'; // Needed for authorization check via course
import Course from '../models/Course.js'; // Needed for authorization check
import asyncHandler from 'express-async-handler';

// Helper function to check module ownership/authorization
const checkModuleAuthorization = async (moduleId, userId, userRole) => {
    const module = await Module.findById(moduleId).populate({
        path: 'course',
        select: 'mentor' // Select only the mentor field from the course
    });

    if (!module) {
        throw { statusCode: 404, message: 'Module not found' };
    }
    if (!module.course) {
         throw { statusCode: 404, message: 'Associated course not found for module' };
    }

    // Check if user is the mentor of the course associated with the module or an Admin
    if (module.course.mentor.toString() !== userId.toString() && userRole !== 'Admin') {
         throw { statusCode: 403, message: 'User not authorized for this module' };
    }
    return module; // Return module if authorized
};


// @desc    Create a new content item for a specific module
// @route   POST /api/v1/modules/:moduleId/content-items
// @access  Private (Mentor owner of the course, Admin)
const createContentItem = asyncHandler(async (req, res) => {
  const { title, itemType, order, lectureContent, videoUrl, taskDescription } = req.body;
  // resourceUrl will be handled separately if uploading files
  const { moduleId } = req.params;

  // Authorization check
  await checkModuleAuthorization(moduleId, req.user._id, req.user.role);

  // Basic Validation
  if (!title || !itemType || order === undefined) {
    res.status(400);
    throw new Error('Please provide title, item type, and order');
  }

  // Type-specific validation
   if (itemType === 'Lecture' && !lectureContent) throw new Error('Lecture content is required');
   if (itemType === 'Video' && !videoUrl) throw new Error('Video URL is required');
   if (itemType === 'Task' && !taskDescription) throw new Error('Task description is required');
   // 'Resource' type might not require resourceUrl immediately if file upload happens after creation

  const contentItemData = {
    title,
    itemType,
    order,
    module: moduleId,
    lectureContent: itemType === 'Lecture' ? lectureContent : undefined,
    videoUrl: itemType === 'Video' ? videoUrl : undefined,
    taskDescription: itemType === 'Task' ? taskDescription : undefined,
    // resourceUrl: handled during/after file upload for 'Resource' type
  };

  const contentItem = new ContentItem(contentItemData);
  const createdContentItem = await contentItem.save();
  res.status(201).json(createdContentItem);

  // NOTE: If itemType is 'Resource', the file upload logic would typically happen
  // either in this request (if using multer here) or in a subsequent request
  // to associate the uploaded file URL with this createdContentItem.
});


// @desc    Get all content items for a specific module
// @route   GET /api/v1/modules/:moduleId/content-items
// @access  Private (Users associated with the course)
const getContentItemsForModule = asyncHandler(async (req, res) => {
  const { moduleId } = req.params;
  // TODO: Authorization check - ensure user is enrolled or is the mentor/admin
  const contentItems = await ContentItem.find({ module: moduleId }).sort('order');
  res.json(contentItems);
});


// @desc    Get a single content item by ID
// @route   GET /api/v1/content-items/:id
// @access  Private (Users associated with the course)
const getContentItemById = asyncHandler(async (req, res) => {
    const contentItem = await ContentItem.findById(req.params.id);
    if (!contentItem) {
        res.status(404);
        throw new Error('Content item not found');
    }
     // TODO: Authorization check based on parent module/course access
    res.json(contentItem);
});


// @desc    Update a content item
// @route   PUT /api/v1/content-items/:id
// @access  Private (Mentor owner of the course, Admin)
const updateContentItem = asyncHandler(async (req, res) => {
  const { title, order, lectureContent, videoUrl, taskDescription /* other fields */ } = req.body;
  const contentItem = await ContentItem.findById(req.params.id);

  if (!contentItem) {
    res.status(404);
    throw new Error('Content item not found');
  }

  // Authorization check using helper function
  await checkModuleAuthorization(contentItem.module, req.user._id, req.user.role);

  // Update fields
  contentItem.title = title || contentItem.title;
  if (order !== undefined) contentItem.order = order;

  // Update type-specific fields based on itemType (cannot change itemType easily)
  switch (contentItem.itemType) {
    case 'Lecture':
      contentItem.lectureContent = lectureContent !== undefined ? lectureContent : contentItem.lectureContent;
      break;
    case 'Video':
      contentItem.videoUrl = videoUrl !== undefined ? videoUrl : contentItem.videoUrl;
      break;
    case 'Task':
      contentItem.taskDescription = taskDescription !== undefined ? taskDescription : contentItem.taskDescription;
      break;
     case 'Resource':
       // resourceUrl update might happen via a separate file upload endpoint
       break;
  }

  const updatedContentItem = await contentItem.save();
  res.json(updatedContentItem);
});


// @desc    Delete a content item
// @route   DELETE /api/v1/content-items/:id
// @access  Private (Mentor owner of the course, Admin)
const deleteContentItem = asyncHandler(async (req, res) => {
  const contentItem = await ContentItem.findById(req.params.id);

  if (!contentItem) {
    res.status(404);
    throw new Error('Content item not found');
  }

  // Authorization check
  await checkModuleAuthorization(contentItem.module, req.user._id, req.user.role);

  // TODO: If itemType is 'Resource', delete the associated file from storage (S3, etc.)

  await contentItem.deleteOne();
  res.json({ message: 'Content item removed' });
});


// --- File Upload Handling (Example for Resource Type) ---

// @desc    Upload a resource file and link it to a content item
// @route   PUT /api/v1/content-items/:id/upload-resource
// @access  Private (Mentor owner of the course, Admin)
const uploadResourceFile = asyncHandler(async (req, res) => {
     const contentItem = await ContentItem.findById(req.params.id);

     if (!contentItem) {
        res.status(404); throw new Error('Content item not found');
     }
     if (contentItem.itemType !== 'Resource') {
        res.status(400); throw new Error('Content item is not of type Resource');
     }

     // Authorization check
     await checkModuleAuthorization(contentItem.module, req.user._id, req.user.role);

     // --- Multer/File Handling Logic ---
     // The 'upload' middleware (defined below or imported) handles the file saving.
     // 'req.file' will contain information about the uploaded file.
     if (!req.file) {
        res.status(400); throw new Error('Please upload a file');
     }

     // Example: If storing locally (NOT recommended for production)
     // const resourceUrl = `/uploads/${req.file.filename}`;

     // Example: If uploaded to Cloud Storage (S3, GCS, etc.)
     // The storage configuration in multer (or separate upload logic)
     // would provide the final URL or file key.
     // For S3, req.file might have a 'location' property.
     const resourceUrl = req.file.location || `/uploads/${req.file.key}`; // Adjust based on storage engine

     contentItem.resourceUrl = resourceUrl;
     contentItem.originalFileName = req.file.originalname; // Store original name too
     await contentItem.save();

     res.status(200).json({
         message: 'File uploaded successfully',
         data: contentItem // Send back updated item
     });
});


export {
  createContentItem,
  getContentItemsForModule,
  getContentItemById,
  updateContentItem,
  deleteContentItem,
  uploadResourceFile, // Export file upload handler
};