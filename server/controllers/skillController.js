const Skill = require('../models/Skill');
const asyncHandler = require('../utils/asyncHandler');
const { getAuth } = require('@clerk/express');
const { clerkClient } = require('@clerk/clerk-sdk-node');

async function getUserEmail(userId) {
  if (!userId) return null;
  const user = await clerkClient.users.getUser(userId);
  const emails = user?.emailAddresses || [];
  if (emails.length === 0) return null;
  const primary = emails.find((e) => e.id === user.primaryEmailAddressId);
  return primary?.emailAddress || emails[0]?.emailAddress || null;
}

// GET published skills
exports.getSkills = asyncHandler(async (req, res) => {
  const { category, level, paymentOptions, page = 1, limit = 10, sort = 'recent' } = req.query;

  const filter = { status: 'published' };
  if (category && category !== 'all') filter.category = new RegExp(category, 'i');
  if (level && level !== 'all') filter.level = level;
  if (paymentOptions && paymentOptions !== 'all') filter.paymentOptions = paymentOptions;

  const l = parseInt(limit);
  const p = parseInt(page);

  let sortOptions = { createdAt: -1 };
  if (sort === 'rating') {
    sortOptions = { averageRating: -1, totalRatings: -1 };
  }

  const [items, total] = await Promise.all([
    Skill.find(filter).sort(sortOptions).limit(l).skip((p - 1) * l),
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

// GET single skill
exports.getSkillById = asyncHandler(async (req, res) => {
  const item = await Skill.findById(req.params.id);
  if (!item) {
    res.status(404);
    throw new Error('Skill not found');
  }
  res.json({ success: true, data: item });
});

// CREATE skill
exports.createSkill = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const email = await getUserEmail(userId);
  const body = req.body;

  const required = ['title', 'instructor', 'category', 'level', 'duration', 'timePerWeek', 'paymentOptions', 'description'];
  const missing = required.filter((f) => !body[f]);

  if (missing.length) {
    return res.status(400).json({
      success: false,
      message: `Missing required fields: ${missing.join(', ')}`
    });
  }

  const item = await Skill.create({
    ...body,
    ownerId: String(userId),
    email: email || '',
    status: body.status || 'draft'
  });

  res.status(201).json({ success: true, message: 'Skill created successfully', data: item });
});

// UPDATE skill
exports.updateSkill = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const skill = await Skill.findById(req.params.id);

  if (!skill) {
    res.status(404);
    throw new Error('Skill not found');
  }

  if (String(skill.ownerId) !== String(userId)) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  const updated = await Skill.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.json({ success: true, message: 'Skill updated successfully', data: updated });
});

// DELETE skill
exports.deleteSkill = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const skill = await Skill.findById(req.params.id);

  if (!skill) {
    res.status(404);
    throw new Error('Skill not found');
  }

  if (String(skill.ownerId) !== String(userId)) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  await skill.deleteOne();
  res.json({ success: true, message: 'Skill deleted successfully' });
});

// SAVE draft
exports.saveDraft = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const email = await getUserEmail(userId);
  const item = await Skill.create({
    ...req.body,
    ownerId: String(userId),
    email: email || '',
    status: 'draft'
  });

  res.status(201).json({ success: true, message: 'Skill saved as draft successfully', data: item });
});

// PUBLISH skill
exports.publishSkill = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const skill = await Skill.findById(req.params.id);

  if (!skill) {
    res.status(404);
    throw new Error('Skill not found');
  }

  if (String(skill.ownerId) !== String(userId)) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  skill.status = 'published';
  await skill.save();

  res.json({ success: true, message: 'Skill published successfully', data: skill });
});

// ADD rating
exports.addRating = asyncHandler(async (req, res) => {
  const { rating, comment = '' } = req.body;
  const rNum = parseInt(rating, 10);

  if (!rNum || rNum < 1 || rNum > 5) {
    return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
  }

  const item = await Skill.findById(req.params.id);
  if (!item) {
    res.status(404);
    throw new Error('Skill not found');
  }

  const { userId } = getAuth(req);

  item.ratings.push({
    rating: rNum,
    comment: comment.trim(),
    userId: userId || 'anonymous',
    createdAt: new Date()
  });

  item.calculateAverageRating();
  await item.save();

  res.json({
    success: true,
    data: {
      _id: item._id,
      averageRating: item.averageRating,
      totalRatings: item.totalRatings,
      ratings: item.ratings.sort((a, b) => b.createdAt - a.createdAt)
    }
  });
});

// GET ratings
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
