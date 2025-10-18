const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  uploadProfilePicture,
  getLeaderboard,
  followUser,
  unfollowUser
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/profile/:id', protect, getProfile);
router.get('/profile', protect, getProfile); // Get own profile
router.put('/profile', protect, updateProfile);
router.post('/profile/picture', protect, upload.single('profilePicture'), uploadProfilePicture);
router.get('/leaderboard', protect, getLeaderboard);
router.post('/follow/:id', protect, followUser);
router.post('/unfollow/:id', protect, unfollowUser);

module.exports = router;
