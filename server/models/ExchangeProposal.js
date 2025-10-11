const mongoose = require('mongoose');

const exchangeProposalSchema = new mongoose.Schema(
  {
    // The Skill the PROPOSER is interested in (The course offered by the instructor)
    skillId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Skill', 
        required: true, 
        index: true 
    },
    // The ID of the user who owns the skill and receives the proposal (The Instructor)
    instructorId: { 
        type: String, 
        required: true, 
        index: true 
    },
    // The ID of the user who sent the proposal (The Student/Proposer)
    proposerId: { 
        type: String, 
        required: true,
        index: true
    },
    // The skill(s) the proposer is offering in exchange (What the proposer teaches)
    offeredSkills: { 
        type: [String], 
        required: true,
        default: []
    },
    // Message from the proposer
    message: {
        type: String, 
        required: true 
    },
    // Status of the proposal
    status: { 
        type: String, 
        enum: ['pending', 'accepted', 'rejected', 'completed'], 
        default: 'pending' 
    },
    // Date the instructor accepted/rejected the proposal
    dateActioned: { 
        type: Date 
    },
  },
  { timestamps: true }
);

// Ensures a user can only have one pending proposal per skill at a time
exchangeProposalSchema.index(
    { skillId: 1, proposerId: 1 }, 
    { unique: true, partialFilterExpression: { status: 'pending' } }
);

const ExchangeProposal = mongoose.model('ExchangeProposal', exchangeProposalSchema);
module.exports = ExchangeProposal;