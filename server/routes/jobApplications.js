const express = require('express');
const router = express.Router();
const {
  submitApplication,
  getMyApplications,
  getAllApplications,
  getApplicationDetails,
  updateApplicationStatus,
  scheduleInterview,
  addAdminNote,
  deleteApplication
} = require('../controllers/jobApplicationController');
const { protect, authorize } = require('../middleware/auth');

// Student routes
router.post('/apply/:jobId', protect, authorize('student'), submitApplication);
router.get('/my', protect, authorize('student'), getMyApplications);

// Admin routes
router.get('/admin/all', protect, authorize('admin'), getAllApplications);
router.get('/admin/:applicationId', protect, authorize('admin'), getApplicationDetails);
router.put('/admin/:applicationId/status', protect, authorize('admin'), updateApplicationStatus);
router.put('/admin/:applicationId/interview', protect, authorize('admin'), scheduleInterview);
router.post('/admin/:applicationId/note', protect, authorize('admin'), addAdminNote);
router.delete('/admin/:applicationId', protect, authorize('admin'), deleteApplication);

module.exports = router;
