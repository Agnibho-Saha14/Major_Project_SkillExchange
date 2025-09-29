const asyncHandler = require('../utils/asyncHandler');
const { getAuth } = require('@clerk/express');
const Enrollment = require('../models/Enrollment');
const Skill = require('../models/Skill');


exports.completeEnrollment = asyncHandler(async (req, res) => {
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
    return res.status(401).json({ success: false, message: 'Unauthorized' });
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

  res.json({
    success: true,
    data: {
      isEnrolled,
      skillId,
      enrollmentDate: enrollment ? enrollment.dateEnrolled : null
    }
  });
});