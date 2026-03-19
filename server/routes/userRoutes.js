const express = require('express');
const router = express.Router();
const { 
  onboardUser, 
  getAllUserIdsForML, 
  getUserSkillsForML,
  saveMLRecommendations
} = require('../controllers/userController');

router.post('/onboard', onboardUser);


router.get('/all-ids', getAllUserIdsForML);
router.get('/:userId/skills', getUserSkillsForML);

router.post('/:userId/recommendations', saveMLRecommendations);

module.exports = router;