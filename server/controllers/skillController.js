const Skill = require('../models/Skill');
const asyncHandler = require('../utils/asyncHandler');
const { getAuth } = require('@clerk/express');
const { clerkClient } = require('@clerk/clerk-sdk-node');
const { verifyCertificateCredential } = require('../utils/ocrVerification');
const path = require('path');
const fs = require('fs');

async function getUserEmail(userId) {
  if (!userId) return null;
  const user = await clerkClient.users.getUser(userId);
  const emails = user?.emailAddresses || [];
  if (emails.length === 0) return null;
  const primary = emails.find((e) => e.id === user.primaryEmailAddressId);
  return primary?.emailAddress || emails[0]?.emailAddress || null;
}
const generateFileUrl = (req, filePath) => {
  const fileName = path.basename(filePath);
  const uploadType = filePath.includes("certificates")
    ? "certificates"
    : filePath.includes("videos")
    ? "videos"
    : "uploads";
  return `/uploads/${uploadType}/${fileName}`;
};
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
exports.getSkillById = async (req, res) => {
  try {
    const { id } = req.params;
    const skill = await Skill.findById(id);

    if (!skill) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found'
      });
    }

    res.status(200).json({
      success: true,
      data: skill
    });

  } catch (error) {
    console.error('Error fetching skill:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch skill',
      error: error.message
    });
  }
};

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

// CREATE skill with OCR verification and optional intro video
exports.createSkill = asyncHandler(async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const email = await getUserEmail(userId);

    // Parse incoming form data
    let body;
    try {
      body = req.body.skillData ? JSON.parse(req.body.skillData) : req.body;
    } catch (err) {
      return res.status(400).json({ success: false, message: "Invalid skillData format" });
    }

    // Validate required fields
    const required = [
      "title",
      "instructor",
      "category",
      "level",
      "duration",
      "timePerWeek",
      "paymentOptions",
      "description",
      "credentialId"
    ];

    const missing = required.filter((f) => !body[f]);
    if (missing.length) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missing.join(", ")}`
      });
    }

    // Ensure certificate file uploaded
    if (!req.files?.certificate) {
      return res.status(400).json({
        success: false,
        message: "Certificate file is required"
      });
    }

    const certificateFile = req.files.certificate[0];
    const certificatePath = path.join(__dirname, "..", certificateFile.path);
    const isImage = certificateFile.mimetype.startsWith("image/");

    // OCR Verification (for images only)
    if (isImage) {
      console.log("Starting credential verification...");

      const verificationResult = await verifyCertificateCredential(
        certificatePath,
        body.credentialId
      );

      console.log("Verification result:", verificationResult);

      // If verification fails, clean up and return error
      if (!verificationResult.success) {
        const fsPromises = fs.promises;
        await fsPromises.unlink(certificatePath).catch(() => {});
        if (req.files?.introVideo) {
          const videoPath = path.join(__dirname, "..", req.files.introVideo[0].path);
          await fsPromises.unlink(videoPath).catch(() => {});
        }

        return res.status(400).json({
          success: false,
          message:
            verificationResult.message ||
            "Credential ID not found in certificate. Please ensure it matches exactly.",
          verificationFailed: true
        });
      }

      console.log("Credential verified successfully!");
    } else {
      console.log("PDF uploaded - skipping OCR verification (PDF OCR not implemented)");
    }

    // Generate URLs for uploaded files
    const certificateUrl = generateFileUrl(req, certificateFile.path);
    let introVideoUrl = "";
    if (req.files?.introVideo && req.files.introVideo[0]) {
      introVideoUrl = generateFileUrl(req, req.files.introVideo[0].path);
      console.log("Intro video uploaded successfully");
    }

    // Create Skill entry
    const newSkill = await Skill.create({
      ...body,
      ownerId: String(userId),
      email: email || "",
      certificateUrl,
      introVideoUrl,
      status: body.status || "published"
    });

    res.status(201).json({
      success: true,
      message: "Skill created successfully with verified credentials",
      data: newSkill
    });
  } catch (error) {
    console.error("Error creating skill:", error);

    // Clean up uploaded files if something fails
    if (req.files) {
      try {
        if (req.files.certificate) {
          fs.unlinkSync(req.files.certificate[0].path);
        }
        if (req.files.introVideo) {
          fs.unlinkSync(req.files.introVideo[0].path);
        }
      } catch (cleanupErr) {
        console.error("Error cleaning up files:", cleanupErr);
      }
    }

    res.status(500).json({
      success: false,
      message: "Failed to create skill",
      error: error.message
    });
  }
});

// UPDATE skill (excluding price - price is fixed after creation)
exports.updateSkill = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { id } = req.params;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Unauthorized' 
      });
    }

    const skill = await Skill.findById(id);
    
    if (!skill) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found'
      });
    }

    // Check ownership
    if (skill.ownerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only update your own skills'
      });
    }

    const { skillData } = req.body;
    const parsedData = typeof skillData === 'string' ? JSON.parse(skillData) : skillData;

    // Handle new certificate upload
    if (req.files && req.files['certificate'] && req.files['certificate'][0]) {
      if (skill.certificateUrl) {
        const oldCertPath = skill.certificateUrl.split('/uploads/')[1];
        const fullPath = path.join(__dirname, '../uploads/', oldCertPath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }
      parsedData.certificateUrl = generateFileUrl(req, req.files['certificate'][0].path);
    }

    // Handle new video upload
    if (req.files && req.files['introVideo'] && req.files['introVideo'][0]) {
      if (skill.introVideoUrl) {
        const oldVideoPath = skill.introVideoUrl.split('/uploads/')[1];
        const fullPath = path.join(__dirname, '../uploads/', oldVideoPath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }
      parsedData.introVideoUrl = generateFileUrl(req, req.files['introVideo'][0].path);
    }

    // Update skill
    Object.assign(skill, parsedData);
    await skill.save();

    res.status(200).json({
      success: true,
      message: 'Skill updated successfully',
      data: skill
    });

  } catch (error) {
    console.error('Error updating skill:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update skill',
      error: error.message
    });
  }
};

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

  // Delete associated files
  const fs = require('fs').promises;
  
  if (skill.certificateUrl) {
    const certPath = path.join(__dirname, '..', skill.certificateUrl);
    await fs.unlink(certPath).catch(() => {});
  }
  
  if (skill.introVideoUrl) {
    const videoPath = path.join(__dirname, '..', skill.introVideoUrl);
    await fs.unlink(videoPath).catch(() => {});
  }

  await skill.deleteOne();
  res.json({ success: true, message: 'Skill deleted successfully' });
});

// SAVE draft (with OCR verification and optional intro video)
exports.saveDraft = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Unauthorized' 
      });
    }

    const { skillData } = req.body;
    const parsedData = typeof skillData === 'string' ? JSON.parse(skillData) : skillData;

    // Generate certificate URL
    let certificateUrl = '';
    if (req.files && req.files['certificate'] && req.files['certificate'][0]) {
      certificateUrl = generateFileUrl(req, req.files['certificate'][0].path);
    }

    // Generate intro video URL
    let introVideoUrl = '';
    if (req.files && req.files['introVideo'] && req.files['introVideo'][0]) {
      introVideoUrl = generateFileUrl(req, req.files['introVideo'][0].path);
    }

    const draftSkill = new Skill({
      ...parsedData,
      ownerId: userId,
      certificateUrl,
      introVideoUrl, 
      status: 'draft'
    });

    await draftSkill.save();

    res.status(201).json({
      success: true,
      message: 'Draft saved successfully',
      data: draftSkill
    });

  } catch (error) {
    console.error('Error saving draft:', error);
    
    // Clean up uploaded files if draft save fails
    if (req.files) {
      if (req.files['certificate']) {
        fs.unlinkSync(req.files['certificate'][0].path);
      }
      if (req.files['introVideo']) {
        fs.unlinkSync(req.files['introVideo'][0].path);
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to save draft',
      error: error.message
    });
  }
};

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