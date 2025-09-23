const express = require('express');
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
} = require('../controllers/skillController');

const router = express.Router();

// list + filters + pagination
router.get('/', getSkills);

// create skill
router.post('/', createSkill);

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
router.get('/:id/edit', getSkillForEdit)

module.exports = router;
