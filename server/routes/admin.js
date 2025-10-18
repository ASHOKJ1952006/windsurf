const express = require('express');
const router = express.Router();
const {
  getStats,
  getAllUsers,
  updateUser,
  deleteUser,
  getAllCourses,
  approveCourse,
  deleteCourse,
  getFlaggedPosts,
  deletePost
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));

router.get('/stats', getStats);
router.get('/users', getAllUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.get('/courses', getAllCourses);
router.put('/courses/:id/approve', approveCourse);
router.delete('/courses/:id', deleteCourse);
router.get('/posts/flagged', getFlaggedPosts);
router.delete('/posts/:id', deletePost);

module.exports = router;
