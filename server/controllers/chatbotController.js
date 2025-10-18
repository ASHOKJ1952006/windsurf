const Course = require('../models/Course');
const User = require('../models/User');

// Simple rule-based chatbot
const faqs = [
  {
    keywords: ['login', 'sign in', 'access', 'password'],
    response: 'To login, go to the login page and enter your email and password. If you forgot your password, use the "Forgot Password" link to reset it.'
  },
  {
    keywords: ['certificate', 'certification', 'download'],
    response: 'You can download your certificate from the course page once you complete 100% of the course. Go to "My Courses" and click on the certificate icon.'
  },
  {
    keywords: ['enroll', 'join', 'register course'],
    response: 'To enroll in a course, browse the course catalog, click on a course you like, and click the "Enroll Now" button. Some courses may be premium.'
  },
  {
    keywords: ['progress', 'track', 'completion'],
    response: 'You can track your progress in the "My Courses" section. Each course shows a progress bar and percentage completed.'
  },
  {
    keywords: ['mentor', 'mentorship', 'help'],
    response: 'You can request mentorship from the Mentorship page. Browse available mentors and send a request with your preferred time and topic.'
  },
  {
    keywords: ['forum', 'question', 'ask'],
    response: 'Visit the Community Forum to ask questions, share knowledge, and connect with other learners. You can post questions, answer others, and upvote helpful content.'
  },
  {
    keywords: ['job', 'career', 'hiring'],
    response: 'Check out the Job Board to find opportunities that match your skills. You can filter by location, type, and skills.'
  },
  {
    keywords: ['xp', 'points', 'level', 'gamification'],
    response: 'You earn XP by completing lectures, quizzes, posting in forums, and helping others. XP increases your level and unlocks badges!'
  }
];

// @desc    Chat with bot
// @route   POST /api/chatbot/chat
// @access  Private
exports.chat = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const lowerMessage = message.toLowerCase();

    // Check FAQs
    for (const faq of faqs) {
      if (faq.keywords.some(keyword => lowerMessage.includes(keyword))) {
        return res.json({
          success: true,
          response: faq.response,
          type: 'faq'
        });
      }
    }

    // Course recommendation intent
    if (lowerMessage.includes('recommend') || lowerMessage.includes('suggest') || lowerMessage.includes('course')) {
      const user = await User.findById(req.user.id);
      const courses = await Course.find({
        status: 'published',
        isApproved: true,
        tags: { $in: [...user.skills, ...user.interests].map(s => new RegExp(s, 'i')) }
      })
        .populate('instructor', 'name')
        .sort({ averageRating: -1 })
        .limit(3);

      if (courses.length > 0) {
        const courseList = courses.map(c => `- ${c.title} by ${c.instructor.name}`).join('\n');
        return res.json({
          success: true,
          response: `Based on your profile, I recommend these courses:\n${courseList}\n\nVisit the Recommendations page for more personalized suggestions!`,
          type: 'recommendation',
          courses
        });
      }
    }

    // Default response
    res.json({
      success: true,
      response: "I'm here to help! You can ask me about:\n- Login and account issues\n- Course enrollment\n- Certificates\n- Progress tracking\n- Mentorship\n- Forums\n- Jobs\n- XP and gamification\n\nOr visit the Forum for community support!",
      type: 'default'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
