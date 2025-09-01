const express = require('express');
const cors = require('cors');

const skillRoutes = require('./routes/skillRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const healthRoutes = require('./routes/healthRoutes');

const notFound = require('./middleware/notFound');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/skills', skillRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/health', healthRoutes);

// 404 + Error handler
app.use(notFound);
app.use(errorHandler);

module.exports = app;
