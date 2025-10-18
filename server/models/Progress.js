const mongoose = require('mongoose');

const lectureProgressSchema = new mongoose.Schema({
  lectureIndex: {
    type: Number,
    required: true
  },
  lectureId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: Date,
  watchedPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  timeSpent: {
    type: Number,
    default: 0 // in minutes
  },
  lastWatchedPosition: {
    type: Number,
    default: 0 // in seconds for video lectures
  },
  attempts: {
    type: Number,
    default: 0
  },
  score: Number, // for quizzes and assignments
  submissionUrl: String, // for assignments
  submissionText: String, // for text assignments
  submittedAt: Date,
  feedback: String,
  gradedAt: Date,
  gradedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

const moduleProgressSchema = new mongoose.Schema({
  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  moduleIndex: {
    type: Number,
    required: true
  },
  isUnlocked: {
    type: Boolean,
    default: false
  },
  unlockedAt: Date,
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: Date,
  completionPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  lectures: [lectureProgressSchema],
  timeSpent: {
    type: Number,
    default: 0 // total time spent in module (minutes)
  },
  startedAt: Date
});

const testAttemptSchema = new mongoose.Schema({
  attemptNumber: {
    type: Number,
    required: true
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  answers: [{
    questionId: mongoose.Schema.Types.ObjectId,
    answer: mongoose.Schema.Types.Mixed,
    isCorrect: Boolean,
    pointsEarned: Number,
    timeSpent: Number // seconds spent on this question
  }],
  score: {
    type: Number,
    default: 0
  },
  percentage: {
    type: Number,
    default: 0
  },
  passed: {
    type: Boolean,
    default: false
  },
  timeSpent: Number, // total time in minutes
  feedback: [{
    questionId: mongoose.Schema.Types.ObjectId,
    feedback: String,
    explanation: String
  }]
});

const progressSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  enrolledAt: {
    type: Date,
    default: Date.now
  },
  startedAt: Date,
  completedAt: Date,
  lastAccessedAt: {
    type: Date,
    default: Date.now
  },
  
  // Overall Progress
  overallProgress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  
  // Module Progress
  modules: [moduleProgressSchema],
  
  // Current Position
  currentModule: {
    type: Number,
    default: 0
  },
  currentLecture: {
    type: Number,
    default: 0
  },
  
  // Final Test
  finalTestAttempts: [testAttemptSchema],
  finalTestPassed: {
    type: Boolean,
    default: false
  },
  finalTestScore: Number,
  finalTestCompletedAt: Date,
  
  // Certificate
  certificateGenerated: {
    type: Boolean,
    default: false
  },
  certificateUrl: String,
  certificateGeneratedAt: Date,
  certificateId: String, // unique certificate identifier
  
  // Analytics
  totalTimeSpent: {
    type: Number,
    default: 0 // in minutes
  },
  sessionsCount: {
    type: Number,
    default: 0
  },
  averageSessionTime: {
    type: Number,
    default: 0 // in minutes
  },
  
  // Streak and Engagement
  currentStreak: {
    type: Number,
    default: 0
  },
  longestStreak: {
    type: Number,
    default: 0
  },
  lastStudyDate: Date,
  
  // Notifications and Reminders
  remindersSent: {
    type: Number,
    default: 0
  },
  lastReminderSent: Date,
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for better performance
progressSchema.index({ student: 1, course: 1 }, { unique: true });
progressSchema.index({ student: 1 });
progressSchema.index({ course: 1 });
progressSchema.index({ isCompleted: 1 });
progressSchema.index({ lastAccessedAt: 1 });

// Methods
progressSchema.methods.updateProgress = function() {
  const totalModules = this.modules.length;
  if (totalModules === 0) return 0;
  
  const completedModules = this.modules.filter(m => m.completed).length;
  this.overallProgress = Math.round((completedModules / totalModules) * 100);
  
  // Check if course is completed
  if (completedModules === totalModules && this.finalTestPassed) {
    this.isCompleted = true;
    this.completedAt = new Date();
  }
  
  this.updatedAt = new Date();
  return this.overallProgress;
};

progressSchema.methods.unlockNextModule = function() {
  const currentModuleIndex = this.currentModule;
  if (currentModuleIndex < this.modules.length - 1) {
    const nextModule = this.modules[currentModuleIndex + 1];
    if (!nextModule.isUnlocked) {
      nextModule.isUnlocked = true;
      nextModule.unlockedAt = new Date();
      this.currentModule = currentModuleIndex + 1;
      return true;
    }
  }
  return false;
};

progressSchema.methods.canTakeFinalTest = function() {
  return this.modules.every(module => module.completed);
};

progressSchema.methods.updateStreak = function() {
  const today = new Date();
  const lastStudy = this.lastStudyDate;
  
  if (!lastStudy) {
    this.currentStreak = 1;
    this.longestStreak = Math.max(this.longestStreak, 1);
  } else {
    const daysDiff = Math.floor((today - lastStudy) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 1) {
      this.currentStreak += 1;
      this.longestStreak = Math.max(this.longestStreak, this.currentStreak);
    } else if (daysDiff > 1) {
      this.currentStreak = 1;
    }
  }
  
  this.lastStudyDate = today;
};

module.exports = mongoose.model('Progress', progressSchema);
