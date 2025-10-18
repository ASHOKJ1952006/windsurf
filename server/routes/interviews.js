const express = require('express');
const router = express.Router();
const {
  getQuestions,
  getSessions,
  getSession,
  createSession,
  startSession,
  submitAnswer,
  completeSession,
  getAnalytics
} = require('../controllers/interviewController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Questions bank
router.get('/questions', getQuestions);

// Sessions
router.route('/sessions')
  .get(getSessions)
  .post(createSession);

router.get('/sessions/:id', getSession);
router.post('/sessions/:id/start', startSession);
router.post('/sessions/:id/answer', submitAnswer);
router.post('/sessions/:id/complete', completeSession);

// Analytics
router.get('/analytics', getAnalytics);

module.exports = router;
