const express = require('express');
const { 
    createProposal, 
    getInstructorProposals, 
    acceptProposal, 
    rejectProposal 
} = require('../controllers/exchangeController');
const { clerkMiddleware } = require('@clerk/express');

const router = express.Router();

// All exchange routes require authentication
router.use(clerkMiddleware());

// Route for a student/user to create a proposal
router.post('/propose', createProposal);

// Route for an instructor to get all proposals related to their skills
router.get('/my-proposals', getInstructorProposals);

// Routes for an instructor to act on a proposal
router.patch('/:id/accept', acceptProposal);
router.patch('/:id/reject', rejectProposal);

module.exports = router;