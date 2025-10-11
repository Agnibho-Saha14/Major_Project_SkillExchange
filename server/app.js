// app.js
const express = require('express');
const cors = require('cors');
const { clerkMiddleware } = require('@clerk/express');

const skillRoutes = require('./routes/skillRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const healthRoutes = require('./routes/healthRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const enrollmentRoutes = require('./routes/enrollmentRoutes'); 
const exchangeRoutes = require('./routes/exchangeRoutes'); // <<-- ADDED

const notFound = require('./middleware/notFound');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

// Add Clerk middleware
app.use(clerkMiddleware());

app.use('/api/skills', skillRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/enrollments', enrollmentRoutes); 
app.use('/api/exchange', exchangeRoutes); // <<-- ADDED

app.use(notFound);
app.use(errorHandler);

module.exports = app;