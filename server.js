import scheduleRoutes from './routes/scheduleRoutes.js'; // Adjust path
import announcementRoutes from './routes/announcementRoutes.js'; // Adjust path
import { createServer } from 'http'; // Use Node's http module
import { Server } from 'socket.io';

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db.js');

const authRoutes = require('./routes/authRoutes.js');
const userRoutes = require('./routes/userRoutes.js');
const courseRoutes = require('./routes/courseRoutes.js');
const moduleRoutes = require('./routes/moduleRoutes.js');
const contentItemRoutes = require('./routes/contentItemRoutes.js');

dotenv.config(); // Load environment variables
connectDB(); // Connect to the database

const app = express();

// --- Middleware ---
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: false })); // Parse URL-encoded bodies

// --- API Status Check ---
app.get('/api/v1', (req, res) => {
  res.json({ status: 'API Running', version: '1.0' });
});

// --- Mount Routes ---
// Auth and user management
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);

// Course management and related nested resources
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/modules', moduleRoutes);
app.use('/api/v1/content-items', contentItemRoutes);
app.use('/api/v1/schedules', scheduleRoutes);
app.use('/api/v1/announcements', announcementRoutes);
// --- Global Error Handler ---
// Must be placed after all route definitions
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    message: err.message || 'Internal Server Error',
    // Optionally include stack trace in development:
    // stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});
const httpServer = createServer(app); // Create HTTP server from Express app

// Configure Socket.IO Server
const io = new Server(httpServer, {
  cors: {
    // origin: "http://localhost:3000", // Frontend URL for development
    origin: "*", // Adjust CORS for production!
    methods: ["GET", "POST"]
  }
});

// Socket.IO connection logic
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  // Join a general room for announcements (example)
  socket.join('announcements');

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// --- Start Server ---
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`)); // Use httpServer.listen
