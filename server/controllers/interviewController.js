const InterviewSession = require('../models/InterviewSession');
const InterviewQuestion = require('../models/InterviewQuestion');
const Resume = require('../models/Resume');

// @desc    Get interview questions bank
// @route   GET /api/interviews/questions
// @access  Private
exports.getQuestions = async (req, res) => {
  try {
    const { type, difficulty, role, category, limit = 20 } = req.query;
    
    const filter = { isActive: true };
    
    if (type) filter.type = type;
    if (difficulty) filter.difficulty = difficulty;
    if (role) filter.roles = role;
    if (category) filter.category = category;
    
    const questions = await InterviewQuestion.find(filter)
      .limit(parseInt(limit))
      .select('-createdBy');
    
    res.json({
      success: true,
      count: questions.length,
      questions
    });
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get user's interview sessions
// @route   GET /api/interviews/sessions
// @access  Private
exports.getSessions = async (req, res) => {
  try {
    const sessions = await InterviewSession.find({ user: req.user.id })
      .populate('resume', 'title targetRole')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: sessions.length,
      sessions
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single interview session
// @route   GET /api/interviews/sessions/:id
// @access  Private
exports.getSession = async (req, res) => {
  try {
    const session = await InterviewSession.findById(req.params.id)
      .populate('resume', 'title targetRole contact');
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }
    
    // Check ownership
    if (session.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }
    
    res.json({
      success: true,
      session
    });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create interview session
// @route   POST /api/interviews/sessions
// @access  Private
exports.createSession = async (req, res) => {
  try {
    const { sessionType, role, industry, difficulty, totalQuestions, resumeId } = req.body;
    
    // Determine question types based on role
    const questionTypes = ['behavioral', 'situational'];
    
    if (role && (role.includes('engineer') || role.includes('developer'))) {
      questionTypes.push('technical');
    }
    
    // Build question filter
    const filter = {
      isActive: true,
      type: { $in: questionTypes }
    };
    
    if (difficulty && difficulty !== 'mixed') {
      filter.difficulty = difficulty;
    }
    
    if (role) {
      filter.roles = role;
    }
    
    // Fetch questions
    let questions = await InterviewQuestion.find(filter)
      .limit(totalQuestions || 10);
    
    // If not enough questions, add general ones
    if (questions.length < (totalQuestions || 10)) {
      const additionalQuestions = await InterviewQuestion.find({
        isActive: true,
        type: { $in: ['behavioral', 'general'] }
      }).limit((totalQuestions || 10) - questions.length);
      
      questions = [...questions, ...additionalQuestions];
    }
    
    // Shuffle questions
    questions = questions.sort(() => Math.random() - 0.5);
    
    // Create session
    const session = await InterviewSession.create({
      user: req.user.id,
      resume: resumeId,
      sessionType: sessionType || 'practice',
      role,
      industry,
      difficulty: difficulty || 'medium',
      questions: questions.map(q => ({
        question: q.question,
        type: q.type,
        difficulty: q.difficulty,
        category: q.category,
        suggestedAnswer: q.suggestedAnswer,
        starStructure: q.starExample,
        keywords: q.keywords,
        timeLimit: q.recommendedTime
      })),
      totalQuestions: questions.length,
      settings: req.body.settings || {}
    });
    
    res.status(201).json({
      success: true,
      session
    });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Start interview session
// @route   POST /api/interviews/sessions/:id/start
// @access  Private
exports.startSession = async (req, res) => {
  try {
    const session = await InterviewSession.findById(req.params.id);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }
    
    // Check ownership
    if (session.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }
    
    session.status = 'in-progress';
    session.startedAt = new Date();
    session.currentQuestionIndex = 0;
    
    await session.save();
    
    res.json({
      success: true,
      session,
      currentQuestion: session.questions[0]
    });
  } catch (error) {
    console.error('Start session error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Submit answer
// @route   POST /api/interviews/sessions/:id/answer
// @access  Private
exports.submitAnswer = async (req, res) => {
  try {
    const session = await InterviewSession.findById(req.params.id);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }
    
    // Check ownership
    if (session.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }
    
    const { answer, audioUrl, videoUrl, duration } = req.body;
    const currentQuestion = session.questions[session.currentQuestionIndex];
    
    if (!currentQuestion) {
      return res.status(400).json({
        success: false,
        message: 'No current question'
      });
    }
    
    // Generate AI feedback
    const feedback = generateFeedback(answer, currentQuestion);
    
    // Create answer object
    const answerData = {
      questionId: currentQuestion._id,
      question: currentQuestion.question,
      answer,
      audioUrl,
      videoUrl,
      duration,
      startTime: new Date(Date.now() - (duration * 1000)),
      endTime: new Date(),
      feedback,
      wordCount: answer.split(/\s+/).length,
      fillerWords: countFillerWords(answer),
      speakingPace: answer.split(/\s+/).length / (duration / 60)
    };
    
    // Add answer to session
    session.submitAnswer(answerData);
    await session.save();
    
    // Get next question if available
    const nextQuestion = session.getNextQuestion();
    
    res.json({
      success: true,
      feedback,
      nextQuestion,
      progress: {
        current: session.currentQuestionIndex,
        total: session.totalQuestions
      },
      isCompleted: session.status === 'completed',
      overallScore: session.overallScore,
      improvementPlan: session.aiAnalysis.improvementPlan
    });
  } catch (error) {
    console.error('Submit answer error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Complete interview session
// @route   POST /api/interviews/sessions/:id/complete
// @access  Private
exports.completeSession = async (req, res) => {
  try {
    const session = await InterviewSession.findById(req.params.id);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }
    
    // Check ownership
    if (session.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }
    
    session.status = 'completed';
    session.completedAt = new Date();
    session.totalDuration = Math.floor((session.completedAt - session.startedAt) / 1000);
    
    // Calculate final scores
    session.calculateOverallScore();
    session.generateImprovementPlan();
    
    // Calculate performance metrics
    const answers = session.answers;
    
    if (answers.length > 0) {
      const technicalAnswers = answers.filter(a => 
        session.questions.find(q => q._id.toString() === a.questionId.toString())?.type === 'technical'
      );
      
      const behavioralAnswers = answers.filter(a => 
        session.questions.find(q => q._id.toString() === a.questionId.toString())?.type === 'behavioral'
      );
      
      session.performanceMetrics = {
        averageScore: session.overallScore,
        technicalScore: technicalAnswers.length > 0 
          ? technicalAnswers.reduce((sum, a) => sum + (a.feedback?.score || 0), 0) / technicalAnswers.length 
          : 0,
        behavioralScore: behavioralAnswers.length > 0
          ? behavioralAnswers.reduce((sum, a) => sum + (a.feedback?.score || 0), 0) / behavioralAnswers.length
          : 0,
        communicationScore: answers.reduce((sum, a) => sum + (a.feedback?.clarity || 0), 0) / answers.length,
        confidenceLevel: answers.reduce((sum, a) => sum + (a.feedback?.confidence || 0), 0) / answers.length,
        responseQuality: answers.reduce((sum, a) => sum + (a.feedback?.relevance || 0), 0) / answers.length
      };
    }
    
    await session.save();
    
    res.json({
      success: true,
      session,
      summary: {
        totalQuestions: session.totalQuestions,
        answered: session.answers.length,
        overallScore: session.overallScore,
        duration: session.totalDuration,
        performanceMetrics: session.performanceMetrics,
        improvementPlan: session.aiAnalysis.improvementPlan
      }
    });
  } catch (error) {
    console.error('Complete session error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get session analytics
// @route   GET /api/interviews/analytics
// @access  Private
exports.getAnalytics = async (req, res) => {
  try {
    const sessions = await InterviewSession.find({
      user: req.user.id,
      status: 'completed'
    });
    
    if (sessions.length === 0) {
      return res.json({
        success: true,
        analytics: {
          totalSessions: 0,
          averageScore: 0,
          improvement: 0,
          strongAreas: [],
          weakAreas: []
        }
      });
    }
    
    // Calculate analytics
    const totalSessions = sessions.length;
    const averageScore = sessions.reduce((sum, s) => sum + (s.overallScore || 0), 0) / totalSessions;
    
    // Calculate improvement (compare last 5 to first 5)
    const recentSessions = sessions.slice(0, Math.min(5, sessions.length));
    const oldSessions = sessions.slice(-Math.min(5, sessions.length));
    
    const recentAvg = recentSessions.reduce((sum, s) => sum + (s.overallScore || 0), 0) / recentSessions.length;
    const oldAvg = oldSessions.reduce((sum, s) => sum + (s.overallScore || 0), 0) / oldSessions.length;
    const improvement = recentAvg - oldAvg;
    
    // Identify strong and weak areas
    const categoryScores = {};
    
    sessions.forEach(session => {
      session.answers.forEach(answer => {
        const question = session.questions.find(q => q._id.toString() === answer.questionId.toString());
        if (question && answer.feedback?.score) {
          if (!categoryScores[question.category]) {
            categoryScores[question.category] = [];
          }
          categoryScores[question.category].push(answer.feedback.score);
        }
      });
    });
    
    const categoryAverages = Object.entries(categoryScores).map(([category, scores]) => ({
      category,
      average: scores.reduce((sum, s) => sum + s, 0) / scores.length
    })).sort((a, b) => b.average - a.average);
    
    const strongAreas = categoryAverages.slice(0, 3).map(c => c.category);
    const weakAreas = categoryAverages.slice(-3).reverse().map(c => c.category);
    
    res.json({
      success: true,
      analytics: {
        totalSessions,
        averageScore: Math.round(averageScore),
        improvement: Math.round(improvement),
        strongAreas,
        weakAreas,
        recentPerformance: recentSessions.map(s => ({
          date: s.completedAt,
          score: s.overallScore
        })),
        categoryBreakdown: categoryAverages
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Helper function to generate AI feedback
function generateFeedback(answer, question) {
  const feedback = {
    score: 0,
    strengths: [],
    improvements: [],
    starAnalysis: {
      hasSituation: false,
      hasTask: false,
      hasAction: false,
      hasResult: false,
      score: 0
    },
    clarity: 0,
    confidence: 0,
    relevance: 0,
    detailedFeedback: ''
  };
  
  const answerLower = answer.toLowerCase();
  const wordCount = answer.split(/\s+/).length;
  
  // Check length
  if (wordCount >= 50 && wordCount <= 300) {
    feedback.score += 20;
    feedback.strengths.push('Good answer length');
  } else if (wordCount < 50) {
    feedback.improvements.push('Provide more details in your answer');
    feedback.score += 10;
  } else {
    feedback.improvements.push('Try to be more concise');
    feedback.score += 15;
  }
  
  // STAR structure analysis (for behavioral questions)
  if (question.type === 'behavioral' || question.type === 'situational') {
    const starKeywords = {
      situation: ['situation', 'context', 'background', 'when', 'where'],
      task: ['task', 'goal', 'objective', 'challenge', 'problem', 'needed to'],
      action: ['i', 'action', 'did', 'implemented', 'developed', 'created', 'led'],
      result: ['result', 'outcome', 'achieved', 'improved', 'increased', 'decreased', '%']
    };
    
    feedback.starAnalysis.hasSituation = starKeywords.situation.some(kw => answerLower.includes(kw));
    feedback.starAnalysis.hasTask = starKeywords.task.some(kw => answerLower.includes(kw));
    feedback.starAnalysis.hasAction = starKeywords.action.some(kw => answerLower.includes(kw));
    feedback.starAnalysis.hasResult = starKeywords.result.some(kw => answerLower.includes(kw));
    
    const starComponents = [
      feedback.starAnalysis.hasSituation,
      feedback.starAnalysis.hasTask,
      feedback.starAnalysis.hasAction,
      feedback.starAnalysis.hasResult
    ].filter(Boolean).length;
    
    feedback.starAnalysis.score = (starComponents / 4) * 100;
    feedback.score += feedback.starAnalysis.score * 0.3;
    
    if (starComponents === 4) {
      feedback.strengths.push('Complete STAR structure');
    } else {
      const missing = [];
      if (!feedback.starAnalysis.hasSituation) missing.push('Situation');
      if (!feedback.starAnalysis.hasTask) missing.push('Task');
      if (!feedback.starAnalysis.hasAction) missing.push('Action');
      if (!feedback.starAnalysis.hasResult) missing.push('Result');
      feedback.improvements.push(`Include ${missing.join(', ')} in your answer`);
    }
  } else {
    feedback.score += 20; // Technical questions get base points
  }
  
  // Check for metrics/numbers
  if (/\d+%|\d+x|\$\d+|\d+ (users|customers|people|projects)/.test(answer)) {
    feedback.score += 15;
    feedback.strengths.push('Included quantifiable metrics');
  } else if (question.type === 'behavioral') {
    feedback.improvements.push('Add specific numbers and metrics to demonstrate impact');
  }
  
  // Clarity (check for filler words)
  const fillerWords = countFillerWords(answer);
  if (fillerWords < wordCount * 0.05) {
    feedback.clarity = 85 + Math.random() * 15;
    feedback.strengths.push('Clear and articulate communication');
  } else {
    feedback.clarity = 60 + Math.random() * 20;
    feedback.improvements.push('Reduce filler words (um, uh, like, you know)');
  }
  
  // Confidence (simulated based on answer structure)
  feedback.confidence = answer.includes('I ') ? 75 + Math.random() * 20 : 60 + Math.random() * 15;
  
  // Relevance (check for keywords)
  const keywords = question.keywords || [];
  const keywordMatches = keywords.filter(kw => answerLower.includes(kw.toLowerCase())).length;
  feedback.relevance = Math.min(100, (keywordMatches / Math.max(keywords.length, 1)) * 100 + 50);
  
  if (keywordMatches > 0) {
    feedback.score += 15;
    feedback.strengths.push('Answer addressed key topics');
  }
  
  // Cap score at 100
  feedback.score = Math.min(100, Math.round(feedback.score));
  
  // Generate detailed feedback
  feedback.detailedFeedback = `Your answer scored ${feedback.score}/100. ${
    feedback.strengths.length > 0 ? feedback.strengths.join('. ') + '. ' : ''
  }${
    feedback.improvements.length > 0 ? 'To improve: ' + feedback.improvements.join('; ') + '.' : ''
  }`;
  
  return feedback;
}

// Helper function to count filler words
function countFillerWords(text) {
  const fillerWords = ['um', 'uh', 'like', 'you know', 'basically', 'actually', 'literally', 'just', 'so'];
  const textLower = text.toLowerCase();
  
  return fillerWords.reduce((count, word) => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = textLower.match(regex);
    return count + (matches ? matches.length : 0);
  }, 0);
}

module.exports = exports;
