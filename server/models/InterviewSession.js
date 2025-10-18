const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['behavioral', 'technical', 'situational', 'role-specific'],
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  category: String,
  suggestedAnswer: String,
  starStructure: {
    situation: String,
    task: String,
    action: String,
    result: String
  },
  keywords: [String],
  timeLimit: {
    type: Number,
    default: 120 // seconds
  }
});

const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  question: String,
  answer: String,
  
  // Recording
  audioUrl: String,
  videoUrl: String,
  transcription: String,
  
  // Timing
  startTime: Date,
  endTime: Date,
  duration: Number, // seconds
  
  // AI Feedback
  feedback: {
    score: {
      type: Number,
      min: 0,
      max: 100
    },
    strengths: [String],
    improvements: [String],
    starAnalysis: {
      hasSituation: Boolean,
      hasTask: Boolean,
      hasAction: Boolean,
      hasResult: Boolean,
      score: Number
    },
    clarity: Number, // 0-100
    confidence: Number, // 0-100
    relevance: Number, // 0-100
    detailedFeedback: String
  },
  
  // Metrics
  wordCount: Number,
  fillerWords: Number,
  speakingPace: Number, // words per minute
  
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const interviewSessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  resume: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume'
  },
  
  // Session Configuration
  sessionType: {
    type: String,
    enum: ['practice', 'mock', 'timed'],
    default: 'practice'
  },
  
  role: String,
  industry: String,
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'mixed'],
    default: 'medium'
  },
  
  // Questions
  questions: [questionSchema],
  totalQuestions: Number,
  
  // Answers
  answers: [answerSchema],
  
  // Session State
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'abandoned'],
    default: 'scheduled'
  },
  
  currentQuestionIndex: {
    type: Number,
    default: 0
  },
  
  // Timing
  scheduledAt: Date,
  startedAt: Date,
  completedAt: Date,
  totalDuration: Number, // seconds
  
  // Overall Performance
  overallScore: {
    type: Number,
    min: 0,
    max: 100
  },
  
  performanceMetrics: {
    averageScore: Number,
    technicalScore: Number,
    behavioralScore: Number,
    communicationScore: Number,
    confidenceLevel: Number,
    responseQuality: Number
  },
  
  // AI Analysis
  aiAnalysis: {
    strengths: [String],
    weaknesses: [String],
    recommendations: [String],
    comparisonToPeers: String,
    improvementPlan: [{
      area: String,
      priority: String,
      suggestions: [String]
    }]
  },
  
  // Recording
  fullRecordingUrl: String,
  
  // Feedback
  recruiterFeedback: String,
  selfRating: Number,
  
  // Settings
  settings: {
    recordAudio: {
      type: Boolean,
      default: true
    },
    recordVideo: {
      type: Boolean,
      default: false
    },
    enableTranscription: {
      type: Boolean,
      default: true
    },
    timePerQuestion: Number, // seconds
    showHints: Boolean,
    difficulty: String
  },
  
  // Privacy
  isShared: {
    type: Boolean,
    default: false
  },
  
  shareToken: String,
  
  // Metadata
  notes: String,
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
interviewSessionSchema.index({ user: 1, status: 1 });
interviewSessionSchema.index({ user: 1, createdAt: -1 });
interviewSessionSchema.index({ status: 1, scheduledAt: 1 });

// Methods
interviewSessionSchema.methods.calculateOverallScore = function() {
  if (this.answers.length === 0) return 0;
  
  const totalScore = this.answers.reduce((sum, answer) => {
    return sum + (answer.feedback?.score || 0);
  }, 0);
  
  this.overallScore = Math.round(totalScore / this.answers.length);
  return this.overallScore;
};

interviewSessionSchema.methods.generateImprovementPlan = function() {
  const improvements = [];
  
  // Analyze STAR structure across answers
  const starScores = this.answers
    .filter(a => a.feedback?.starAnalysis)
    .map(a => a.feedback.starAnalysis);
  
  if (starScores.length > 0) {
    const avgStar = starScores.reduce((sum, s) => sum + (s.score || 0), 0) / starScores.length;
    
    if (avgStar < 70) {
      improvements.push({
        area: 'STAR Structure',
        priority: 'high',
        suggestions: [
          'Practice structuring answers with clear Situation, Task, Action, and Result',
          'Use the STAR method for behavioral questions',
          'Include specific metrics and outcomes in your Results'
        ]
      });
    }
  }
  
  // Analyze confidence
  const confidenceScores = this.answers
    .filter(a => a.feedback?.confidence)
    .map(a => a.feedback.confidence);
  
  if (confidenceScores.length > 0) {
    const avgConfidence = confidenceScores.reduce((sum, c) => sum + c, 0) / confidenceScores.length;
    
    if (avgConfidence < 60) {
      improvements.push({
        area: 'Confidence',
        priority: 'medium',
        suggestions: [
          'Practice answers out loud before the interview',
          'Prepare specific examples from your experience',
          'Take a pause before answering to gather your thoughts'
        ]
      });
    }
  }
  
  // Analyze clarity
  const clarityScores = this.answers
    .filter(a => a.feedback?.clarity)
    .map(a => a.feedback.clarity);
  
  if (clarityScores.length > 0) {
    const avgClarity = clarityScores.reduce((sum, c) => sum + c, 0) / clarityScores.length;
    
    if (avgClarity < 70) {
      improvements.push({
        area: 'Communication Clarity',
        priority: 'high',
        suggestions: [
          'Use concise language and avoid rambling',
          'Organize your thoughts before speaking',
          'Practice active listening and stay on topic'
        ]
      });
    }
  }
  
  this.aiAnalysis.improvementPlan = improvements;
  return improvements;
};

interviewSessionSchema.methods.getNextQuestion = function() {
  if (this.currentQuestionIndex < this.questions.length) {
    return this.questions[this.currentQuestionIndex];
  }
  return null;
};

interviewSessionSchema.methods.submitAnswer = function(answerData) {
  this.answers.push(answerData);
  this.currentQuestionIndex += 1;
  
  if (this.currentQuestionIndex >= this.questions.length) {
    this.status = 'completed';
    this.completedAt = new Date();
    this.calculateOverallScore();
    this.generateImprovementPlan();
  }
};

// Pre-save middleware
interviewSessionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('InterviewSession', interviewSessionSchema);
