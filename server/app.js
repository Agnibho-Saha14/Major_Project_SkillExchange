const express = require('express');
const path = require('path');
const cors = require('cors');
const { clerkMiddleware } = require('@clerk/express'); // 👈 import Clerk middleware
const skillRoutes = require('./routes/skillRoutes');
const enrollmentRoutes = require('./routes/enrollmentRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const healthRoutes = require('./routes/healthRoutes');
const exchangeRoutes = require('./routes/exchangeRoutes');

const app = express();

// ⭐ Apply Clerk middleware FIRST
// 👈 must be before routes using getAuth()


// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(clerkMiddleware()); 

app.use('/api/skills', skillRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api', paymentRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/exchange', exchangeRoutes);

// ⭐ Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Optional: log static file requests for debugging
app.use('/uploads', (req, res, next) => {
  console.log('Static file request:', req.path);
  next();
});

// Import routes

// ... other routes

// Use routes (after clerkMiddleware)

// ... other routes

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Static files served from: ${path.join(__dirname, 'uploads')}`);
});

module.exports = app;
