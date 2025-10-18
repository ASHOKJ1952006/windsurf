const express = require('express');
const router = express.Router();
const { 
  getRecommendations, 
  getLearningPaths, 
  getInterestBasedRecommendations,
  getSimilarCourses,
  getRecommendationsByCategory
} = require('../controllers/recommendationController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getRecommendations);
router.get('/learning-paths', protect, getLearningPaths);
router.get('/by-interest/:interest', protect, getInterestBasedRecommendations);
router.get('/similar/:courseId', protect, getSimilarCourses);
router.get('/category/:category', protect, getRecommendationsByCategory);

module.exports = router;
