// controllers/moduleController.js
import Module from '../models/Module.js';
import Course from '../models/Course.js'; // Needed for authorization check
import asyncHandler from 'express-async-handler';

// @desc    Create a new module for a specific course
// @route   POST /api/v1/courses/:courseId/modules
// @access  Private (Mentor owner of the course, Admin)
const createModule = asyncHandler(async (req, res) => {
  const { title, order } = req.body;
  const { courseId } = req.params;

  if (!title || order === undefined) {
    res.status(400);
    throw new Error('Please provide title and order');
  }

  // Find the course to check ownership
  const course = await Course.findById(courseId);
  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }

  // Authorization: Check if logged-in user is the course mentor or Admin
  if (course.mentor.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
    res.status(403);
    throw new Error('User not authorized to add modules to this course');
  }

  const module = new Module({
    title,
    order,
    course: courseId,
  });

  const createdModule = await module.save();
  res.status(201).json(createdModule);
});

// @desc    Get all modules for a specific course
// @route   GET /api/v1/courses/:courseId/modules
// @access  Private (Users associated with the course - Mentor, Admin, Enrolled Mentees)
const getModulesForCourse = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  // TODO: Add authorization check - ensure user is enrolled or is the mentor/admin
  // This might involve checking an Enrollment model or course ownership.
  // For now, assuming access if user can access the course itself.

  const modules = await Module.find({ course: courseId }).sort('order'); // Sort by order
  res.json(modules);
});

// @desc    Get a single module by ID
// @route   GET /api/v1/modules/:id
// @access  Private (Users associated with the course)
const getModuleById = asyncHandler(async (req, res) => {
    const module = await Module.findById(req.params.id);

    if (!module) {
        res.status(404);
        throw new Error('Module not found');
    }

    // TODO: Authorization check - ensure user has access to the parent course.
    res.json(module);
});


// @desc    Update a module
// @route   PUT /api/v1/modules/:id
// @access  Private (Mentor owner of the course, Admin)
const updateModule = asyncHandler(async (req, res) => {
  const { title, order } = req.body;
  const module = await Module.findById(req.params.id).populate('course'); // Populate course to check mentor

  if (!module) {
    res.status(404);
    throw new Error('Module not found');
  }

  // Authorization: Check if logged-in user is the course mentor or Admin
  if (module.course.mentor.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
    res.status(403);
    throw new Error('User not authorized to update this module');
  }

  module.title = title || module.title;
  // Ensure order is explicitly provided if updating, or handle reordering logic separately
  if (order !== undefined) {
      module.order = order;
  }

  const updatedModule = await module.save();
  res.json(updatedModule);
});

// @desc    Delete a module
// @route   DELETE /api/v1/modules/:id
// @access  Private (Mentor owner of the course, Admin)
const deleteModule = asyncHandler(async (req, res) => {
  const module = await Module.findById(req.params.id).populate('course');

  if (!module) {
    res.status(404);
    throw new Error('Module not found');
  }

   // Authorization: Check if logged-in user is the course mentor or Admin
   if (module.course.mentor.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
    res.status(403);
    throw new Error('User not authorized to delete this module');
  }

  // TODO: Consider deleting associated ContentItems when deleting a module.
  // await ContentItem.deleteMany({ module: module._id });

  await module.deleteOne();
  res.json({ message: 'Module removed' });
});

export {
  createModule,
  getModulesForCourse,
  getModuleById,
  updateModule,
  deleteModule,
};