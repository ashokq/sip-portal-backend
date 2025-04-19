// models/Announcement.js
import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Announcement title is required'],
      trim: true,
      maxlength: [200, 'Title cannot be more than 200 characters'],
    },
    content: {
      type: String,
      required: [true, 'Announcement content is required'],
    },
    author: { // Admin user who created it
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    targetRoles: { // Who should see this announcement
        type: [{
            type: String,
            enum: ['Admin', 'Mentor', 'Mentee', 'All'], // Allow targeting specific roles or all
        }],
        required: true,
        default: ['All'], // Default to show for everyone
    },
    // Optional: Add expiry date if announcements should disappear automatically
    // expiresAt: { type: Date }
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Indexing for efficient querying, especially by creation date
announcementSchema.index({ createdAt: -1 });
announcementSchema.index({ targetRoles: 1 });

const Announcement = mongoose.model('Announcement', announcementSchema);

export default Announcement;