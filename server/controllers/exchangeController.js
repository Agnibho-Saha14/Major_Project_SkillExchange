const asyncHandler = require('../utils/asyncHandler');
const { getAuth } = require('@clerk/express');
const { clerkClient } = require('@clerk/clerk-sdk-node');
const ExchangeProposal = require('../models/ExchangeProposal');
const Enrollment = require('../models/Enrollment');
const Skill = require('../models/Skill');

// Helper to get user email and name (reused from skillController)
async function getUserInfo(userId) {
  if (!userId) return { email: null, name: 'Anonymous' };
  const user = await clerkClient.users.getUser(userId);
  const emails = user?.emailAddresses || [];
  const primary = emails.find((e) => e.id === user.primaryEmailAddressId);
  const email = primary?.emailAddress || emails[0]?.emailAddress || null;
  const name = user?.firstName || user?.username || 'User';
  return { email, name };
}

// POST /api/exchange/propose
exports.createProposal = asyncHandler(async (req, res) => {
  const { userId: proposerId } = getAuth(req);
  if (!proposerId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const { skillId, offeredSkills, message } = req.body;
  if (!skillId || !offeredSkills || offeredSkills.length === 0 || !message) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  const skill = await Skill.findById(skillId);
  if (!skill || skill.status !== 'published' || !skill.paymentOptions.includes('exchange')) {
    return res.status(404).json({ success: false, message: 'Skill not available for exchange' });
  }

  // Prevent proposing exchange on own skill
  if (String(skill.ownerId) === String(proposerId)) {
    return res.status(400).json({ success: false, message: 'Cannot propose exchange for your own skill' });
  }

  // Check for existing pending proposal
  const existing = await ExchangeProposal.findOne({
    skillId,
    proposerId: String(proposerId),
    status: 'pending'
  });
  if (existing) {
    return res.status(400).json({ success: false, message: 'You already have a pending proposal for this skill.' });
  }

  const proposal = await ExchangeProposal.create({
    skillId,
    instructorId: String(skill.ownerId),
    proposerId: String(proposerId),
    offeredSkills,
    message
  });

  res.status(201).json({ success: true, message: 'Exchange proposal submitted successfully.', data: proposal });
});

// GET /api/exchange/my-proposals (For the Instructor/Receiver)
exports.getInstructorProposals = asyncHandler(async (req, res) => {
  const { userId: instructorId } = getAuth(req);
  if (!instructorId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const proposals = await ExchangeProposal.find({ instructorId: String(instructorId) })
    .populate('skillId', 'title instructor price paymentOptions skills') // Populate basic skill info
    .sort({ createdAt: -1 });
  
  // Enhance data with proposer's name/email if necessary (optional - for better UI)
  const populatedProposals = await Promise.all(
    proposals.map(async (p) => {
      const proposerInfo = await getUserInfo(p.proposerId);
      return {
        ...p.toObject(),
        proposerName: proposerInfo.name,
        proposerEmail: proposerInfo.email,
      };
    })
  );

  res.json({ success: true, data: populatedProposals });
});

// PATCH /api/exchange/:id/accept
exports.acceptProposal = asyncHandler(async (req, res) => {
  const { userId: instructorId } = getAuth(req);
  const { id: proposalId } = req.params;

  if (!instructorId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const proposal = await ExchangeProposal.findById(proposalId);

  if (!proposal) {
    return res.status(404).json({ success: false, message: 'Proposal not found' });
  }
  if (String(proposal.instructorId) !== String(instructorId)) {
    return res.status(403).json({ success: false, message: 'You are not the instructor for this proposal' });
  }
  if (proposal.status !== 'pending') {
    return res.status(400).json({ success: false, message: `Proposal already ${proposal.status}` });
  }

  // 1. Update proposal status
  proposal.status = 'accepted';
  proposal.dateActioned = new Date();
  await proposal.save();

  // 2. Create enrollment record for the proposer (simulating payment success)
  await Enrollment.findOneAndUpdate(
    { userId: proposal.proposerId, skillId: proposal.skillId },
    { userId: proposal.proposerId, skillId: proposal.skillId, status: 'enrolled' },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  
  // 3. Send notification/email to proposer (Client-side responsibility for email)
  
  res.json({ success: true, message: 'Proposal accepted successfully! Enrollment created.', data: proposal });
});

// PATCH /api/exchange/:id/reject
exports.rejectProposal = asyncHandler(async (req, res) => {
  const { userId: instructorId } = getAuth(req);
  const { id: proposalId } = req.params;

  if (!instructorId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const proposal = await ExchangeProposal.findById(proposalId);

  if (!proposal) {
    return res.status(404).json({ success: false, message: 'Proposal not found' });
  }
  if (String(proposal.instructorId) !== String(instructorId)) {
    return res.status(403).json({ success: false, message: 'You are not the instructor for this proposal' });
  }
  if (proposal.status !== 'pending') {
    return res.status(400).json({ success: false, message: `Proposal already ${proposal.status}` });
  }

  // Update proposal status
  proposal.status = 'rejected';
  proposal.dateActioned = new Date();
  await proposal.save();
  
  // Send notification/email to proposer (Client-side responsibility for email)

  res.json({ success: true, message: 'Proposal rejected.', data: proposal });
});