const express = require('express');
const { completeEnrollment, getEnrolledSkills } = require('../controllers/enrollmentController');

const router = express.Router();

router.post('/complete', completeEnrollment);
router.get('/my-skills', getEnrolledSkills);

module.exports = router;