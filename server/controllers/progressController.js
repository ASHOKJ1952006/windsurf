const Progress = require('../models/Progress');
const Course = require('../models/Course');
const Certificate = require('../models/Certificate');
const User = require('../models/User');

// @desc    Get student progress for a course
// @route   GET /api/progress/:courseId
// @access  Private
exports.getCourseProgress = async (req, res) => {
  try {
    console.log('=== Get Course Progress ===');
    const { courseId } = req.params;
    const studentId = req.user.id;
    
    console.log('Course ID:', courseId);
    console.log('Student ID:', studentId);

    // Validate courseId format
    if (!courseId.match(/^[0-9a-fA-F]{24}$/)) {
      console.error('Invalid courseId format:', courseId);
      return res.status(400).json({ 
        success: false,
        message: 'Invalid course ID format' 
      });
    }

    let progress = await Progress.findOne({
      student: studentId,
      course: courseId
    }).populate('course', 'title modules finalTest certificate');

    console.log('Progress found:', !!progress);

    if (!progress) {
      // Create initial progress record
      const course = await Course.findById(courseId);
      if (!course) {
        console.error('Course not found:', courseId);
        return res.status(404).json({ 
          success: false,
          message: 'Course not found' 
        });
      }

      console.log('Creating new progress for course:', course.title);

      progress = new Progress({
        student: studentId,
        course: courseId,
        modules: course.modules.map((module, moduleIndex) => ({
          moduleId: module._id,
          moduleIndex: moduleIndex,
          isUnlocked: moduleIndex === 0, // First module is unlocked by default
          unlockedAt: moduleIndex === 0 ? new Date() : null,
          lectures: module.lectures.map((lecture, lectureIndex) => ({
            lectureId: lecture._id,
            lectureIndex: lectureIndex,
            completed: false,
            watchedPercentage: 0
          }))
        }))
      });

      await progress.save();
      console.log('Progress created successfully');
    }

    res.json({
      success: true,
      progress
    });
  } catch (error) {
    console.error('❌ Get progress error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false,
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// @desc    Update lecture progress
// @route   PUT /api/progress/:courseId/lecture
// @access  Private
exports.updateLectureProgress = async (req, res) => {
  try {
    console.log('=== Update Lecture Progress ===');
    const { courseId } = req.params;
    const { moduleIndex, lectureIndex, completed, watchedPercentage } = req.body;
    const studentId = req.user.id;
    
    console.log('Request:', { courseId, moduleIndex, lectureIndex, completed, watchedPercentage, studentId });

    let progress = await Progress.findOne({
      student: studentId,
      course: courseId
    });

    if (!progress) {
      console.error('Progress record not found');
      return res.status(404).json({ 
        success: false,
        message: 'Progress record not found. Please enroll in the course first.' 
      });
    }

    const moduleProgress = progress.modules[moduleIndex];
    if (!moduleProgress) {
      console.error('Invalid module index:', moduleIndex);
      return res.status(400).json({ 
        success: false,
        message: 'Invalid module index' 
      });
    }

    let lectureProgress = moduleProgress.lectures.find(l => l.lectureIndex === lectureIndex);
    
    if (!lectureProgress) {
      console.log('Creating new lecture progress entry');
      // Get lectureId from the course
      const course = await Course.findById(courseId);
      const lecture = course.modules[moduleIndex]?.lectures[lectureIndex];
      
      if (!lecture) {
        console.error('Lecture not found in course');
        return res.status(400).json({ 
          success: false,
          message: 'Lecture not found' 
        });
      }
      
      // Create new lecture progress with lectureId
      const newLectureProgress = {
        lectureIndex,
        lectureId: lecture._id,
        completed: false,
        watchedPercentage: 0,
        timeSpent: 0
      };
      moduleProgress.lectures.push(newLectureProgress);
      lectureProgress = moduleProgress.lectures[moduleProgress.lectures.length - 1];
    }

    // Update lecture progress
    if (completed !== undefined) lectureProgress.completed = completed;
    if (watchedPercentage !== undefined) lectureProgress.watchedPercentage = watchedPercentage;
    if (completed) lectureProgress.completedAt = new Date();

    console.log('Lecture progress updated:', {
      completed: lectureProgress.completed,
      watchedPercentage: lectureProgress.watchedPercentage
    });

    // Update module progress
    const completedLectures = moduleProgress.lectures.filter(l => l.completed).length;
    const totalLectures = moduleProgress.lectures.length;
    moduleProgress.completionPercentage = Math.round((completedLectures / totalLectures) * 100);

    console.log('Module progress:', {
      completedLectures,
      totalLectures,
      percentage: moduleProgress.completionPercentage
    });

    // Check if module is completed
    if (moduleProgress.completionPercentage === 100 && !moduleProgress.completed) {
      moduleProgress.completed = true;
      moduleProgress.completedAt = new Date();
      console.log('✅ Module completed!');
      
      // Unlock next module
      if (moduleIndex + 1 < progress.modules.length) {
        const nextModule = progress.modules[moduleIndex + 1];
        if (!nextModule.isUnlocked) {
          nextModule.isUnlocked = true;
          nextModule.unlockedAt = new Date();
          console.log('🔓 Next module unlocked');
        }
      }
    }

    // Update overall progress
    progress.updateProgress();
    progress.lastAccessedAt = new Date();
    
    await progress.save();

    // Award XP for completion
    if (completed) {
      const user = await User.findById(studentId);
      user.xp += 5;
      user.updateStreak();
      await user.save();
    }

    res.json({
      success: true,
      progress
    });
  } catch (error) {
    console.error('Update lecture progress error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Submit quiz answers
// @route   PUT /api/progress/:courseId/quiz
// @access  Private
exports.submitQuiz = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { moduleIndex, lectureIndex, score, percentage, passed, answers } = req.body;
    const studentId = req.user.id;

    let progress = await Progress.findOne({
      student: studentId,
      course: courseId
    });

    if (!progress) {
      return res.status(404).json({ message: 'Progress record not found' });
    }

    const moduleProgress = progress.modules[moduleIndex];
    if (!moduleProgress) {
      return res.status(400).json({ message: 'Invalid module index' });
    }

    let lectureProgress = moduleProgress.lectures.find(l => l.lectureIndex === lectureIndex);
    
    if (!lectureProgress) {
      lectureProgress = {
        lectureIndex,
        completed: false,
        watchedPercentage: 0,
        timeSpent: 0
      };
      moduleProgress.lectures.push(lectureProgress);
    }

    // Update quiz results
    lectureProgress.score = score;
    lectureProgress.attempts = (lectureProgress.attempts || 0) + 1;
    
    if (passed) {
      lectureProgress.completed = true;
      lectureProgress.completedAt = new Date();
    }

    // Update module progress
    const completedLectures = moduleProgress.lectures.filter(l => l.completed).length;
    const totalLectures = moduleProgress.lectures.length;
    moduleProgress.completionPercentage = Math.round((completedLectures / totalLectures) * 100);

    // Check if module is completed
    if (moduleProgress.completionPercentage === 100 && !moduleProgress.completed) {
      moduleProgress.completed = true;
      moduleProgress.completedAt = new Date();
      
      // Unlock next module
      if (moduleIndex + 1 < progress.modules.length) {
        const nextModule = progress.modules[moduleIndex + 1];
        if (!nextModule.isUnlocked) {
          nextModule.isUnlocked = true;
          nextModule.unlockedAt = new Date();
        }
      }
    }

    // Update overall progress
    progress.updateProgress();
    progress.lastAccessedAt = new Date();
    
    await progress.save();

    // Award XP for passing quiz
    if (passed) {
      const user = await User.findById(studentId);
      user.xp += 10;
      await user.save();
    }

    // Check if course is completed
    if (progress.isCompleted) {
      // Update course completion count
      const course = await Course.findById(courseId);
      course.completionCount += 1;
      await course.save();

      // Award completion XP
      const user = await User.findById(studentId);
      user.xp += 50;
      await user.save();
    }

    res.json({
      success: true,
      progress,
      quizResult: {
        score,
        percentage,
        passed
      }
    });
  } catch (error) {
    console.error('Submit quiz error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Generate course completion certificate
// @route   POST /api/progress/:courseId/certificate
// @access  Private
exports.generateCertificate = async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user.id;

    const progress = await Progress.findOne({
      student: studentId,
      course: courseId
    }).populate('course').populate('student', 'name');

    if (!progress) {
      return res.status(404).json({ 
        success: false,
        message: 'Progress record not found' 
      });
    }

    if (!progress.isCompleted) {
      return res.status(400).json({ 
        success: false,
        message: 'Course not completed yet' 
      });
    }

    // Check if certificate already exists
    const existingCertificate = await Certificate.findOne({
      student: studentId,
      course: courseId
    });

    if (existingCertificate) {
      return res.json({
        success: true,
        certificate: existingCertificate,
        certificateUrl: existingCertificate.shareableUrl,
        message: 'Certificate already exists'
      });
    }

    // Generate new certificate using the helper function
    const certificate = await generateCertificate(progress, progress.course, progress.overallProgress || 100);

    // Award certificate badge
    const user = await User.findById(studentId);
    const hasCertificateBadge = user.badges.some(b => b.name === 'Certificate Earner');
    if (!hasCertificateBadge) {
      user.badges.push({
        name: 'Certificate Earner',
        icon: '🏆',
        earnedAt: new Date()
      });
      user.xp += 100; // Bonus XP for first certificate
      await user.save();
    }

    res.json({
      success: true,
      certificate,
      certificateUrl: certificate.shareableUrl,
      message: 'Certificate generated successfully'
    });
  } catch (error) {
    console.error('Generate certificate error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};


// @desc    Submit quiz/assignment
// @route   POST /api/progress/:courseId/lecture/:lectureId/submit
// @access  Private
exports.submitLectureAssignment = async (req, res) => {
  try {
    const { courseId, lectureId } = req.params;
    const { answers, submissionText, submissionUrl, timeSpent } = req.body;
    const studentId = req.user.id;

    const progress = await Progress.findOne({
      student: studentId,
      course: courseId
    });

    if (!progress) {
      return res.status(404).json({ message: 'Progress record not found' });
    }

    // Find the lecture in course to get correct answers
    const course = await Course.findById(courseId);
    let targetLecture = null;
    
    for (const module of course.modules) {
      const lecture = module.lectures.find(l => l._id.toString() === lectureId);
      if (lecture) {
        targetLecture = lecture;
        break;
      }
    }

    if (!targetLecture) {
      return res.status(404).json({ message: 'Lecture not found' });
    }

    // Find progress lecture
    let progressLecture = null;
    for (const module of progress.modules) {
      const lecture = module.lectures.find(l => l.lectureId.toString() === lectureId);
      if (lecture) {
        progressLecture = lecture;
        break;
      }
    }

    if (!progressLecture) {
      return res.status(404).json({ message: 'Progress lecture not found' });
    }

    progressLecture.attempts = (progressLecture.attempts || 0) + 1;
    progressLecture.submittedAt = new Date();
    
    if (submissionText) progressLecture.submissionText = submissionText;
    if (submissionUrl) progressLecture.submissionUrl = submissionUrl;
    if (timeSpent) {
      progressLecture.timeSpent = (progressLecture.timeSpent || 0) + timeSpent;
      progress.totalTimeSpent = (progress.totalTimeSpent || 0) + timeSpent;
    }

    // Auto-grade quiz if it has answers
    if (targetLecture.type === 'quiz' && targetLecture.quiz && answers) {
      let correctAnswers = 0;
      let totalPoints = 0;
      let earnedPoints = 0;

      targetLecture.quiz.questions.forEach((question, index) => {
        const userAnswer = answers[index];
        const isCorrect = userAnswer === question.correctAnswer;
        
        if (isCorrect) {
          correctAnswers++;
          earnedPoints += question.points;
        }
        totalPoints += question.points;
      });

      const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
      progressLecture.score = percentage;
      
      // Mark as completed if passing score is met
      if (percentage >= (targetLecture.quiz.passingScore || 70)) {
        progressLecture.completed = true;
        progressLecture.completedAt = new Date();
      }
    } else {
      // For assignments, mark as submitted (instructor will grade later)
      progressLecture.completed = true;
      progressLecture.completedAt = new Date();
    }

    await progress.save();

    res.json({
      success: true,
      score: progressLecture.score,
      completed: progressLecture.completed,
      message: targetLecture.type === 'quiz' ? 
        `Quiz completed! Score: ${progressLecture.score}%` : 
        'Assignment submitted successfully'
    });
  } catch (error) {
    console.error('Submit assignment error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Take final test
// @route   POST /api/progress/:courseId/final-test
// @access  Private
exports.takeFinalTest = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { answers, timeSpent } = req.body;
    const studentId = req.user.id;

    const progress = await Progress.findOne({
      student: studentId,
      course: courseId
    });

    if (!progress) {
      return res.status(404).json({ message: 'Progress record not found' });
    }

    // Check if student can take final test
    if (!progress.canTakeFinalTest()) {
      return res.status(400).json({ 
        message: 'You must complete all modules before taking the final test' 
      });
    }

    const course = await Course.findById(courseId).populate('instructor', 'name');
    if (!course || !course.finalTest || !course.finalTest.isEnabled) {
      return res.status(404).json({ message: 'Final test not available' });
    }

    // Check attempt limit
    const attemptCount = progress.finalTestAttempts.length;
    if (attemptCount >= course.finalTest.attempts) {
      return res.status(400).json({ 
        message: `Maximum attempts (${course.finalTest.attempts}) reached` 
      });
    }

    // Grade the test
    let correctAnswers = 0;
    let totalPoints = 0;
    let earnedPoints = 0;
    const gradedAnswers = [];
    const feedback = [];

    course.finalTest.questions.forEach((question, index) => {
      const userAnswer = answers[index];
      let isCorrect = false;
      
      // Handle different question types
      if (question.type === 'multiple-choice' || question.type === 'true-false') {
        isCorrect = userAnswer === question.correctAnswer;
      } else if (question.type === 'short-answer') {
        // Simple string comparison for short answers (can be enhanced)
        isCorrect = userAnswer && 
          userAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
      }

      if (isCorrect) {
        correctAnswers++;
        earnedPoints += question.points;
      }
      totalPoints += question.points;

      gradedAnswers.push({
        questionId: question._id,
        answer: userAnswer,
        isCorrect,
        pointsEarned: isCorrect ? question.points : 0
      });

      if (question.explanation) {
        feedback.push({
          questionId: question._id,
          feedback: isCorrect ? 'Correct!' : 'Incorrect',
          explanation: question.explanation
        });
      }
    });

    const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const passed = percentage >= course.finalTest.passingScore;

    // Create test attempt record
    const attempt = {
      attemptNumber: attemptCount + 1,
      completedAt: new Date(),
      answers: gradedAnswers,
      score: earnedPoints,
      percentage,
      passed,
      timeSpent,
      feedback
    };

    progress.finalTestAttempts.push(attempt);

    if (passed) {
      progress.finalTestPassed = true;
      progress.finalTestScore = percentage;
      progress.finalTestCompletedAt = new Date();
      
      // Update overall progress
      progress.updateProgress();
      
      // Generate certificate if enabled
      if (course.certificate && course.certificate.isEnabled && 
          percentage >= course.certificate.minimumScore) {
        await generateCertificate(progress, course, percentage);
      }
    }

    await progress.save();

    res.json({
      success: true,
      attempt,
      passed,
      percentage,
      correctAnswers,
      totalQuestions: course.finalTest.questions.length,
      canRetake: !passed && (attemptCount + 1) < course.finalTest.attempts,
      message: passed ? 
        'Congratulations! You passed the final test!' : 
        `Test completed. Score: ${percentage}%. ${(attemptCount + 1) < course.finalTest.attempts ? 'You can retake the test.' : 'No more attempts available.'}`
    });
  } catch (error) {
    console.error('Final test error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Helper function to generate certificate
const generateCertificate = async (progress, course, score) => {
  try {
    const student = await User.findById(progress.student);
    const instructor = await User.findById(course.instructor);

    const certificate = new Certificate({
      certificateId: Certificate.generateCertificateId(),
      student: progress.student,
      course: progress.course,
      instructor: course.instructor,
      studentName: student.name,
      courseName: course.title,
      instructorName: instructor.name,
      completedAt: progress.completedAt,
      finalScore: score,
      grade: Certificate.prototype.calculateGrade(score),
      totalModules: course.modules.length,
      totalTimeSpent: Math.round(progress.totalTimeSpent / 60), // convert to hours
    });

    certificate.generateVerificationCode();
    certificate.generateShareableUrl();
    
    await certificate.save();

    // Update progress with certificate info
    progress.certificateGenerated = true;
    progress.certificateGeneratedAt = new Date();
    progress.certificateId = certificate.certificateId;

    return certificate;
  } catch (error) {
    console.error('Certificate generation error:', error);
    throw error;
  }
};

// @desc    Complete course manually
// @route   POST /api/progress/:courseId/complete
// @access  Private
exports.completeCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user.id;

    const progress = await Progress.findOne({
      student: studentId,
      course: courseId
    }).populate('course', 'title modules');

    if (!progress) {
      return res.status(404).json({ 
        success: false,
        message: 'Progress record not found' 
      });
    }

    // Check if all modules are completed
    const allModulesCompleted = progress.modules.every(module => module.completed);
    
    if (!allModulesCompleted) {
      return res.status(400).json({
        success: false,
        message: 'All modules must be completed before marking course as complete'
      });
    }

    // Check if course is already completed
    if (progress.isCompleted) {
      return res.status(400).json({
        success: false,
        message: 'Course is already completed'
      });
    }

    // Mark course as completed
    progress.isCompleted = true;
    progress.completedAt = new Date();
    progress.updateProgress();

    await progress.save();

    // Update course completion count
    const course = await Course.findById(courseId);
    if (course) {
      course.completionCount = (course.completionCount || 0) + 1;
      await course.save();
    }

    // Generate certificate automatically
    let certificate = null;
    try {
      certificate = await generateCertificate(progress, course, 100); // Default score of 100% for manual completion
    } catch (error) {
      console.error('Certificate generation failed:', error);
      // Continue even if certificate generation fails
    }

    // Award completion XP and badges
    const user = await User.findById(studentId);
    if (user) {
      user.xp += 100; // Bonus XP for course completion
      
      // Add course completion badge if first course
      const completedCourses = await Progress.countDocuments({
        student: studentId,
        isCompleted: true
      });
      
      if (completedCourses === 1) {
        const hasFirstCourseBadge = user.badges.some(b => b.name === 'First Course');
        if (!hasFirstCourseBadge) {
          user.badges.push({
            name: 'First Course',
            icon: '🎓',
            earnedAt: new Date()
          });
        }
      }
      
      await user.save();
    }

    res.json({
      success: true,
      message: 'Course completed successfully!',
      progress,
      certificate: certificate ? {
        certificateId: certificate.certificateId,
        verificationCode: certificate.verificationCode
      } : null,
      certificateEligible: true
    });
  } catch (error) {
    console.error('Complete course error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @desc    Get student certificates
// @route   GET /api/progress/certificates
// @access  Private
exports.getStudentCertificates = async (req, res) => {
  try {
    const studentId = req.user.id;

    const certificates = await Certificate.find({ student: studentId })
      .populate('course', 'title thumbnail category')
      .sort({ completedAt: -1 });

    res.json({
      success: true,
      certificates
    });
  } catch (error) {
    console.error('Get certificates error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Download certificate
// @route   GET /api/progress/certificate/:certificateId/download
// @access  Private
exports.downloadCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;
    const studentId = req.user.id;

    const certificate = await Certificate.findOne({
      certificateId,
      student: studentId
    });

    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    // Increment download count
    certificate.incrementDownload();
    await certificate.save();

    // For now, return certificate data with a mock PDF URL
    const mockPdfUrl = `data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPD4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSA0IDAgUgo+Pgo+PgovQ29udGVudHMgNSAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iago1IDAgb2JqCjw8Ci9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCi9GMSAxMiBUZgoxMDAgNzAwIFRkCihDZXJ0aWZpY2F0ZSBvZiBDb21wbGV0aW9uKSBUagpFVApzdHJlYW0KZW5kb2JqCnhyZWYKMCA2CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAwOSAwMDAwMCBuIAowMDAwMDAwMDU4IDAwMDAwIG4gCjAwMDAwMDAxMTUgMDAwMDAgbiAKMDAwMDAwMDI0NSAwMDAwMCBuIAowMDAwMDAwMzIyIDAwMDAwIG4gCnRyYWlsZXIKPDwKL1NpemUgNgovUm9vdCAxIDAgUgo+PgpzdGFydHhyZWYKNDE0CiUlRU9G`;
    
    res.json({
      success: true,
      certificate,
      downloadUrl: mockPdfUrl,
      message: 'Certificate ready for download'
    });
  } catch (error) {
    console.error('Download certificate error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getCourseProgress: exports.getCourseProgress,
  updateLectureProgress: exports.updateLectureProgress,
  submitQuiz: exports.submitQuiz,
  generateCertificate: exports.generateCertificate,
  submitLectureAssignment: exports.submitLectureAssignment,
  takeFinalTest: exports.takeFinalTest,
  completeCourse: exports.completeCourse,
  getStudentCertificates: exports.getStudentCertificates,
  downloadCertificate: exports.downloadCertificate
};
