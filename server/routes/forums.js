const express = require('express');
const router = express.Router();
const {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  addAnswer,
  updateAnswer,
  acceptAnswer,
  upvotePost,
  upvoteAnswer,
  addComment
} = require('../controllers/forumController');
const { protect } = require('../middleware/auth');

router.get('/', getPosts);
router.get('/:id', getPost);
router.post('/', protect, createPost);
router.put('/:id', protect, updatePost);
router.delete('/:id', protect, deletePost);
router.post('/:id/answers', protect, addAnswer);
router.put('/:postId/answers/:answerId', protect, updateAnswer);
router.post('/:postId/answers/:answerId/accept', protect, acceptAnswer);
router.post('/:id/upvote', protect, upvotePost);
router.post('/:postId/answers/:answerId/upvote', protect, upvoteAnswer);
router.post('/:postId/answers/:answerId/comments', protect, addComment);

module.exports = router;
