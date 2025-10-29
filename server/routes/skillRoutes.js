const express = require('express');
const upload = require('../config/multerConfig');
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

// list + filters + pagination
router.get('/', getSkills);

// create skill
router.post('/', upload.single('certificate'), createSkill);

// draft
router.post('/draft', saveDraft);

// ratings
router.post('/:id/rate', addRating);
router.get('/:id/ratings', getRatings);

// publish
router.patch('/:id/publish', publishSkill);

// CRUD by id
router.get('/:id', getSkillById);
router.put('/:id', updateSkill);
router.delete('/:id', deleteSkill);
router.get('/:id/edit', getSkillForEdit);
router.get('/skills/:id/my-rating', getUserRating);

module.exports = router;
