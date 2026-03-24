const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorMiddleware');

// Route files
const roomRoutes = require('./routes/roomRoutes');
const userRoutes = require('./routes/userRoutes');

// Load env vars
dotenv.config();

// Connect to database
connectDB(); // Ensure you have MONGO_URI in your .env before calling this!

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Body parser
app.use('/uploads', express.static('uploads')); // For Multer uploaded files

// Mount routers
app.use('/api/rooms', roomRoutes);
app.use('/api/users', userRoutes); // Authentication
// Further endpoints for the team:
// app.use('/api/bookings', require('./routes/bookingRoutes'));
// app.use('/api/staff', require('./routes/staffRoutes'));
// app.use('/api/payments', require('./routes/paymentRoutes'));
// app.use('/api/complaints', require('./routes/complaintRoutes'));
// app.use('/api/visitors', require('./routes/visitorRoutes'));

// Default route
app.get('/', (req, res) => {
    res.send('Hotel Management API is running...');
});

// Global Error Handling Middleware (must be after routes)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://192.168.8.131:${PORT}`);
});
