// controllers/courseController.js
import Course from '../models/Course.js'; // Adjust path as needed
import asyncHandler from 'express-async-handler'; // Simple middleware for handling exceptions inside of async express routes

// @desc    Create a new course
// @route   POST /api/v1/courses
// @access  Private (Mentor)
const createCourse = asyncHandler(async (req, res) => {
  const { title, description, status } = req.body;

  // Basic validation
  if (!title || !description) {
    res.status(400);
    throw new Error('Please provide title and description');
  }

  const course = new Course({
    title,
    description,
    status: status || 'Draft', // Default to Draft if not provided
    mentor: req.user._id, // Get mentor ID from logged-in user (attached by 'protect' middleware)
  });

  const createdCourse = await course.save();
  res.status(201).json(createdCourse);
});

// @desc    Get all courses (e.g., for Admin or Browse) - Add filtering/pagination later
// @route   GET /api/v1/courses
// @access  Private (Admin, Mentor, Mentee - adjust roles as needed)
const getCourses = asyncHandler(async (req, res) => {
  // Example: Allow filtering by mentor or status if needed
  const filter = {};
  if (req.query.mentorId) {
      filter.mentor = req.query.mentorId;
  }
  // Example: Mentees might only see 'Published' courses
  if (req.user.role === 'Mentee') {
      filter.status = 'Published';
  }
  // Example: Mentors see their own courses primarily
  if (req.user.role === 'Mentor') {
      // Allow mentors to see their own drafts/archived too
      // Add logic here if needed, e.g., filter.mentor = req.user._id
  }


  const courses = await Course.find(filter).populate('mentor', 'firstName lastName email'); // Populate mentor details
  res.json(courses);
});

// @desc    Get single course by ID
// @route   GET /api/v1/courses/:id
// @access  Private (Admin, Mentor, Mentee - check enrollment/ownership)
const getCourseById = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id).populate('mentor', 'firstName lastName');

  if (course) {
    // Add authorization logic here:
    // - Is the user the mentor of this course?
    // - Is the user an Admin?
    // - Is the user a Mentee enrolled in this course? (Requires Enrollment model check)
    // For now, basic access if logged in:
    res.json(course);
  } else {
    res.status(404);
    throw new Error('Course not found');
  }
});

// @desc    Update a course
// @route   PUT /api/v1/courses/:id
// @access  Private (Mentor who owns the course, or Admin)
const updateCourse = asyncHandler(async (req, res) => {
  const { title, description, status } = req.body;
  const course = await Course.findById(req.params.id);

  if (course) {
    // Authorization Check: Ensure logged-in user is the course mentor or an Admin
    if (course.mentor.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
        res.status(403); // Forbidden
        throw new Error('User not authorized to update this course');
    }

    course.title = title || course.title;
    course.description = description || course.description;
    course.status = status || course.status;

    const updatedCourse = await course.save();
    res.json(updatedCourse);
  } else {
    res.status(404);
    throw new Error('Course not found');
  }
});

// @desc    Delete a course
// @route   DELETE /api/v1/courses/:id
// @access  Private (Mentor who owns the course, or Admin)
const deleteCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);

  if (course) {
     // Authorization Check: Ensure logged-in user is the course mentor or an Admin
     if (course.mentor.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
        res.status(403); // Forbidden
        throw new Error('User not authorized to delete this course');
    }

    // TODO: Consider what happens to associated Modules, ContentItems, Enrollments when deleting a course.
    // Need cascading delete logic or archiving strategy. For now, just delete the course document.
    await course.deleteOne(); // Mongoose 6+
    // await course.remove(); // Older Mongoose versions

    res.json({ message: 'Course removed' });
  } else {
    res.status(404);
    throw new Error('Course not found');
  }
});


export {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
};