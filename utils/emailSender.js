// utils/emailSender.js
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT || 587, // Common port for TLS
  secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER, // Your email service username
    pass: process.env.EMAIL_PASS, // Your email service password or app-specific password
  },
  // Optional: If using services like Gmail, you might need less configuration or specific settings
  // service: 'gmail',
});

// --- Function to send meeting request notification to Mentor ---
export const sendMeetingRequestEmail = async (mentor, mentee, schedule) => {
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'SIP Portal'}" <${process.env.EMAIL_FROM_ADDRESS}>`,
    to: mentor.email,
    subject: `New Meeting Request from ${mentee.firstName} ${mentee.lastName}`,
    text: `Hello ${mentor.firstName},\n\n` +
          `${mentee.firstName} ${mentee.lastName} has requested a meeting with you.\n\n` +
          `Requested Time: ${new Date(schedule.requestedTime).toLocaleString()}\n` +
          `Duration: ${schedule.durationMinutes} minutes\n` +
          `Message: ${schedule.message || 'N/A'}\n\n` +
          `Please log in to the portal to respond.\n\n` +
          `Thank you,\nSIP Portal Team`,
    // html: `<p>Hello ${mentor.firstName},</p><p>...</p>` // Optional HTML version
  };

  try {
    let info = await transporter.sendMail(mailOptions);
    console.log('Meeting request email sent: %s', info.messageId);
    // Handle success (optional logging)
  } catch (error) {
    console.error('Error sending meeting request email:', error);
    throw error; // Re-throw to be caught by the controller if needed
  }
};


// --- Function to send status update notification to Mentee ---
export const sendMeetingStatusUpdateEmail = async (mentee, mentor, schedule) => {
    const statusText = schedule.status.toUpperCase();
    let timeInfo = '';
    if (schedule.status === 'Confirmed' && schedule.confirmedTime) {
        timeInfo = `\nConfirmed Time: ${new Date(schedule.confirmedTime).toLocaleString()}`;
    }

   const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'SIP Portal'}" <${process.env.EMAIL_FROM_ADDRESS}>`,
    to: mentee.email,
    subject: `Meeting Request Update: Status Changed to ${statusText}`,
    text: `Hello ${mentee.firstName},\n\n` +
          `Your meeting request with ${mentor.firstName} ${mentor.lastName} has been updated.\n\n` +
          `New Status: ${statusText}\n` +
          `${timeInfo}\n` + // Include confirmed time if applicable
          `Mentor Notes: ${schedule.mentorNotes || 'N/A'}\n\n` +
          `You can view details in the portal.\n\n` +
          `Thank you,\nSIP Portal Team`,
    // html: `<p>Hello ${mentee.firstName},</p><p>...</p>` // Optional HTML version
  };

   try {
    let info = await transporter.sendMail(mailOptions);
    console.log('Meeting status update email sent: %s', info.messageId);
  } catch (error) {
    console.error('Error sending meeting status update email:', error);
    throw error;
  }
};

// Add more email functions as needed (e.g., cancellation notifications, reminders)