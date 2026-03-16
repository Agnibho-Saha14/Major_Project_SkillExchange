// server/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { onboardUser } = require('../controllers/userController');

// This matches the frontend fetch call to /api/users/onboard
router.post('/onboard', onboardUser);

module.exports = router;