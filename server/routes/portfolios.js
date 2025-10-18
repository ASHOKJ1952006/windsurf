const express = require('express');
const router = express.Router();
const {
  healthCheck,
  getMyPortfolio,
  updateMyPortfolio,
  getPublicPortfolio,
  addProject,
  updateProject,
  deleteProject,
  syncCourses,
  connectGitHub,
  syncGitHub,
  disconnectGitHub,
  exportToLinkedIn,
  getAnalytics,
  trackInteraction,
  checkSlugAvailability,
  generateSlugs
} = require('../controllers/portfolioController');
const { protect } = require('../middleware/auth');

// Public routes
router.get('/public/:identifier', getPublicPortfolio);
router.post('/track', trackInteraction);

// Protected routes
router.use(protect);

// Health check
router.get('/health', healthCheck);

// My portfolio
router.get('/my', getMyPortfolio);
router.put('/my', updateMyPortfolio);

// Projects
router.post('/projects', addProject);
router.put('/projects/:projectId', updateProject);
router.delete('/projects/:projectId', deleteProject);

// Sync
router.post('/sync-courses', syncCourses);

// GitHub integration
router.post('/github/connect', connectGitHub);
router.post('/github/sync', syncGitHub);
router.delete('/github', disconnectGitHub);

// LinkedIn export
router.get('/export/linkedin', exportToLinkedIn);

// Analytics
router.get('/analytics', getAnalytics);

// Utilities
router.get('/check-slug/:slug', checkSlugAvailability);
router.post('/generate-slugs', generateSlugs);

module.exports = router;
