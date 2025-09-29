const express = require('express');
const { completeEnrollment, getEnrolledSkills,checkEnrollmentStatus } = require('../controllers/enrollmentController');

const router = express.Router();

router.post('/complete', completeEnrollment);
router.get('/my-skills', getEnrolledSkills);
router.get('/check/:skillId', checkEnrollmentStatus);

module.exports = router;