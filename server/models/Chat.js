const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  messageType: {
    type: String,
    enum: ['text', 'file', 'image'],
    default: 'text'
  },
  fileUrl: String,
  fileName: String,
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const chatSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  chatType: {
    type: String,
    enum: ['mentorship', 'group', 'direct'],
    default: 'mentorship'
  },
  mentorshipId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mentorship'
  },
  title: {
    type: String,
    trim: true
  },
  messages: [messageSchema],
  lastMessage: {
    content: String,
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
chatSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Update lastMessage when a new message is added
chatSchema.methods.addMessage = function(messageData) {
  this.messages.push(messageData);
  this.lastMessage = {
    content: messageData.content,
    sender: messageData.sender,
    createdAt: messageData.createdAt || new Date()
  };
  return this.save();
};

module.exports = mongoose.model('Chat', chatSchema);
