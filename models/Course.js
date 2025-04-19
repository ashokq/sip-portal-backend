// models/Course.js
import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
      maxlength: [150, 'Title cannot be more than 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Course description is required'],
      trim: true,
    },
    mentor: { // The user who created/owns the course
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User', // Reference to the User model
    },
    status: { // Status of the course
        type: String,
        enum: ['Draft', 'Published', 'Archived'],
        default: 'Draft',
    },
    // Consider adding fields like: category, prerequisites, estimatedDuration, etc.
    // Modules will be linked via a separate model referencing this Course ID
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Optional: Indexing fields commonly used for querying
courseSchema.index({ mentor: 1 });
courseSchema.index({ status: 1 });

const Course = mongoose.model('Course', courseSchema);

export default Course;