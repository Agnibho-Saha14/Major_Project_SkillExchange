// server/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { 
  onboardUser, 
  getAllUserIdsForML, 
  getUserSkillsForML,
  saveMLRecommendations // <--- Import the new function
} = require('../controllers/userController');

// Legacy/Fallback route for frontend 
router.post('/onboard', onboardUser);

// ==========================================
// 🧠 ML ENGINEER ENDPOINTS
// ==========================================
router.get('/all-ids', getAllUserIdsForML);
router.get('/:userId/skills', getUserSkillsForML);

// NEW: Endpoint for Python to push recommendations back to Node
router.post('/:userId/recommendations', saveMLRecommendations);

module.exports = router;