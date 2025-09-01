const Skill = require('../models/Skill');
const asyncHandler = require('../utils/asyncHandler');

// GET 
exports.getSkills = asyncHandler(async (req, res) => {
  const { category, level, paymentOptions, page = 1, limit = 10 } = req.query;

  const filter = { status: 'published' };
  if (category) filter.category = new RegExp(category, 'i');
  if (level) filter.level = level;
  if (paymentOptions) filter.paymentOptions = paymentOptions;

  const l = parseInt(limit);
  const p = parseInt(page);

  const [items, total] = await Promise.all([
    Skill.find(filter).sort({ createdAt: -1 }).limit(l).skip((p - 1) * l),
    Skill.countDocuments(filter)
  ]);

  res.json({
    success: true,
    data: items,
    pagination: {
      page: p,
      limit: l,
      total,
      pages: Math.ceil(total / l)
    }
  });
});

// GET 
exports.getSkillById = asyncHandler(async (req, res) => {
  const item = await Skill.findById(req.params.id);
  if (!item) {
    res.status(404);
    throw new Error('Skill not found');
  }
  res.json({ success: true, data: item });
});

// POST 
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

// PUT 
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

// DELETE 
exports.deleteSkill = asyncHandler(async (req, res) => {
  const item = await Skill.findByIdAndDelete(req.params.id);
  if (!item) {
    res.status(404);
    throw new Error('Skill not found');
  }
  res.json({ success: true, message: 'Skill deleted successfully' });
});

// draft
exports.saveDraft = asyncHandler(async (req, res) => {
  const item = await Skill.create({ ...req.body, status: 'draft' });
  res.status(201).json({ success: true, message: 'Skill saved as draft successfully', data: item });
});

// publish
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

//rating
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
