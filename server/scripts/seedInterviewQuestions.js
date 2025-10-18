require('dotenv').config();
const mongoose = require('mongoose');
const InterviewQuestion = require('../models/InterviewQuestion');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const interviewQuestions = [
  // Behavioral Questions
  {
    question: 'Tell me about yourself and your background.',
    type: 'behavioral',
    difficulty: 'easy',
    category: 'general',
    roles: ['general'],
    suggestedAnswer: 'Start with your current role, highlight 2-3 key achievements, mention your education, and end with why you\'re interested in this position.',
    starExample: {
      situation: 'Currently working as a Software Engineer at XYZ Company',
      task: 'Responsible for developing scalable web applications',
      action: 'Led a team of 3 developers to rebuild our main platform',
      result: 'Increased performance by 40% and reduced load time by 2 seconds'
    },
    answerGuidelines: [
      'Keep it under 2 minutes',
      'Focus on relevant experience',
      'End with why you\'re interested in the role'
    ],
    keyPoints: ['current role', 'achievements', 'relevant skills'],
    keywords: ['experience', 'achievements', 'skills', 'background'],
    recommendedTime: 120
  },
  {
    question: 'Describe a time when you faced a challenging problem at work. How did you solve it?',
    type: 'behavioral',
    difficulty: 'medium',
    category: 'problem-solving',
    roles: ['general'],
    suggestedAnswer: 'Use the STAR method to structure your answer',
    starExample: {
      situation: 'Our production database was experiencing frequent timeouts',
      task: 'Needed to identify and fix the issue without downtime',
      action: 'Analyzed query patterns, identified slow queries, implemented caching, and optimized indexes',
      result: 'Reduced query time by 70% and eliminated timeouts'
    },
    answerGuidelines: [
      'Use STAR method',
      'Include specific metrics',
      'Show your problem-solving process'
    ],
    keyPoints: ['problem identification', 'solution', 'results'],
    keywords: ['challenge', 'problem-solving', 'solution', 'results'],
    recommendedTime: 150
  },
  {
    question: 'Tell me about a time when you had to work with a difficult team member.',
    type: 'behavioral',
    difficulty: 'medium',
    category: 'teamwork',
    roles: ['general'],
    suggestedAnswer: 'Focus on how you handled the situation professionally and the positive outcome',
    starExample: {
      situation: 'Working with a team member who consistently missed deadlines',
      task: 'Project was at risk due to delays',
      action: 'Had a one-on-one conversation to understand blockers, offered help, set clear expectations',
      result: 'Team member improved performance, project completed on time'
    },
    answerGuidelines: [
      'Stay professional',
      'Focus on resolution, not the conflict',
      'Show empathy and communication skills'
    ],
    keyPoints: ['conflict resolution', 'communication', 'teamwork'],
    keywords: ['teamwork', 'conflict', 'communication', 'resolution'],
    recommendedTime: 150
  },
  {
    question: 'Describe a situation where you showed leadership.',
    type: 'behavioral',
    difficulty: 'medium',
    category: 'leadership',
    roles: ['general'],
    suggestedAnswer: 'Highlight a specific instance where you took initiative and led others to success',
    starExample: {
      situation: 'Team was struggling with unclear project requirements',
      task: 'Needed to clarify scope and keep project on track',
      action: 'Organized stakeholder meetings, created clear documentation, delegated tasks effectively',
      result: 'Project delivered 2 weeks early with 95% stakeholder satisfaction'
    },
    answerGuidelines: [
      'Show initiative',
      'Demonstrate people management',
      'Include measurable outcomes'
    ],
    keyPoints: ['initiative', 'delegation', 'results'],
    keywords: ['leadership', 'initiative', 'team', 'results'],
    recommendedTime: 150
  },
  
  // Technical Questions - Software Engineering
  {
    question: 'Explain the difference between REST and GraphQL APIs.',
    type: 'technical',
    difficulty: 'medium',
    category: 'backend',
    roles: ['software-engineer'],
    suggestedAnswer: 'REST uses multiple endpoints for different resources, while GraphQL uses a single endpoint with a query language',
    answerGuidelines: [
      'Explain both concepts clearly',
      'Mention pros and cons',
      'Provide use cases for each'
    ],
    keyPoints: ['endpoints', 'query language', 'flexibility', 'performance'],
    keywords: ['REST', 'GraphQL', 'API', 'endpoints', 'queries'],
    recommendedTime: 120
  },
  {
    question: 'What is the event loop in JavaScript? How does it work?',
    type: 'technical',
    difficulty: 'hard',
    category: 'frontend',
    roles: ['software-engineer'],
    suggestedAnswer: 'The event loop is a mechanism that handles asynchronous operations in JavaScript by managing the call stack and callback queue',
    answerGuidelines: [
      'Explain call stack',
      'Explain callback queue',
      'Describe how they interact'
    ],
    keyPoints: ['call stack', 'callback queue', 'asynchronous', 'non-blocking'],
    keywords: ['event loop', 'asynchronous', 'callback', 'stack', 'queue'],
    recommendedTime: 180
  },
  {
    question: 'How would you optimize a slow database query?',
    type: 'technical',
    difficulty: 'medium',
    category: 'databases',
    roles: ['software-engineer', 'data-scientist'],
    suggestedAnswer: 'Analyze the query execution plan, add indexes, optimize joins, and consider caching',
    answerGuidelines: [
      'Mention indexes',
      'Discuss query optimization',
      'Include monitoring tools'
    ],
    keyPoints: ['indexes', 'execution plan', 'caching', 'optimization'],
    keywords: ['database', 'query', 'optimization', 'indexes', 'performance'],
    recommendedTime: 150
  },
  {
    question: 'Explain the SOLID principles in software design.',
    type: 'technical',
    difficulty: 'hard',
    category: 'system-design',
    roles: ['software-engineer'],
    suggestedAnswer: 'SOLID stands for Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, and Dependency Inversion',
    answerGuidelines: [
      'Explain each principle',
      'Provide examples',
      'Mention benefits'
    ],
    keyPoints: ['SRP', 'OCP', 'LSP', 'ISP', 'DIP'],
    keywords: ['SOLID', 'design principles', 'software architecture'],
    recommendedTime: 180
  },
  
  // Situational Questions
  {
    question: 'What would you do if you discovered a critical bug in production right before a major release?',
    type: 'situational',
    difficulty: 'hard',
    category: 'problem-solving',
    roles: ['software-engineer'],
    suggestedAnswer: 'Assess severity, inform stakeholders, implement hotfix if critical, or schedule for next release if minor',
    answerGuidelines: [
      'Show decision-making process',
      'Prioritize user impact',
      'Demonstrate communication'
    ],
    keyPoints: ['assessment', 'communication', 'priority', 'action'],
    keywords: ['bug', 'production', 'critical', 'decision'],
    recommendedTime: 120
  },
  {
    question: 'How would you handle a situation where you disagree with your manager\'s technical decision?',
    type: 'situational',
    difficulty: 'medium',
    category: 'communication',
    roles: ['general'],
    suggestedAnswer: 'Present data-driven concerns privately, propose alternatives, but respect final decision',
    answerGuidelines: [
      'Show respect',
      'Use data to support your view',
      'Be open to different perspectives'
    ],
    keyPoints: ['communication', 'professionalism', 'data-driven'],
    keywords: ['disagree', 'manager', 'decision', 'professional'],
    recommendedTime: 120
  },
  
  // Data Science Questions
  {
    question: 'Explain the bias-variance tradeoff in machine learning.',
    type: 'technical',
    difficulty: 'hard',
    category: 'algorithms',
    roles: ['data-scientist'],
    suggestedAnswer: 'Bias is error from oversimplifying the model, variance is error from being too sensitive to training data',
    answerGuidelines: [
      'Define bias and variance',
      'Explain the tradeoff',
      'Mention how to balance them'
    ],
    keyPoints: ['bias', 'variance', 'overfitting', 'underfitting'],
    keywords: ['bias', 'variance', 'machine learning', 'model'],
    recommendedTime: 150
  },
  {
    question: 'How do you handle missing data in a dataset?',
    type: 'technical',
    difficulty: 'medium',
    category: 'algorithms',
    roles: ['data-scientist'],
    suggestedAnswer: 'Options include deletion, imputation (mean/median/mode), or using algorithms that handle missing values',
    answerGuidelines: [
      'List different approaches',
      'Explain when to use each',
      'Mention impact on analysis'
    ],
    keyPoints: ['missing data', 'imputation', 'deletion', 'impact'],
    keywords: ['missing data', 'imputation', 'dataset', 'preprocessing'],
    recommendedTime: 120
  },
  
  // Product Manager Questions
  {
    question: 'How would you prioritize features for a new product?',
    type: 'role-specific',
    difficulty: 'hard',
    category: 'product',
    roles: ['product-manager'],
    suggestedAnswer: 'Use frameworks like RICE (Reach, Impact, Confidence, Effort) or value vs effort matrix',
    answerGuidelines: [
      'Mention prioritization frameworks',
      'Consider user value',
      'Balance business goals'
    ],
    keyPoints: ['prioritization', 'user value', 'business impact', 'resources'],
    keywords: ['features', 'prioritization', 'product', 'framework'],
    recommendedTime: 150
  },
  
  // General Questions
  {
    question: 'Why do you want to work for our company?',
    type: 'behavioral',
    difficulty: 'easy',
    category: 'general',
    roles: ['general'],
    suggestedAnswer: 'Research the company and mention specific aspects that align with your goals and values',
    answerGuidelines: [
      'Research the company',
      'Mention specific initiatives',
      'Align with your goals'
    ],
    keyPoints: ['company research', 'alignment', 'enthusiasm'],
    keywords: ['company', 'motivation', 'goals', 'culture'],
    recommendedTime: 90
  },
  {
    question: 'Where do you see yourself in 5 years?',
    type: 'behavioral',
    difficulty: 'easy',
    category: 'general',
    roles: ['general'],
    suggestedAnswer: 'Focus on professional growth and how this role helps you achieve those goals',
    answerGuidelines: [
      'Show ambition',
      'Be realistic',
      'Align with company growth'
    ],
    keyPoints: ['career growth', 'skills development', 'long-term goals'],
    keywords: ['career', 'growth', 'future', 'goals'],
    recommendedTime: 90
  },
  {
    question: 'Describe your ideal work environment.',
    type: 'behavioral',
    difficulty: 'easy',
    category: 'general',
    roles: ['general'],
    suggestedAnswer: 'Mention collaboration, clear communication, growth opportunities, and balance',
    answerGuidelines: [
      'Be honest but flexible',
      'Focus on productivity factors',
      'Show adaptability'
    ],
    keyPoints: ['collaboration', 'communication', 'growth'],
    keywords: ['work environment', 'culture', 'collaboration'],
    recommendedTime: 90
  }
];

const seedQuestions = async () => {
  try {
    console.log('🗑️  Clearing existing interview questions...');
    await InterviewQuestion.deleteMany({});
    
    console.log('📝 Creating interview questions...');
    await InterviewQuestion.insertMany(interviewQuestions);
    
    console.log(`✅ Successfully seeded ${interviewQuestions.length} interview questions`);
    
    // Show summary
    const behavioral = interviewQuestions.filter(q => q.type === 'behavioral').length;
    const technical = interviewQuestions.filter(q => q.type === 'technical').length;
    const situational = interviewQuestions.filter(q => q.type === 'situational').length;
    const roleSpecific = interviewQuestions.filter(q => q.type === 'role-specific').length;
    
    console.log('\n📊 Summary:');
    console.log(`   Behavioral: ${behavioral}`);
    console.log(`   Technical: ${technical}`);
    console.log(`   Situational: ${situational}`);
    console.log(`   Role-specific: ${roleSpecific}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding questions:', error);
    process.exit(1);
  }
};

connectDB().then(seedQuestions);
