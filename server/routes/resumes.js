const express = require('express');
const router = express.Router();
const {
  getResumes,
  getResume,
  createResume,
  updateResume,
  deleteResume,
  generateAISuggestions,
  exportPDF,
  exportDOCX,
  exportTXT
} = require('../controllers/resumeController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// CRUD operations
router.route('/')
  .get(getResumes)
  .post(createResume);

router.route('/:id')
  .get(getResume)
  .put(updateResume)
  .delete(deleteResume);

// AI Suggestions
router.post('/:id/ai-suggestions', generateAISuggestions);

// Export routes
router.get('/:id/export/pdf', exportPDF);
router.get('/:id/export/docx', exportDOCX);
router.get('/:id/export/txt', exportTXT);

module.exports = router;
