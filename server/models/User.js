const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['student', 'instructor', 'admin'],
    default: 'student'
  },
  profilePicture: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: ''
  },
  skills: [{
    type: String,
    trim: true
  }],
  goals: [{
    type: String,
    trim: true
  }],
  interests: [{
    type: String,
    trim: true
  }],
  // Gamification
  xp: {
    type: Number,
    default: 0
  },
  level: {
    type: Number,
    default: 1
  },
  badges: [{
    name: String,
    icon: String,
    earnedAt: {
      type: Date,
      default: Date.now
    }
  }],
  streak: {
    current: {
      type: Number,
      default: 0
    },
    longest: {
      type: Number,
      default: 0
    },
    lastActivity: Date
  },
  // Social
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // OAuth
  googleId: String,
  linkedinId: String,
  // Preferences
  darkMode: {
    type: Boolean,
    default: false
  },
  language: {
    type: String,
    default: 'en'
  },
  emailNotifications: {
    type: Boolean,
    default: true
  },
  // Course Statistics
  enrolledCourses: {
    type: Number,
    default: 0
  },
  completedCourses: {
    type: Number,
    default: 0
  },
  inProgressCourses: {
    type: Number,
    default: 0
  },
  totalLearningTime: {
    type: Number,
    default: 0 // in minutes
  },
  // Instructor specific
  instructorBio: String,
  instructorRating: {
    type: Number,
    default: 0
  },
  totalStudents: {
    type: Number,
    default: 0
  },
  // Wishlist
  wishlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  // Contact Information
  phone: {
    type: String,
    default: ''
  },
  website: {
    type: String,
    default: ''
  },
  linkedin: {
    type: String,
    default: ''
  },
  github: {
    type: String,
    default: ''
  },
  twitter: {
    type: String,
    default: ''
  },
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Update streak
userSchema.methods.updateStreak = function() {
  const now = new Date();
  const lastActivity = this.streak.lastActivity;
  
  if (!lastActivity) {
    this.streak.current = 1;
    this.streak.lastActivity = now;
    return;
  }
  
  const daysDiff = Math.floor((now - lastActivity) / (1000 * 60 * 60 * 24));
  
  if (daysDiff === 1) {
    this.streak.current += 1;
    if (this.streak.current > this.streak.longest) {
      this.streak.longest = this.streak.current;
    }
  } else if (daysDiff > 1) {
    this.streak.current = 1;
  }
  
  this.streak.lastActivity = now;
};

module.exports = mongoose.model('User', userSchema);
