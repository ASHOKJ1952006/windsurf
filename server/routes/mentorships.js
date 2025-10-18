const express = require('express');
const router = express.Router();
const {
  getMentorships,
  getMentorship,
  createMentorship,
  updateMentorship,
  submitFeedback
} = require('../controllers/mentorshipController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getMentorships);
router.get('/:id', protect, getMentorship);
router.post('/', protect, createMentorship);
router.put('/:id', protect, updateMentorship);
router.post('/:id/feedback', protect, submitFeedback);

module.exports = router;
