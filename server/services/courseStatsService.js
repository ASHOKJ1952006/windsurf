const User = require('../models/User');
const Enrollment = require('../models/Enrollment');

/**
 * Course Statistics Service
 * Handles updating user course statistics across the system
 */

/**
 * Update user's course statistics
 * @param {String} userId - User ID
 * @returns {Object} Updated statistics
 */
const updateUserCourseStats = async (userId) => {
  try {
    // Get all enrollments for the user (excluding dropped)
    const enrollments = await Enrollment.find({ 
      student: userId,
      status: { $ne: 'dropped' }
    });

    const stats = {
      enrolledCourses: enrollments.length,
      completedCourses: enrollments.filter(e => e.isCompleted).length,
      inProgressCourses: enrollments.filter(e => !e.isCompleted).length,
      totalLearningTime: enrollments.reduce((sum, e) => sum + (e.timeSpent || 0), 0)
    };

    // Update user document
    await User.findByIdAndUpdate(userId, stats);

    return stats;
  } catch (error) {
    console.error('Error updating user course stats:', error);
    throw error;
  }
};

/**
 * Handle enrollment event
 * @param {String} userId - User ID
 * @param {String} courseId - Course ID
 */
const handleEnrollment = async (userId, courseId) => {
  try {
    await updateUserCourseStats(userId);
    
    // Emit real-time update if socket.io is available
    if (global.io) {
      const stats = await getUserStats(userId);
      global.io.to(`user_${userId}`).emit('courseStatsUpdate', stats);
    }
  } catch (error) {
    console.error('Error handling enrollment:', error);
  }
};

/**
 * Handle unenrollment event
 * @param {String} userId - User ID
 * @param {String} courseId - Course ID
 */
const handleUnenrollment = async (userId, courseId) => {
  try {
    await updateUserCourseStats(userId);
    
    // Emit real-time update
    if (global.io) {
      const stats = await getUserStats(userId);
      global.io.to(`user_${userId}`).emit('courseStatsUpdate', stats);
    }
  } catch (error) {
    console.error('Error handling unenrollment:', error);
  }
};

/**
 * Handle course completion event
 * @param {String} userId - User ID
 * @param {String} courseId - Course ID
 */
const handleCourseCompletion = async (userId, courseId) => {
  try {
    await updateUserCourseStats(userId);
    
    // Award completion badge if first course
    const user = await User.findById(userId);
    if (user.completedCourses === 1) {
      const hasFirstCourseBadge = user.badges.some(b => b.name === 'First Course Complete');
      if (!hasFirstCourseBadge) {
        user.badges.push({
          name: 'First Course Complete',
          icon: '🎯',
          earnedAt: new Date()
        });
        await user.save();
      }
    }
    
    // Award milestone badges
    const milestones = [5, 10, 25, 50, 100];
    for (const milestone of milestones) {
      if (user.completedCourses === milestone) {
        const badgeName = `${milestone} Courses Complete`;
        const hasBadge = user.badges.some(b => b.name === badgeName);
        if (!hasBadge) {
          user.badges.push({
            name: badgeName,
            icon: milestone >= 50 ? '🏆' : milestone >= 25 ? '🥇' : milestone >= 10 ? '🥈' : '🥉',
            earnedAt: new Date()
          });
          await user.save();
        }
      }
    }
    
    // Emit real-time update
    if (global.io) {
      const stats = await getUserStats(userId);
      global.io.to(`user_${userId}`).emit('courseStatsUpdate', stats);
      global.io.to(`user_${userId}`).emit('courseCompleted', { courseId, stats });
    }
  } catch (error) {
    console.error('Error handling course completion:', error);
  }
};

/**
 * Get comprehensive user statistics
 * @param {String} userId - User ID
 * @returns {Object} User statistics
 */
const getUserStats = async (userId) => {
  try {
    const user = await User.findById(userId).select('xp level badges totalLearningTime');
    
    // Get all active enrollments (excluding dropped)
    const enrollments = await Enrollment.find({ 
      student: userId,
      status: { $ne: 'dropped' }
    }).populate('course');

    // Calculate completion percentage for each enrollment before computing stats
    for (const enrollment of enrollments) {
      if (enrollment.course) {
        await enrollment.calculateCompletion();
      }
    }
    
    // Save updated completion percentages
    await Promise.all(enrollments.map(e => e.save()));

    // Calculate real-time statistics from actual enrollments
    const completedCourses = enrollments.filter(e => e.isCompleted || e.status === 'completed').length;
    const inProgressCourses = enrollments.filter(e => !e.isCompleted && e.status === 'active').length;
    const totalLearningTime = enrollments.reduce((sum, e) => sum + (e.timeSpent || 0), 0);

    // Calculate average progress across all active enrollments
    const averageProgress = enrollments.length > 0 
      ? Math.round(enrollments.reduce((sum, e) => sum + (e.completionPercentage || 0), 0) / enrollments.length)
      : 0;

    return {
      enrolledCourses: enrollments.length,
      completedCourses,
      inProgressCourses,
      totalLearningTime,
      averageProgress,
      xp: user.xp || 0,
      level: user.level || 1,
      badges: user.badges || [],
      recentEnrollments: enrollments.slice(0, 5).map(e => ({
        courseId: e.course?._id || e.course,
        enrolledAt: e.enrolledAt,
        completionPercentage: e.completionPercentage || 0,
        isCompleted: e.isCompleted
      }))
    };
  } catch (error) {
    console.error('Error getting user stats:', error);
    throw error;
  }
};

/**
 * Update progress tracking
 * @param {String} userId - User ID
 * @param {Number} timeSpent - Time spent in minutes
 */
const updateLearningTime = async (userId, timeSpent) => {
  try {
    await User.findByIdAndUpdate(userId, {
      $inc: { totalLearningTime: timeSpent }
    });
    
    // Emit real-time update
    if (global.io) {
      const stats = await getUserStats(userId);
      global.io.to(`user_${userId}`).emit('learningTimeUpdate', { timeSpent, totalTime: stats.totalLearningTime });
    }
  } catch (error) {
    console.error('Error updating learning time:', error);
  }
};

/**
 * Get leaderboard data
 * @param {String} type - Type of leaderboard (xp, courses, time)
 * @param {Number} limit - Number of users to return
 * @returns {Array} Leaderboard data
 */
const getLeaderboard = async (type = 'xp', limit = 10) => {
  try {
    let sortField;
    switch (type) {
      case 'courses':
        sortField = { completedCourses: -1 };
        break;
      case 'time':
        sortField = { totalLearningTime: -1 };
        break;
      default:
        sortField = { xp: -1 };
    }

    const users = await User.find({ role: 'student' })
      .select('name profilePicture xp completedCourses totalLearningTime level')
      .sort(sortField)
      .limit(limit);

    return users.map((user, index) => ({
      rank: index + 1,
      name: user.name,
      profilePicture: user.profilePicture,
      xp: user.xp,
      completedCourses: user.completedCourses,
      totalLearningTime: user.totalLearningTime,
      level: user.level
    }));
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    throw error;
  }
};

module.exports = {
  updateUserCourseStats,
  handleEnrollment,
  handleUnenrollment,
  handleCourseCompletion,
  getUserStats,
  updateLearningTime,
  getLeaderboard
};
