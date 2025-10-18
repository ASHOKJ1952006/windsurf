const Chat = require('../models/Chat');
const User = require('../models/User');
const Mentorship = require('../models/Mentorship');

// @desc    Get user's chats
// @route   GET /api/chats
// @access  Private
exports.getChats = async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.user.id,
      isActive: true
    })
    .populate('participants', 'name profilePicture role')
    .populate('lastMessage.sender', 'name role')
    .populate('mentorshipId', 'topic')
    .sort({ updatedAt: -1 });

    res.json({ success: true, chats });
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single chat with messages
// @route   GET /api/chats/:id
// @access  Private
exports.getChat = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id)
      .populate('participants', 'name profilePicture role')
      .populate('messages.sender', 'name profilePicture role')
      .populate('mentorshipId', 'topic');

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if user is participant
    if (!chat.participants.some(p => p._id.toString() === req.user.id)) {
      return res.status(403).json({ message: 'Not authorized to access this chat' });
    }

    // Mark messages as read for current user
    chat.messages.forEach(message => {
      if (message.sender._id.toString() !== req.user.id) {
        message.isRead = true;
      }
    });

    await chat.save();

    res.json({ success: true, chat });
  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create or get chat between users
// @route   POST /api/chats
// @access  Private
exports.createChat = async (req, res) => {
  try {
    const { participantId, mentorshipId, title } = req.body;

    if (!participantId) {
      return res.status(400).json({ message: 'Participant ID is required' });
    }

    // Check if participant exists
    const participant = await User.findById(participantId);
    if (!participant) {
      return res.status(404).json({ message: 'Participant not found' });
    }

    // Check if chat already exists between these users
    let existingChat = await Chat.findOne({
      participants: { $all: [req.user.id, participantId] },
      chatType: mentorshipId ? 'mentorship' : 'direct',
      mentorshipId: mentorshipId || { $exists: false },
      isActive: true
    }).populate('participants', 'name profilePicture role');

    if (existingChat) {
      return res.json({ success: true, chat: existingChat });
    }

    // Create new chat
    const chatData = {
      participants: [req.user.id, participantId],
      chatType: mentorshipId ? 'mentorship' : 'direct',
      title: title || `Chat with ${participant.name}`,
      isActive: true
    };

    if (mentorshipId) {
      chatData.mentorshipId = mentorshipId;
    }

    const chat = await Chat.create(chatData);
    
    const populatedChat = await Chat.findById(chat._id)
      .populate('participants', 'name profilePicture role')
      .populate('mentorshipId', 'topic');

    res.status(201).json({ success: true, chat: populatedChat });
  } catch (error) {
    console.error('Create chat error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send message
// @route   POST /api/chats/:id/messages
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const { content, messageType = 'text', fileUrl, fileName } = req.body;

    if (!content && !fileUrl) {
      return res.status(400).json({ message: 'Message content or file is required' });
    }

    const chat = await Chat.findById(req.params.id);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if user is participant
    if (!chat.participants.includes(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized to send messages in this chat' });
    }

    const messageData = {
      sender: req.user.id,
      content: content || fileName,
      messageType,
      fileUrl,
      fileName,
      createdAt: new Date()
    };

    await chat.addMessage(messageData);

    const updatedChat = await Chat.findById(chat._id)
      .populate('messages.sender', 'name profilePicture role')
      .populate('participants', 'name profilePicture role');

    const newMessage = updatedChat.messages[updatedChat.messages.length - 1];

    // Emit socket event for real-time messaging
    const io = req.app.get('io');
    if (io) {
      chat.participants.forEach(participantId => {
        if (participantId.toString() !== req.user.id) {
          io.to(`user_${participantId}`).emit('new-message', {
            chatId: chat._id,
            message: newMessage,
            chat: {
              _id: chat._id,
              title: chat.title,
              participants: updatedChat.participants,
              lastMessage: chat.lastMessage
            }
          });
        }
      });
    }

    res.json({ success: true, message: newMessage, chat: updatedChat });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get available mentors/instructors
// @route   GET /api/chats/mentors
// @access  Private
exports.getAvailableMentors = async (req, res) => {
  try {
    const mentors = await User.find({
      role: { $in: ['instructor', 'admin'] },
      _id: { $ne: req.user.id }
    }).select('name profilePicture role bio instructorBio');

    res.json({ success: true, mentors });
  } catch (error) {
    console.error('Get mentors error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get students (for instructors)
// @route   GET /api/chats/students
// @access  Private (Instructor/Admin)
exports.getStudents = async (req, res) => {
  try {
    if (req.user.role !== 'instructor' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only instructors can access student list' });
    }

    const students = await User.find({
      role: 'student',
      _id: { $ne: req.user.id }
    }).select('name profilePicture role bio');

    res.json({ success: true, students });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete chat
// @route   DELETE /api/chats/:id
// @access  Private
exports.deleteChat = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if user is participant
    if (!chat.participants.includes(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized to delete this chat' });
    }

    chat.isActive = false;
    await chat.save();

    res.json({ success: true, message: 'Chat deleted successfully' });
  } catch (error) {
    console.error('Delete chat error:', error);
    res.status(500).json({ message: error.message });
  }
};
