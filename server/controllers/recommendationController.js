const Course = require('../models/Course');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');

// Advanced recommendation scoring algorithm
const calculateCourseScore = (course, user, weights = {}) => {
  try {
    const {
      interestWeight = 0.4,
      skillWeight = 0.3,
      goalWeight = 0.2,
      ratingWeight = 0.05,
      popularityWeight = 0.05
    } = weights;

    let score = 0;
    const userInterests = user.interests || [];
    const userSkills = user.skills || [];
    const userGoals = user.goals || [];
    const courseTags = course.tags || [];
    const courseCategory = course.category || '';

    // Interest matching (highest weight)
    const interestMatches = courseTags.filter(tag => 
      userInterests.some(interest => 
        interest && tag && (
          interest.toLowerCase().includes(tag.toLowerCase()) || 
          tag.toLowerCase().includes(interest.toLowerCase())
        )
      )
    ).length;
    score += (interestMatches / Math.max(userInterests.length, 1)) * interestWeight;

    // Category matching with interests
    const categoryMatch = userInterests.some(interest => 
      interest && courseCategory && (
        interest.toLowerCase().includes(courseCategory.toLowerCase()) ||
        courseCategory.toLowerCase().includes(interest.toLowerCase())
      )
    );
    if (categoryMatch) score += 0.15;

    // Skill progression matching
    const skillMatches = courseTags.filter(tag => 
      userSkills.some(skill => 
        skill && tag && (
          skill.toLowerCase().includes(tag.toLowerCase()) || 
          tag.toLowerCase().includes(skill.toLowerCase())
        )
      )
    ).length;
    score += (skillMatches / Math.max(userSkills.length, 1)) * skillWeight;

    // Goal alignment
    const goalMatches = courseTags.filter(tag => 
      userGoals.some(goal => 
        goal && tag && (
          goal.toLowerCase().includes(tag.toLowerCase()) || 
          tag.toLowerCase().includes(goal.toLowerCase())
        )
      )
    ).length;
    score += (goalMatches / Math.max(userGoals.length, 1)) * goalWeight;

    // Course quality factors (with null checks)
    const rating = course.averageRating || 0;
    const enrolledCount = course.enrolledCount || 0;
    score += (rating / 5) * ratingWeight;
    score += Math.min(enrolledCount / 1000, 1) * popularityWeight;

    // Level appropriateness bonus
    const userLevel = user.level || 1;
    const courseLevel = course.level || 'beginner';
    if (courseLevel === 'beginner' && userLevel <= 2) score += 0.1;
    else if (courseLevel === 'intermediate' && userLevel >= 2 && userLevel <= 4) score += 0.1;
    else if (courseLevel === 'advanced' && userLevel >= 4) score += 0.1;

    return Math.min(Math.max(score, 0), 1); // Cap between 0 and 1
  } catch (error) {
    console.error('Error calculating course score:', error);
    return 0;
  }
};

// @desc    Get personalized recommendations
// @route   GET /api/recommendations
// @access  Private
exports.getRecommendations = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const enrollments = await Enrollment.find({ student: user._id }).select('course');
    const enrolledCourseIds = enrollments.map(e => e.course);
    const wishlistIds = user.wishlist || [];

    // Get all available courses (excluding enrolled and wishlisted)
    const allCourses = await Course.find({
      _id: { $nin: [...enrolledCourseIds, ...wishlistIds] },
      status: 'published',
      isApproved: true
    }).populate('instructor', 'name profilePicture instructorRating');

    // If user has no interests, return trending courses
    if (!user.interests || user.interests.length === 0) {
      const trending = allCourses
        .sort((a, b) => (b.averageRating * b.enrolledCount) - (a.averageRating * a.enrolledCount))
        .slice(0, 20);

      return res.json({
        success: true,
        recommendations: trending,
        message: 'Add interests to your profile for personalized recommendations',
        breakdown: { trending: trending.length }
      });
    }

    // Calculate scores for all courses
    const scoredCourses = allCourses.map(course => ({
      ...course.toObject(),
      score: calculateCourseScore(course, user),
      matchReasons: getMatchReasons(course, user)
    }));

    // Sort by score and get top recommendations
    const recommendations = scoredCourses
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);

    // Collaborative filtering for similar users
    let collaborativeRecommendations = [];
    try {
      if (user.interests && user.interests.length > 0) {
        const similarUsers = await User.find({
          _id: { $ne: user._id },
          interests: { $in: user.interests }
        }).limit(10);

        if (similarUsers.length > 0) {
          const similarUserIds = similarUsers.map(u => u._id);
          const similarEnrollments = await Enrollment.find({
            student: { $in: similarUserIds },
            course: { $nin: [...enrolledCourseIds, ...wishlistIds] }
          }).populate('course');

          const coursePopularity = {};
          similarEnrollments.forEach(enrollment => {
            if (enrollment.course && enrollment.course._id) {
              const courseId = enrollment.course._id.toString();
              coursePopularity[courseId] = (coursePopularity[courseId] || 0) + 1;
            }
          });

          collaborativeRecommendations = Object.entries(coursePopularity)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([courseId]) => {
              const enrollment = similarEnrollments.find(e => e.course && e.course._id.toString() === courseId);
              return enrollment ? enrollment.course : null;
            })
            .filter(course => course !== null);
        }
      }
    } catch (collaborativeError) {
      console.error('Collaborative filtering error:', collaborativeError);
      collaborativeRecommendations = [];
    }

    // Category-based recommendations
    let categoryRecommendations = [];
    try {
      const userCategories = [...new Set(recommendations.slice(0, 5).map(r => r.category).filter(cat => cat))];
      if (userCategories.length > 0) {
        categoryRecommendations = await Course.find({
          _id: { $nin: [...enrolledCourseIds, ...wishlistIds, ...recommendations.map(r => r._id)] },
          category: { $in: userCategories },
          status: 'published',
          isApproved: true
        })
          .populate('instructor', 'name profilePicture instructorRating')
          .sort({ averageRating: -1 })
          .limit(5);
      }
    } catch (categoryError) {
      console.error('Category recommendations error:', categoryError);
      categoryRecommendations = [];
    }

    res.json({
      success: true,
      recommendations: recommendations,
      collaborative: collaborativeRecommendations,
      categoryBased: categoryRecommendations,
      breakdown: {
        personalized: recommendations.length,
        collaborative: collaborativeRecommendations.length,
        categoryBased: categoryRecommendations.length,
        userInterests: user.interests,
        userLevel: user.level
      }
    });
  } catch (error) {
    console.error('Recommendation error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Helper function to get match reasons
const getMatchReasons = (course, user) => {
  try {
    const reasons = [];
    const courseTags = course.tags || [];
    const courseCategory = course.category || '';
    const userInterests = user.interests || [];
    const userSkills = user.skills || [];
    
    // Interest matches
    const interestMatches = courseTags.filter(tag => 
      userInterests.some(interest => 
        interest && tag && (
          interest.toLowerCase().includes(tag.toLowerCase()) || 
          tag.toLowerCase().includes(interest.toLowerCase())
        )
      )
    );
    if (interestMatches.length > 0) {
      reasons.push(`Matches your interests: ${interestMatches.join(', ')}`);
    }

    // Category match
    if (courseCategory && userInterests.some(interest => 
      interest && (
        interest.toLowerCase().includes(courseCategory.toLowerCase()) ||
        courseCategory.toLowerCase().includes(interest.toLowerCase())
      )
    )) {
      reasons.push(`${courseCategory} aligns with your interests`);
    }

    // Skill building
    const skillMatches = courseTags.filter(tag => 
      userSkills.some(skill => 
        skill && tag && (
          skill.toLowerCase().includes(tag.toLowerCase()) || 
          tag.toLowerCase().includes(skill.toLowerCase())
        )
      )
    );
    if (skillMatches.length > 0) {
      reasons.push(`Builds on your ${skillMatches.join(', ')} skills`);
    }

    // Level appropriate
    const userLevel = user.level || 1;
    const courseLevel = course.level || 'beginner';
    if (courseLevel === 'beginner' && userLevel <= 2) {
      reasons.push('Perfect for your current level');
    } else if (courseLevel === 'intermediate' && userLevel >= 2 && userLevel <= 4) {
      reasons.push('Good next step for your level');
    } else if (courseLevel === 'advanced' && userLevel >= 4) {
      reasons.push('Advanced course matching your expertise');
    }

    // High quality
    const rating = course.averageRating || 0;
    if (rating >= 4.5) {
      reasons.push('Highly rated course');
    }

    return reasons;
  } catch (error) {
    console.error('Error getting match reasons:', error);
    return [];
  }
};

// @desc    Get recommendations by specific interest
// @route   GET /api/recommendations/by-interest/:interest
// @access  Private
exports.getInterestBasedRecommendations = async (req, res) => {
  try {
    const { interest } = req.params;
    const user = await User.findById(req.user.id);
    const enrollments = await Enrollment.find({ student: user._id }).select('course');
    const enrolledCourseIds = enrollments.map(e => e.course);

    // Find courses matching the specific interest
    const courses = await Course.find({
      _id: { $nin: enrolledCourseIds },
      status: 'published',
      isApproved: true,
      $or: [
        { tags: { $regex: interest, $options: 'i' } },
        { category: { $regex: interest, $options: 'i' } },
        { title: { $regex: interest, $options: 'i' } }
      ]
    })
      .populate('instructor', 'name profilePicture instructorRating')
      .sort({ averageRating: -1, enrolledCount: -1 })
      .limit(15);

    res.json({
      success: true,
      recommendations: courses,
      interest: interest,
      count: courses.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get similar courses to a specific course
// @route   GET /api/recommendations/similar/:courseId
// @access  Private
exports.getSimilarCourses = async (req, res) => {
  try {
    const { courseId } = req.params;
    const user = await User.findById(req.user.id);
    const enrollments = await Enrollment.find({ student: user._id }).select('course');
    const enrolledCourseIds = enrollments.map(e => e.course);

    // Get the reference course
    const referenceCourse = await Course.findById(courseId);
    if (!referenceCourse) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Find similar courses based on tags and category
    const similarCourses = await Course.find({
      _id: { $nin: [courseId, ...enrolledCourseIds] },
      status: 'published',
      isApproved: true,
      $or: [
        { category: referenceCourse.category },
        { tags: { $in: referenceCourse.tags } }
      ]
    })
      .populate('instructor', 'name profilePicture instructorRating')
      .limit(10);

    // Score similar courses based on tag overlap
    const scoredCourses = similarCourses.map(course => {
      const tagOverlap = course.tags.filter(tag => 
        referenceCourse.tags.some(refTag => 
          refTag.toLowerCase() === tag.toLowerCase()
        )
      ).length;
      
      const categoryMatch = course.category === referenceCourse.category ? 1 : 0;
      const score = (tagOverlap * 0.7) + (categoryMatch * 0.3);
      
      return { ...course.toObject(), similarityScore: score };
    });

    // Sort by similarity score
    const recommendations = scoredCourses
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, 8);

    res.json({
      success: true,
      recommendations: recommendations,
      referenceCourse: {
        title: referenceCourse.title,
        category: referenceCourse.category,
        tags: referenceCourse.tags
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get recommendations by category
// @route   GET /api/recommendations/category/:category
// @access  Private
exports.getRecommendationsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const user = await User.findById(req.user.id);
    const enrollments = await Enrollment.find({ student: user._id }).select('course');
    const enrolledCourseIds = enrollments.map(e => e.course);

    // Get courses in the specified category
    const courses = await Course.find({
      _id: { $nin: enrolledCourseIds },
      status: 'published',
      isApproved: true,
      category: { $regex: category, $options: 'i' }
    })
      .populate('instructor', 'name profilePicture instructorRating')
      .sort({ averageRating: -1, enrolledCount: -1 })
      .limit(20);

    // Separate by difficulty level
    const beginner = courses.filter(c => c.level === 'beginner');
    const intermediate = courses.filter(c => c.level === 'intermediate');
    const advanced = courses.filter(c => c.level === 'advanced');

    res.json({
      success: true,
      category: category,
      recommendations: {
        all: courses,
        beginner: beginner,
        intermediate: intermediate,
        advanced: advanced
      },
      count: {
        total: courses.length,
        beginner: beginner.length,
        intermediate: intermediate.length,
        advanced: advanced.length
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get learning paths
// @route   GET /api/recommendations/learning-paths
// @access  Private
exports.getLearningPaths = async (req, res) => {
  try {
    const paths = [
      {
        name: 'Full Stack Developer',
        description: 'Become a complete web developer',
        skills: ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'MongoDB'],
        estimatedDuration: '6 months',
        difficulty: 'intermediate'
      },
      {
        name: 'Data Scientist',
        description: 'Master data analysis and machine learning',
        skills: ['Python', 'Statistics', 'Machine Learning', 'Data Visualization'],
        estimatedDuration: '8 months',
        difficulty: 'advanced'
      },
      {
        name: 'Mobile Developer',
        description: 'Build iOS and Android apps',
        skills: ['React Native', 'Flutter', 'Mobile UI/UX', 'API Integration'],
        estimatedDuration: '5 months',
        difficulty: 'intermediate'
      },
      {
        name: 'UI/UX Designer',
        description: 'Design beautiful user experiences',
        skills: ['Figma', 'Design Principles', 'User Research', 'Prototyping'],
        estimatedDuration: '4 months',
        difficulty: 'beginner'
      }
    ];

    // For each path, find relevant courses
    const pathsWithCourses = await Promise.all(
      paths.map(async (path) => {
        const courses = await Course.find({
          status: 'published',
          isApproved: true,
          tags: { $in: path.skills.map(s => new RegExp(s, 'i')) }
        })
          .populate('instructor', 'name profilePicture')
          .sort({ averageRating: -1 })
          .limit(5);

        return {
          ...path,
          courses
        };
      })
    );

    res.json({ success: true, learningPaths: pathsWithCourses });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
