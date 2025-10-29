const Skill = require('../models/Skill');
const asyncHandler = require('../utils/asyncHandler');
const { getAuth } = require('@clerk/express');
const { clerkClient } = require('@clerk/clerk-sdk-node');
const { verifyCertificateCredential } = require('../utils/ocrVerification');
const path = require('path');

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

// GET user's own skills (for dashboard)
exports.getMySkills = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const { status = 'all', page = 1, limit = 10 } = req.query;
  const filter = { ownerId: String(userId) };
  
  if (status !== 'all') {
    filter.status = status;
  }

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

// GET single skill
exports.getSkillById = asyncHandler(async (req, res) => {
  const item = await Skill.findById(req.params.id);
  if (!item) {
    res.status(404);
    throw new Error('Skill not found');
  }
  res.json({ success: true, data: item });
});

// GET skill for editing (only owner can access)
exports.getSkillForEdit = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const skill = await Skill.findById(req.params.id);
  if (!skill) {
    res.status(404);
    throw new Error('Skill not found');
  }

  if (String(skill.ownerId) !== String(userId)) {
    return res.status(403).json({ success: false, message: 'You can only edit your own skills' });
  }

  res.json({ success: true, data: skill });
});

// CREATE skill with OCR verification
exports.createSkill = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const email = await getUserEmail(userId);

  // Handle form-data input
  let body;
  try {
    body = req.body.skillData ? JSON.parse(req.body.skillData) : req.body;
  } catch (err) {
    return res.status(400).json({ success: false, message: 'Invalid skillData format' });
  }

  // Validate required fields
  const required = [
    'title',
    'instructor',
    'category',
    'level',
    'duration',
    'timePerWeek',
    'paymentOptions',
    'description',
    'credentialId'
  ];

  const missing = required.filter((f) => !body[f]);
  if (missing.length) {
    return res.status(400).json({
      success: false,
      message: `Missing required fields: ${missing.join(', ')}`,
    });
  }

  // Check if certificate file is uploaded
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Certificate file is required'
    });
  }

  // Only verify for images (skip PDF for now as OCR on PDF needs different handling)
  const isImage = req.file.mimetype.startsWith('image/');
  
  if (isImage) {
    console.log('Starting credential verification...');
    
    // Perform OCR verification
    const certificatePath = path.join(__dirname, '..', req.file.path);
    const verificationResult = await verifyCertificateCredential(
      certificatePath,
      body.credentialId
    );

    console.log('Verification result:', verificationResult);

    // If verification fails, delete the uploaded file and return error
    if (!verificationResult.success) {
      const fs = require('fs').promises;
      await fs.unlink(certificatePath).catch(() => {});
      
      return res.status(400).json({
        success: false,
        message: verificationResult.message || 'Credential ID not found in certificate. Please ensure the Credential ID matches exactly with what appears on your certificate.',
        verificationFailed: true
      });
    }

    console.log('Credential verified successfully!');
  } else {
    console.log('PDF uploaded - skipping OCR verification (implement PDF OCR if needed)');
  }

  // Add certificate file info
  body.certificateUrl = `/uploads/certificates/${req.file.filename}`;

  // Create skill
  const item = await Skill.create({
    ...body,
    ownerId: String(userId),
    email: email || '',
    status: body.status || 'published',
  });

  res.status(201).json({
    success: true,
    message: 'Skill created successfully with verified credentials',
    data: item,
  });
});

// UPDATE skill (excluding price - price is fixed after creation)
exports.updateSkill = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const skill = await Skill.findById(req.params.id);

  if (!skill) {
    res.status(404);
    throw new Error('Skill not found');
  }

  if (String(skill.ownerId) !== String(userId)) {
    return res.status(403).json({ success: false, message: 'You can only edit your own skills' });
  }

  // Remove price from the update data to keep it fixed
  const updateData = { ...req.body };
  delete updateData.price;
  delete updateData.ownerId;
  delete updateData.email;

  const updated = await Skill.findByIdAndUpdate(req.params.id, updateData, {
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
    return res.status(403).json({ success: false, message: 'You can only delete your own skills' });
  }

  await skill.deleteOne();
  res.json({ success: true, message: 'Skill deleted successfully' });
});

// SAVE draft (with OCR verification)
exports.saveDraft = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const email = await getUserEmail(userId);

  // Handle form-data input
  let body;
  try {
    body = req.body.skillData ? JSON.parse(req.body.skillData) : req.body;
  } catch (err) {
    return res.status(400).json({ success: false, message: 'Invalid skillData format' });
  }

  // If certificate and credentialId provided, verify them
  if (req.file && body.credentialId) {
    const isImage = req.file.mimetype.startsWith('image/');
    
    if (isImage) {
      const certificatePath = path.join(__dirname, '..', req.file.path);
      const verificationResult = await verifyCertificateCredential(
        certificatePath,
        body.credentialId
      );

      if (!verificationResult.success) {
        const fs = require('fs').promises;
        await fs.unlink(certificatePath).catch(() => {});
        
        return res.status(400).json({
          success: false,
          message: verificationResult.message,
          verificationFailed: true
        });
      }
    }

    body.certificateUrl = `/uploads/certificates/${req.file.filename}`;
  }

  const item = await Skill.create({
    ...body,
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
    return res.status(403).json({ success: false, message: 'You can only publish your own skills' });
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

  const { userId } = getAuth(req);
  
  if (!userId) {
    return res.status(401).json({ success: false, message: 'You must be signed in to rate a skill' });
  }

  const item = await Skill.findById(req.params.id);
  if (!item) {
    res.status(404);
    throw new Error('Skill not found');
  }

  if (String(item.ownerId) === String(userId)) {
    return res.status(403).json({ 
      success: false, 
      message: 'You cannot rate your own skill' 
    });
  }

  const existingRating = item.ratings.find(r => String(r.userId) === String(userId));
  
  if (existingRating) {
    return res.status(400).json({ 
      success: false, 
      message: 'You have already rated this skill',
      alreadyRated: true
    });
  }

  item.ratings.push({
    rating: rNum,
    comment: comment.trim(),
    userId: String(userId),
    createdAt: new Date()
  });

  item.calculateAverageRating();
  await item.save();

  res.json({
    success: true,
    message: 'Rating submitted successfully',
    data: {
      _id: item._id,
      averageRating: item.averageRating,
      totalRatings: item.totalRatings,
      ratings: item.ratings.sort((a, b) => b.createdAt - a.createdAt)
    }
  });
});

// GET user's rating for a specific skill
exports.getUserRating = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  
  if (!userId) {
    return res.json({ 
      success: true, 
      data: { hasRated: false, rating: null } 
    });
  }

  const item = await Skill.findById(req.params.id).select('ratings ownerId');
  if (!item) {
    res.status(404);
    throw new Error('Skill not found');
  }

  const isOwner = String(item.ownerId) === String(userId);
  const userRating = item.ratings.find(r => String(r.userId) === String(userId));

  res.json({
    success: true,
    data: {
      hasRated: !!userRating,
      isOwner: isOwner,
      rating: userRating || null
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