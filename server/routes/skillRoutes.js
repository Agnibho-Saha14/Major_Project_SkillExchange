const express = require('express');
const { upload, validateFileSize, handleMulterError } = require('../config/multerConfig');
const Skill = require('../models/Skill');
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
router.get('/chatbot-context', async (req, res) => {
  try {
    const skills = await Skill.find({ status: "published" });

    const formatted = skills.map(skill => ({
      title: skill.title,
      description: skill.description,
      category: skill.category,
      level: skill.level,
      instructor: skill.instructor,
      duration: skill.duration,
      timePerWeek: skill.timePerWeek,
      paymentOptions: skill.paymentOptions,
      exchangeFor: skill.exchangeFor || null,
      averageRating: skill.averageRating || 0,
      totalRatings: skill.totalRatings || 0,
      tags: skill.tags || []
    }));

    res.json(formatted);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load chatbot data" });
  }
});
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

router.get('/:id/edit', getSkillForEdit);

// CRUD by id
router.get('/:id', getSkillById);
router.put('/:id', updateSkill);
router.delete('/:id', deleteSkill);

module.exports = router;