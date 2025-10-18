const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
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
  progress: [{
    lectureId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    completed: {
      type: Boolean,
      default: false
    },
    watchedPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    lastWatchedAt: Date,
    quizScore: Number,
    assignmentSubmission: {
      fileUrl: String,
      submittedAt: Date,
      score: Number,
      feedback: String
    }
  }],
  completionPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: Date,
  certificateUrl: String,
  notes: [{
    lectureId: mongoose.Schema.Types.ObjectId,
    content: String,
    timestamp: Number, // video timestamp in seconds
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  enrolledAt: {
    type: Date,
    default: Date.now
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'dropped'],
    default: 'active'
  },
  timeSpent: {
    type: Number,
    default: 0 // in minutes
  },
  currentModule: {
    type: Number,
    default: 0
  },
  currentLecture: {
    type: Number,
    default: 0
  }
});

// Prevent duplicate enrollments
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

// Calculate completion percentage
enrollmentSchema.methods.calculateCompletion = async function() {
  const Course = mongoose.model('Course');
  const course = await Course.findById(this.course);
  
  if (!course) return 0;
  
  let totalLectures = 0;
  let completedLectures = 0;
  
  // Updated to work with modules instead of sections
  course.modules.forEach(module => {
    module.lectures.forEach(lecture => {
      totalLectures++;
      const progress = this.progress.find(p => p.lectureId.toString() === lecture._id.toString());
      if (progress && progress.completed) {
        completedLectures++;
      }
    });
  });
  
  this.completionPercentage = totalLectures > 0 ? Math.round((completedLectures / totalLectures) * 100) : 0;
  
  if (this.completionPercentage === 100 && !this.isCompleted) {
    this.isCompleted = true;
    this.completedAt = new Date();
    this.status = 'completed';
  }
  
  return this.completionPercentage;
};

// Method to mark course as completed
enrollmentSchema.methods.markAsCompleted = function() {
  this.isCompleted = true;
  this.completedAt = new Date();
  this.status = 'completed';
  this.completionPercentage = 100;
};

// Method to unenroll (mark as dropped)
enrollmentSchema.methods.unenroll = function() {
  this.status = 'dropped';
};

module.exports = mongoose.model('Enrollment', enrollmentSchema);
