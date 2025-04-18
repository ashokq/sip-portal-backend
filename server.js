const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors')
const connectDB =  require('./config/db.js'); // Adjust path as needed
const authRoutes = require('./routes/authRoutes.js'); // Adjust path as needed
const userRoutes = require('./routes/userRoutes.js'); // Adjust path as needed
// Import other routes (courses, schedules, etc.) when created

dotenv.config(); // Load .env file variables

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(cors()); // Enable CORS - configure origins properly for production
app.use(express.json()); // Body parser for JSON requests
app.use(express.urlencoded({ extended: false })); // Body parser for URL-encoded data

// --- API Routes ---
app.get('/api/v1', (req, res) => { // Simple API status check
    res.json({ status: 'API Running', version: '1.0' });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes); // Mount admin user routes
// Mount other routes here:
// app.use('/api/v1/courses', courseRoutes);
// app.use('/api/v1/schedules', scheduleRoutes);
// app.use('/api/v1/announcements', announcementRoutes);


// --- Global Error Handler (Basic Example) ---
// Place after all routes
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    message: err.message || 'Internal Server Error',
    // Optionally include stack trace in development
    // stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});


// --- Start Server ---
const PORT = process.env.PORT || 5000; // Use 5000 as fallback

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));