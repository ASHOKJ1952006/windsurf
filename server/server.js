require('dotenv').config();

// Environment validation
console.log('🔧 Starting server...');
console.log('📍 Environment variables:');
console.log('  - NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('  - PORT:', process.env.PORT || 5000);
console.log('  - CLIENT_URL:', process.env.CLIENT_URL || 'http://localhost:5173');
console.log('  - MONGO_URI:', process.env.MONGO_URI ? '✅ Set' : '⚠️  Using default');
console.log('  - JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '⚠️  Using fallback');
console.log('');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());
app.use('/uploads', express.static('uploads'));

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/elearning';
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected to:', MONGO_URI))
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  console.log('💡 Make sure MongoDB is running and MONGO_URI is set in .env file');
});

// Socket.IO
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join user to their personal room for notifications
  socket.on('join-user-room', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User ${socket.id} joined personal room: user_${userId}`);
  });

  // Join chat room
  socket.on('join-chat', (chatId) => {
    socket.join(`chat_${chatId}`);
    console.log(`User ${socket.id} joined chat room: chat_${chatId}`);
  });

  // Leave chat room
  socket.on('leave-chat', (chatId) => {
    socket.leave(`chat_${chatId}`);
    console.log(`User ${socket.id} left chat room: chat_${chatId}`);
  });

  // Handle typing indicators
  socket.on('typing', ({ chatId, userId, userName, isTyping }) => {
    socket.to(`chat_${chatId}`).emit('user-typing', { userId, userName, isTyping });
  });

  // Legacy forum support
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  socket.on('send-message', ({ roomId, message, userId, userName }) => {
    io.to(roomId).emit('receive-message', { message, userId, userName, timestamp: new Date() });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Make io accessible to routes
app.set('io', io);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/enrollments', require('./routes/enrollments'));
app.use('/api/forums', require('./routes/forums'));
app.use('/api/mentorships', require('./routes/mentorships'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/recommendations', require('./routes/recommendations'));
app.use('/api/chatbot', require('./routes/chatbot'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/progress', require('./routes/progress'));
app.use('/api/chats', require('./routes/chats'));
app.use('/api/resumes', require('./routes/resumes'));
app.use('/api/interviews', require('./routes/interviews'));
app.use('/api/portfolios', require('./routes/portfolios'));
app.use('/api/job-applications', require('./routes/jobApplications'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
