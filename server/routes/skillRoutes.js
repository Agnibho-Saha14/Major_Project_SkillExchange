const express = require('express');
const { upload, validateFileSize, handleMulterError } = require('../config/multerConfig');
const {
  getSkills,
  getSkillById,
  createSkill,
  updateSkill,
  deleteSkill,
  saveDraft,
  publishSkill,
  addRating,
  getRatings,
  getMySkills,
  getSkillForEdit,
  getUserRating,
} = require('../controllers/skillController');

const router = express.Router();

// List + filters + pagination
router.get('/', getSkills);

// Get user's own skills
router.get('/my-skills', getMySkills);

// Create skill with certificate and optional intro video
router.post('/', upload.fields([
  { name: 'certificate', maxCount: 1 },
  { name: 'introVideo', maxCount: 1 }
]), createSkill);

// Save draft with certificate and optional intro video
router.post('/draft', upload.fields([
  { name: 'certificate', maxCount: 1 },
  { name: 'introVideo', maxCount: 1 }
]), saveDraft);

// Ratings
router.post('/:id/rate', addRating);
router.get('/:id/ratings', getRatings);
router.get('/:id/my-rating', getUserRating);

// Publish
router.patch('/:id/publish', publishSkill);

// Get skill for editing (must be before /:id to avoid route conflicts)
router.get('/:id/edit', getSkillForEdit);

// CRUD by id
router.get('/:id', getSkillById);
router.put('/:id', updateSkill);
router.delete('/:id', deleteSkill);

module.exports = router;