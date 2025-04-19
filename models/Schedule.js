// models/Schedule.js
import mongoose from 'mongoose';

const scheduleSchema = new mongoose.Schema(
  {
    mentee: { // The user requesting the meeting (Mentee)
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    mentor: { // The user the meeting is requested with (Mentor)
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    requestedTime: { // Time proposed by the Mentee
      type: Date,
      required: [true, 'Please suggest a time for the meeting'],
    },
    durationMinutes: { // Suggested duration
        type: Number,
        required: [true, 'Please suggest a duration'],
        default: 30, // Default to 30 minutes
    },
    message: { // Optional message from Mentee
        type: String,
        trim: true,
        maxlength: [500, 'Message cannot exceed 500 characters'],
    },
    status: {
      type: String,
      required: true,
      enum: ['Pending', 'Confirmed', 'Rejected', 'Completed', 'Cancelled'],
      default: 'Pending',
    },
    mentorNotes: { // Optional notes from Mentor (e.g., reason for rejection, meeting link)
        type: String,
        trim: true,
    },
    confirmedTime: { // Actual time if confirmed (could differ from requested)
        type: Date,
        required: function() { return this.status === 'Confirmed'; } // Required only if confirmed
    },
    // Add meeting link (e.g., Zoom, Google Meet) if applicable, potentially added upon confirmation
    // meetingLink: { type: String, trim: true }
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Indexing for efficient querying by user and status
scheduleSchema.index({ mentee: 1, status: 1 });
scheduleSchema.index({ mentor: 1, status: 1 });
scheduleSchema.index({ requestedTime: 1 });
scheduleSchema.index({ confirmedTime: 1 });


const Schedule = mongoose.model('Schedule', scheduleSchema);

export default Schedule;