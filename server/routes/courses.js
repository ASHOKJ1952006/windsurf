const express = require('express');
const router = express.Router();
const {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  uploadVideo,
  uploadThumbnail,
  addReview,
  getReviews,
  toggleWishlist,
  getWishlist
} = require('../controllers/courseController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', getCourses);
router.post('/', protect, authorize('instructor', 'admin'), createCourse);

// Test route for authentication
router.get('/test-auth', protect, (req, res) => {
  console.log('=== Auth Test Route ===');
  console.log('User:', req.user);
  console.log('Headers:', req.headers.authorization);
  res.json({ 
    success: true, 
    message: 'Authentication working',
    user: {
      id: req.user?.id || req.user?._id,
      role: req.user?.role,
      name: req.user?.name,
      email: req.user?.email
    },
    timestamp: new Date().toISOString()
  });
});

// Test route for upload functionality
router.post('/test-upload', protect, (req, res) => {
  console.log('Test upload route hit');
  console.log('User:', req.user?.id);
  console.log('Headers:', req.headers);
  res.json({ 
    success: true, 
    message: 'Test route working',
    user: req.user?.id,
    timestamp: new Date().toISOString()
  });
});

// Simple video upload test (no file processing)
router.post('/test-video-upload', protect, (req, res) => {
  console.log('Test video upload route hit');
  console.log('Body:', req.body);
  console.log('Headers:', req.headers);
  res.json({ 
    success: true, 
    message: 'Video upload endpoint accessible',
    receivedData: req.body
  });
});

router.post('/upload-thumbnail', protect, authorize('instructor', 'admin'), upload.single('thumbnail'), uploadThumbnail);
// Video upload with error handling
router.post('/upload-video', protect, authorize('instructor', 'admin'), (req, res, next) => {
  upload.single('video')(req, res, (err) => {
    if (err) {
      console.error('Multer upload error:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File too large. Maximum size is 500MB.',
          error: 'FILE_TOO_LARGE'
        });
      }
      if (err.message.includes('Invalid file type')) {
        return res.status(400).json({
          success: false,
          message: err.message,
          error: 'INVALID_FILE_TYPE'
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message || 'Upload failed',
        error: 'UPLOAD_ERROR'
      });
    }
    next();
  });
}, uploadVideo);
router.get('/:id', getCourse);
router.put('/:id', protect, authorize('instructor', 'admin'), updateCourse);
router.delete('/:id', protect, authorize('instructor', 'admin'), deleteCourse);
router.post('/:id/reviews', protect, authorize('student'), addReview);
router.get('/:id/reviews', getReviews);
router.post('/:id/wishlist', protect, toggleWishlist);
router.get('/wishlist/my', protect, getWishlist);

module.exports = router;
