const express = require('express');
const router = express.Router();
const {
  getChats,
  getChat,
  createChat,
  sendMessage,
  getAvailableMentors,
  getStudents,
  deleteChat
} = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

router.get('/', getChats);
router.post('/', createChat);
router.get('/mentors', getAvailableMentors);
router.get('/students', getStudents);
router.get('/:id', getChat);
router.post('/:id/messages', sendMessage);
router.delete('/:id', deleteChat);

module.exports = router;
