// server/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { 
  onboardUser, 
  getAllUserIdsForML, 
  getUserSkillsForML 
} = require('../controllers/userController');

// Legacy/Fallback route for frontend (if you ever need to push via backend)
router.post('/onboard', onboardUser);

// ==========================================
// 🧠 ML ENGINEER ENDPOINTS
// ==========================================

// Endpoint 1: Get an array of EVERY user ID in the system (for batch scripts)
router.get('/all-ids', getAllUserIdsForML);

// Endpoint 2: Get the specific skills for ONE user ID
router.get('/:userId/skills', getUserSkillsForML);

module.exports = router;