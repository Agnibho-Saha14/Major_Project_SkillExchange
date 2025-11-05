const asyncHandler = require('../utils/asyncHandler');
const { getAuth } = require('@clerk/express');
const Enrollment = require('../models/Enrollment');
const Skill = require('../models/Skill');


exports.completeEnrollment = asyncHandler(async (req, res) => {
// ... (existing completeEnrollment function remains unchanged)
  const { userId } = getAuth(req);
  const { skillId } = req.body; 

  if (!userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  if (!skillId) {
    return res.status(400).json({ success: false, message: 'Missing skillId' });
  }

  // Check if skill exists and is published
  const skill = await Skill.findById(skillId);
  if (!skill || skill.status !== 'published') {
    return res.status(404).json({ success: false, message: 'Skill not found or not available for enrollment' });
  }

  // Upsert the enrollment: either create a new one, or update an existing one to 'enrolled'
  const enrollment = await Enrollment.findOneAndUpdate(
    { userId: String(userId), skillId },
    { userId: String(userId), skillId, status: 'enrolled' },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  res.status(201).json({ success: true, message: 'Enrollment successful', data: enrollment });
});

exports.getEnrolledSkills = asyncHandler(async (req, res) => {
// ... (existing getEnrolledSkills function remains unchanged)
  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  // Find all enrollments for the user and populate the skill details from the Skill model
  const enrollments = await Enrollment.find({ userId: String(userId), status: 'enrolled' })
    .populate('skillId')
    .sort({ dateEnrolled: -1 });

  // Filter out any null skillIds (if the skill was deleted) and extract the skill object
  const enrolledSkills = enrollments
    .filter(e => e.skillId)
    .map(e => e.skillId);

  res.json({ success: true, data: enrolledSkills });
});

exports.checkEnrollmentStatus = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { skillId } = req.params;

  if (!userId) {
    return res.json({ success: true, data: { isEnrolled: false, completedModules: [] } });
  }

  if (!skillId) {
    return res.status(400).json({ success: false, message: 'Missing skillId' });
  }

  // Check if the skill exists
  const skill = await Skill.findById(skillId);
  if (!skill) {
    return res.status(404).json({ success: false, message: 'Skill not found' });
  }

  // Check if user is enrolled in this skill
  const enrollment = await Enrollment.findOne({
    userId: String(userId),
    skillId: skillId,
    status: 'enrolled'
  });

  const isEnrolled = !!enrollment;

  // Calculate progress on the fly for the response
  const totalModules = skill.modules?.length || 0;
  const completedCount = enrollment ? enrollment.completedModules.length : 0;
  const progressPercentage = totalModules > 0 
      ? Math.round((completedCount / totalModules) * 100) 
      : 0;

  res.json({
    success: true,
    data: {
      isEnrolled,
      skillId,
      enrollmentDate: enrollment ? enrollment.dateEnrolled : null,
      completedModules: enrollment ? enrollment.completedModules : [],
      progressPercentage: progressPercentage // NEW: Return calculated progress
    }
  });
});

// NEW FUNCTION: Mark a module as complete
exports.completeModule = asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);
    const { skillId } = req.params;
    const { moduleId } = req.body;

    if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!skillId || !moduleId) {
        return res.status(400).json({ success: false, message: 'Missing skillId or moduleId' });
    }

    // 1. Find the enrollment
    const enrollment = await Enrollment.findOne({
        userId: String(userId),
        skillId: skillId,
        status: 'enrolled'
    });

    if (!enrollment) {
        return res.status(403).json({ success: false, message: 'User is not enrolled in this skill' });
    }

    // 2. Find the skill to get total modules for progress calculation
    const skill = await Skill.findById(skillId).select('modules');
    if (!skill) {
        return res.status(404).json({ success: false, message: 'Skill not found' });
    }

    // Ensure the moduleId is actually part of the skill's modules
    const moduleExists = skill.modules.some(m => m._id.toString() === moduleId);
    if (!moduleExists) {
        return res.status(404).json({ success: false, message: 'Module not found in this skill' });
    }

    // 3. Update the enrollment
    // Use $addToSet to prevent duplicate module IDs
    const updatedEnrollment = await Enrollment.findByIdAndUpdate(
        enrollment._id,
        { $addToSet: { completedModules: moduleId } },
        { new: true }
    );

    // 4. Calculate progress percentage to send back to the frontend
    const totalModules = skill.modules.length;
    const completedModulesCount = updatedEnrollment.completedModules.length;
    const progressPercentage = totalModules > 0 
        ? Math.round((completedModulesCount / totalModules) * 100) 
        : 0;

    res.json({
        success: true,
        message: 'Module marked as complete',
        data: {
            completedModules: updatedEnrollment.completedModules,
            progressPercentage: progressPercentage,
            totalModules: totalModules
        }
    });
});