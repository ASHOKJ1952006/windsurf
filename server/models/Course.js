const mongoose = require('mongoose');

const lectureSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  type: {
    type: String,
    enum: ['video', 'text', 'quiz', 'assignment', 'resource'],
    default: 'video'
  },
  videoUrl: String,
  duration: Number, // in minutes
  content: String, // for text lectures
  resources: [{
    name: String,
    url: String,
    type: {
      type: String,
      enum: ['pdf', 'doc', 'link', 'image', 'other'],
      default: 'pdf'
    },
    size: Number, // file size in bytes
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  quiz: {
    questions: [{
      question: String,
      options: [String],
      correctAnswer: Number,
      points: {
        type: Number,
        default: 10
      }
    }],
    passingScore: {
      type: Number,
      default: 70
    },
    timeLimit: Number, // in minutes
    attempts: {
      type: Number,
      default: 3
    }
  },
  assignment: {
    description: String,
    instructions: String,
    maxScore: {
      type: Number,
      default: 100
    },
    dueDate: Date,
    submissionType: {
      type: String,
      enum: ['file', 'text', 'url'],
      default: 'file'
    }
  },
  order: {
    type: Number,
    default: 0
  },
  isFree: {
    type: Boolean,
    default: false
  },
  isRequired: {
    type: Boolean,
    default: true
  }
});

const moduleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  lectures: [lectureSchema],
  order: {
    type: Number,
    default: 0
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course.modules'
  }],
  estimatedDuration: Number, // in minutes
  learningObjectives: [String],
  completionCriteria: {
    lecturesRequired: {
      type: Number,
      default: 0 // 0 means all lectures required
    },
    assignmentsRequired: {
      type: Number,
      default: 0 // 0 means all assignments required
    },
    quizzesRequired: {
      type: Number,
      default: 0 // 0 means all quizzes required
    }
  }
});

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Course description is required']
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Web Development', 'Mobile Development', 'Data Science', 'Machine Learning', 'Design', 'Business', 'Marketing', 'Other']
  },
  tags: [{
    type: String,
    trim: true
  }],
  thumbnail: String,
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  price: {
    type: Number,
    default: 0
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  modules: [moduleSchema],
  totalDuration: {
    type: Number,
    default: 0
  },
  // Stats
  enrolledCount: {
    type: Number,
    default: 0
  },
  completionCount: {
    type: Number,
    default: 0
  },
  averageRating: {
    type: Number,
    default: 0
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  // Requirements
  requirements: [String],
  whatYouWillLearn: [String],
  // Final Test
  finalTest: {
    title: {
      type: String,
      default: 'Final Assessment'
    },
    description: String,
    questions: [{
      type: {
        type: String,
        enum: ['multiple-choice', 'true-false', 'short-answer'],
        required: true
      },
      question: {
        type: String,
        required: true
      },
      options: [String], // for multiple-choice and true-false
      correctAnswer: mongoose.Schema.Types.Mixed, // String or Number
      points: {
        type: Number,
        default: 1
      },
      explanation: String
    }],
    passingScore: {
      type: Number,
      default: 70
    },
    timeLimit: {
      type: Number,
      default: 60 // minutes
    },
    attempts: {
      type: Number,
      default: 3
    },
    isEnabled: {
      type: Boolean,
      default: true
    }
  },
  // Certificate Settings
  certificate: {
    template: {
      type: String,
      default: 'default'
    },
    isEnabled: {
      type: Boolean,
      default: true
    },
    minimumScore: {
      type: Number,
      default: 70
    },
    includeGrade: {
      type: Boolean,
      default: true
    }
  },
  // Status
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  isApproved: {
    type: Boolean,
    default: false
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

// Calculate total duration
courseSchema.methods.calculateDuration = function() {
  let total = 0;
  this.modules.forEach(module => {
    module.lectures.forEach(lecture => {
      if (lecture.duration) {
        total += lecture.duration;
      }
    });
  });
  this.totalDuration = total;
  return total;
};

// Update average rating
courseSchema.methods.updateRating = async function() {
  const Review = mongoose.model('Review');
  const stats = await Review.aggregate([
    { $match: { course: this._id } },
    {
      $group: {
        _id: null,
        avgRating: { $avg: '$rating' },
        count: { $sum: 1 }
      }
    }
  ]);

  if (stats.length > 0) {
    this.averageRating = Math.round(stats[0].avgRating * 10) / 10;
    this.totalRatings = stats[0].count;
  } else {
    this.averageRating = 0;
    this.totalRatings = 0;
  }

  await this.save();
};

module.exports = mongoose.model('Course', courseSchema);
