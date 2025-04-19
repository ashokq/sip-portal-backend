// models/Module.js
import mongoose from 'mongoose';

const moduleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Module title is required'],
      trim: true,
    },
    course: { // Link to the parent course
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Course',
    },
    order: { // To maintain module sequence within a course
      type: Number,
      required: true,
    },
    // ContentItems will be linked via a separate model referencing this Module ID
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying by course
moduleSchema.index({ course: 1, order: 1 });

const Module = mongoose.model('Module', moduleSchema);

export default Module;