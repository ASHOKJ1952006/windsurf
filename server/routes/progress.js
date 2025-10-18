const express = require('express');
const router = express.Router();
const {
  getCourseProgress,
  updateLectureProgress,
  submitQuiz,
  generateCertificate,
  submitLectureAssignment,
  takeFinalTest,
  completeCourse,
  getStudentCertificates,
  downloadCertificate
} = require('../controllers/progressController');
const { protect, authorize } = require('../middleware/auth');

// Progress routes
router.get('/certificates', protect, getStudentCertificates);
router.get('/certificate/:certificateId/download', protect, downloadCertificate);
router.get('/:courseId', protect, getCourseProgress);
router.put('/:courseId/lecture', protect, updateLectureProgress);
router.put('/:courseId/quiz', protect, submitQuiz);
router.post('/:courseId/certificate', protect, generateCertificate);
router.post('/:courseId/complete', protect, completeCourse);
router.put('/:courseId/lecture/:lectureId', protect, updateLectureProgress);
router.post('/:courseId/lecture/:lectureId/submit', protect, submitLectureAssignment);
router.post('/:courseId/final-test', protect, takeFinalTest);

module.exports = router;
