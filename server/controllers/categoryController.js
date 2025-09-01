const Skill = require('../models/Skill');
const asyncHandler = require('../utils/asyncHandler');

exports.getCategories = asyncHandler(async (req, res) => {
  const cats = await Skill.distinct('category', { status: 'published' });
  res.json({ success: true, data: cats });
});
