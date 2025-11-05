const express = require('express');
const { completeEnrollment, getEnrolledSkills, checkEnrollmentStatus, completeModule } = require('../controllers/enrollmentController'); // Added completeModule

const router = express.Router();

router.post('/complete', completeEnrollment);
router.get('/my-skills', getEnrolledSkills);
router.get('/check/:skillId', checkEnrollmentStatus);
router.post('/complete-module/:skillId', completeModule); // NEW ROUTE

module.exports = router;