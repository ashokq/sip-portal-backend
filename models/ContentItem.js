// models/ContentItem.js
import mongoose from 'mongoose';

const contentItemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Content title is required'],
      trim: true,
    },
    module: { // Link to the parent module
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Module',
    },
    itemType: {
      type: String,
      required: true,
      enum: ['Lecture', 'Video', 'Resource', 'Task'], // Define possible content types
    },
    order: { // To maintain content sequence within a module
      type: Number,
      required: true,
    },
    // --- Type-Specific Fields ---
    lectureContent: { // For 'Lecture' type
      type: String, // Rich text content (HTML)
      required: function() { return this.itemType === 'Lecture'; }
    },
    videoUrl: { // For 'Video' type
      type: String, // URL to YouTube/Vimeo etc.
      trim: true,
      required: function() { return this.itemType === 'Video'; }
    },
    resourceUrl: { // For 'Resource' type (e.g., PDF, DOC link)
      type: String, // URL to the stored file (e.g., S3 link)
      trim: true,
      required: function() { return this.itemType === 'Resource'; }
    },
    // originalFileName: { // Useful for 'Resource' type
    //   type: String,
    //   required: function() { return this.itemType === 'Resource'; }
    // },
    taskDescription: { // For 'Task' type
      type: String,
      required: function() { return this.itemType === 'Task'; }
    },
    // --- End Type-Specific Fields ---

    // Add other fields like: estimatedDuration, isCompleted (per user - likely in separate tracking model)
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying by module
contentItemSchema.index({ module: 1, order: 1 });
contentItemSchema.index({ itemType: 1 });

const ContentItem = mongoose.model('ContentItem', contentItemSchema);

export default ContentItem;