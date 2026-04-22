const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorMiddleware');

// Route files
const roomRoutes = require('./routes/roomRoutes');
const userRoutes = require('./routes/userRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const experienceRoutes = require('./routes/experienceRoutes');
const reviewRoutes = require('./routes/reviewRoutes');

// Load env vars
dotenv.config();

// Connect to database
if (process.env.SMOKE_TEST === '1') {
  console.log('SMOKE_TEST=1 detected: skipping MongoDB connection');
} else {
  connectDB(); // Ensure you have MONGO_URI in your .env before calling this!
}

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Body parser
app.use('/uploads', express.static('uploads')); // For Multer uploaded files

// Mount routers
app.use('/api/rooms', roomRoutes);
app.use('/api/users', userRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/experiences', experienceRoutes);
app.use('/api/reviews', reviewRoutes);

// Default route
app.get('/', (req, res) => {
    res.send('Hotel Management API is running...');
});

// Global Error Handling Middleware (must be after routes)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  const hint = process.env.PUBLIC_API_URL || `http://localhost:${PORT}`;
  console.log(`API listening on http://0.0.0.0:${PORT} (reachable on LAN)`);
  console.log(`Set EXPO_PUBLIC_API_BASE_URL on the app to your PC LAN IP, e.g. ${hint}`);
});
