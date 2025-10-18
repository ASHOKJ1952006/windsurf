const mongoose = require('mongoose');

const interviewQuestionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    unique: true
  },
  
  type: {
    type: String,
    enum: ['behavioral', 'technical', 'situational', 'role-specific', 'general'],
    required: true
  },
  
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  
  category: {
    type: String,
    enum: [
      'leadership', 'teamwork', 'problem-solving', 'communication',
      'conflict-resolution', 'time-management', 'adaptability',
      'coding', 'system-design', 'algorithms', 'data-structures',
      'databases', 'frontend', 'backend', 'devops', 'security',
      'product', 'design', 'marketing', 'sales', 'general'
    ]
  },
  
  roles: [{
    type: String,
    enum: [
      'software-engineer', 'data-scientist', 'product-manager',
      'designer', 'marketing', 'sales', 'hr', 'finance',
      'operations', 'customer-success', 'general'
    ]
  }],
  
  industries: [String],
  
  // Model Answer
  suggestedAnswer: String,
  
  // STAR Structure Example
  starExample: {
    situation: String,
    task: String,
    action: String,
    result: String
  },
  
  // Guidance
  answerGuidelines: [String],
  keyPoints: [String],
  keywords: [String],
  commonMistakes: [String],
  
  // Timing
  recommendedTime: {
    type: Number,
    default: 120 // seconds
  },
  
  // Variations
  variations: [String],
  followUpQuestions: [String],
  
  // Difficulty Metrics
  successRate: {
    type: Number,
    default: 50,
    min: 0,
    max: 100
  },
  
  averageScore: {
    type: Number,
    default: 50,
    min: 0,
    max: 100
  },
  
  // Usage Statistics
  timesAsked: {
    type: Number,
    default: 0
  },
  
  timesAnswered: {
    type: Number,
    default: 0
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Source
  source: {
    type: String,
    enum: ['platform', 'user-submitted', 'imported'],
    default: 'platform'
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Metadata
  tags: [String],
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
interviewQuestionSchema.index({ type: 1, difficulty: 1 });
interviewQuestionSchema.index({ roles: 1, difficulty: 1 });
interviewQuestionSchema.index({ category: 1 });
interviewQuestionSchema.index({ isActive: 1 });

// Pre-save middleware
interviewQuestionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('InterviewQuestion', interviewQuestionSchema);
