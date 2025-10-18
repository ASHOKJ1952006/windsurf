const express = require('express');
const router = express.Router();
const {
  enrollCourse,
  getMyEnrollments,
  getEnrollment,
  updateProgress,
  submitAssignment,
  generateCertificate,
  unenrollCourse,
  completeCourse,
  getEnrollmentStatus,
  getUserStats
} = require('../controllers/enrollmentController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Enrollment management
router.post('/:courseId', protect, enrollCourse);
router.delete('/:courseId', protect, unenrollCourse);
router.post('/:courseId/complete', protect, completeCourse);
router.get('/status/:courseId', protect, getEnrollmentStatus);
router.get('/stats', protect, getUserStats);

// My enrollments
router.get('/my', protect, getMyEnrollments);
router.get('/:id', protect, getEnrollment);

// Progress tracking
router.put('/:id/progress', protect, updateProgress);
router.post('/:id/assignment', protect, upload.single('assignment'), submitAssignment);
router.post('/:id/certificate', protect, generateCertificate);

module.exports = router;
