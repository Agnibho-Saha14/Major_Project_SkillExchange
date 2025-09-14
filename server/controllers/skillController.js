const Skill = require('../models/Skill');
const asyncHandler = require('../utils/asyncHandler');

// GET all skills with optional filters and sorting
exports.getSkills = asyncHandler(async (req, res) => {
  // We are forcing the sort to be by averageRating and the limit to be 5.
  const filter = { status: 'published' };
  const sortOptions = { averageRating: -1 };
  const limit = 5;

  const [items, total] = await Promise.all([
    Skill.find(filter).sort(sortOptions).limit(limit).skip(0),
    Skill.countDocuments(filter)
  ]);

  res.json({
    success: true,
    data: items,
    pagination: {
      page: 1,
      limit: limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// GET a single skill by its ID
exports.getSkillById = asyncHandler(async (req, res) => {
  const item = await Skill.findById(req.params.id);
  if (!item) {
    res.status(404);
    throw new Error('Skill not found');
  }
  res.json({ success: true, data: item });
});

// POST a new skill
exports.createSkill = asyncHandler(async (req, res) => {
  const body = req.body;
  const required = ['title', 'instructor', 'category', 'level', 'duration', 'timePerWeek', 'paymentOptions', 'description'];
  const missing = required.filter((f) => !body[f]);

  if (missing.length) {
    res.status(400);
    return res.json({
      success: false,
      message: `Missing required fields: ${missing.join(', ')}`
    });
  }

  const item = await Skill.create(body);
  res.status(201).json({ success: true, message: 'Skill created successfully', data: item });
});

// PUT update an existing skill
exports.updateSkill = asyncHandler(async (req, res) => {
  const item = await Skill.findByIdAndUpdate(
    req.params.id,
    { ...req.body },
    { new: true, runValidators: true }
  );
  if (!item) {
    res.status(404);
    throw new Error('Skill not found');
  }
  res.json({ success: true, message: 'Skill updated successfully', data: item });
});

// DELETE a skill
exports.deleteSkill = asyncHandler(async (req, res) => {
  const item = await Skill.findByIdAndDelete(req.params.id);
  if (!item) {
    res.status(404);
    throw new Error('Skill not found');
  }
  res.json({ success: true, message: 'Skill deleted successfully' });
});

// Save a skill as a draft
exports.saveDraft = asyncHandler(async (req, res) => {
  const item = await Skill.create({ ...req.body, status: 'draft' });
  res.status(201).json({ success: true, message: 'Skill saved as draft successfully', data: item });
});

// Publish a skill
exports.publishSkill = asyncHandler(async (req, res) => {
  const item = await Skill.findByIdAndUpdate(
    req.params.id,
    { status: 'published' },
    { new: true }
  );
  if (!item) {
    res.status(404);
    throw new Error('Skill not found');
  }
  res.json({ success: true, message: 'Skill published successfully', data: item });
});

// Add a new rating to a skill
exports.addRating = asyncHandler(async (req, res) => {
  const { rating, comment = '' } = req.body;
  const rNum = parseInt(rating, 10);

  if (!rNum || rNum < 1 || rNum > 5) {
    res.status(400);
    return res.json({ success: false, message: 'Rating must be between 1 and 5' });
  }

  const item = await Skill.findById(req.params.id);
  if (!item) {
    res.status(404);
    throw new Error('Skill not found');
  }

  item.ratings.push({
    rating: rNum,
    comment: (comment || '').trim(),
    userId: 'anonymous',
    createdAt: new Date()
  });

  item.calculateAverageRating();
  await item.save();

  res.json({
    success: true,
    message: 'Rating added successfully',
    data: {
      _id: item._id,
      averageRating: item.averageRating,
      totalRatings: item.totalRatings,
      ratings: item.ratings.sort((a, b) => b.createdAt - a.createdAt)
    }
  });
});

// Get ratings for a skill
exports.getRatings = asyncHandler(async (req, res) => {
  const item = await Skill.findById(req.params.id).select('ratings averageRating totalRatings');
  if (!item) {
    res.status(404);
    throw new Error('Skill not found');
  }
  res.json({
    success: true,
    data: {
      ratings: item.ratings.sort((a, b) => b.createdAt - a.createdAt),
      averageRating: item.averageRating,
      totalRatings: item.totalRatings
    }
  });
});