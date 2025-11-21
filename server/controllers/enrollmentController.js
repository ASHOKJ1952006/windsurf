const Enrollment = require('../models/Enrollment');
const Progress = require('../models/Progress');
const Course = require('../models/Course');
const User = require('../models/User');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const courseStatsService = require('../services/courseStatsService');

// @desc    Enroll in course
// @route   POST /api/enrollments/:courseId
// @access  Private
exports.enrollCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      student: req.user.id,
      course: course._id
    });

    if (existingEnrollment) {
      // If previously dropped, reactivate enrollment
      if (existingEnrollment.status === 'dropped') {
        existingEnrollment.status = 'active';
        existingEnrollment.enrolledAt = new Date();
        await existingEnrollment.save();
        
        return res.status(200).json({ 
          success: true, 
          enrollment: existingEnrollment,
          message: 'Re-enrolled in course successfully' 
        });
      }
      
      return res.status(400).json({ 
        success: false,
        message: 'Already enrolled in this course' 
      });
    }

    const enrollment = await Enrollment.create({
      student: req.user.id,
      course: course._id
    });

    // Update course stats
    course.enrolledCount += 1;
    await course.save();

    // Update instructor stats
    const instructor = await User.findById(course.instructor);
    if (instructor) {
      instructor.totalStudents += 1;
      await instructor.save();
    }

    // Award XP
    const user = await User.findById(req.user.id);
    user.xp += 10;
    await user.save();

    // Update course statistics
    await courseStatsService.handleEnrollment(req.user.id, course._id);

    res.status(201).json({ success: true, enrollment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get my enrollments
// @route   GET /api/enrollments/my
// @access  Private
exports.getMyEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ 
      student: req.user.id,
      status: { $ne: 'dropped' } // Exclude dropped courses
    })
      .populate({
        path: 'course',
        populate: { path: 'instructor', select: 'name profilePicture' }
      })
      .sort({ lastAccessedAt: -1 }); // Sort by most recently accessed

    // Calculate completion percentage for each enrollment and sync with Progress when available
    for (const enrollment of enrollments) {
      if (enrollment.course) {
        await enrollment.calculateCompletion();

        // If Progress document exists, use it to enhance completion values
        try {
          const courseId = enrollment.course._id || enrollment.course;
          const prog = await Progress.findOne({ student: req.user.id, course: courseId }).select('overallProgress isCompleted completedAt');
          if (prog) {
            const overall = Math.max(0, Math.min(100, prog.overallProgress || 0));
            // Prefer higher of Enrollment and Progress to avoid regressions
            enrollment.completionPercentage = Math.max(enrollment.completionPercentage || 0, overall);
            if (prog.isCompleted) {
              enrollment.isCompleted = true;
              enrollment.status = 'completed';
              if (!enrollment.completedAt && prog.completedAt) enrollment.completedAt = prog.completedAt;
            }
          }
        } catch (e) {
          // Non-fatal: if Progress lookup fails, proceed with Enrollment-only data
        }
      }
    }

    // Save any updated completion percentages
    await Promise.all(enrollments.map(e => e.save()));

    res.json({ success: true, enrollments });
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single enrollment
// @route   GET /api/enrollments/:id
// @access  Private
exports.getEnrollment = async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id)
      .populate('course')
      .populate('student', 'name email profilePicture');

    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    // Check ownership
    if (enrollment.student._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json({ success: true, enrollment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update lecture progress
// @route   PUT /api/enrollments/:id/progress
// @access  Private
exports.updateProgress = async (req, res) => {
  try {
    const { lectureId, completed, watchedPercentage, quizScore } = req.body;

    const enrollment = await Enrollment.findById(req.params.id);

    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    if (enrollment.student.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Find or create progress entry
    let progressEntry = enrollment.progress.find(
      p => p.lectureId.toString() === lectureId
    );

    if (progressEntry) {
      if (completed !== undefined) progressEntry.completed = completed;
      if (watchedPercentage !== undefined) progressEntry.watchedPercentage = watchedPercentage;
      if (quizScore !== undefined) progressEntry.quizScore = quizScore;
      progressEntry.lastWatchedAt = new Date();
    } else {
      enrollment.progress.push({
        lectureId,
        completed: completed || false,
        watchedPercentage: watchedPercentage || 0,
        quizScore,
        lastWatchedAt: new Date()
      });
    }

    // Update completion percentage
    await enrollment.calculateCompletion();
    enrollment.lastAccessedAt = new Date();
    await enrollment.save();

    // Award XP for completion
    if (completed && !progressEntry?.completed) {
      const user = await User.findById(req.user.id);
      user.xp += 5;
      user.updateStreak();
      await user.save();
    }

    res.json({ success: true, enrollment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Submit assignment
// @route   POST /api/enrollments/:id/assignment
// @access  Private
exports.submitAssignment = async (req, res) => {
  try {
    const { lectureId } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const enrollment = await Enrollment.findById(req.params.id);

    if (!enrollment || enrollment.student.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const progressEntry = enrollment.progress.find(
      p => p.lectureId.toString() === lectureId
    );

    if (progressEntry) {
      progressEntry.assignmentSubmission = {
        fileUrl: `/uploads/assignments/${req.file.filename}`,
        submittedAt: new Date()
      };
    } else {
      enrollment.progress.push({
        lectureId,
        assignmentSubmission: {
          fileUrl: `/uploads/assignments/${req.file.filename}`,
          submittedAt: new Date()
        }
      });
    }

    await enrollment.save();

    res.json({ success: true, message: 'Assignment submitted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Generate certificate
// @route   POST /api/enrollments/:id/certificate
// @access  Private
exports.generateCertificate = async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id)
      .populate('course')
      .populate('student', 'name');

    if (!enrollment || enrollment.student._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (!enrollment.isCompleted) {
      // Fallback to Progress: if progress indicates completion, sync and proceed
      try {
        const progress = await Progress.findOne({ student: req.user.id, course: enrollment.course._id || enrollment.course })
          .select('isCompleted completedAt overallProgress');
        if (progress && progress.isCompleted) {
          enrollment.isCompleted = true;
          enrollment.status = 'completed';
          enrollment.completedAt = enrollment.completedAt || progress.completedAt || new Date();
          enrollment.completionPercentage = Math.max(enrollment.completionPercentage || 0, progress.overallProgress || 100, 100);
        } else {
          return res.status(400).json({ message: 'Course not completed yet' });
        }
      } catch (e) {
        return res.status(400).json({ message: 'Course not completed yet' });
      }
    }

    if (enrollment.certificateUrl) {
      return res.json({ success: true, certificateUrl: enrollment.certificateUrl });
    }

    // Create certificates directory
    const certDir = path.join(__dirname, '../uploads/certificates');
    if (!fs.existsSync(certDir)) {
      fs.mkdirSync(certDir, { recursive: true });
    }

    const fileName = `certificate-${enrollment._id}.pdf`;
    const filePath = path.join(certDir, fileName);

    // Generate PDF
    const doc = new PDFDocument({ layout: 'landscape', size: 'A4' });
    doc.pipe(fs.createWriteStream(filePath));

    // Certificate design
    doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).stroke();
    doc.fontSize(40).text('Certificate of Completion', 100, 100, { align: 'center' });
    doc.fontSize(20).text('This is to certify that', 100, 180, { align: 'center' });
    doc.fontSize(30).text(enrollment.student.name, 100, 220, { align: 'center' });
    doc.fontSize(20).text('has successfully completed the course', 100, 280, { align: 'center' });
    doc.fontSize(25).text(enrollment.course.title, 100, 320, { align: 'center' });
    doc.fontSize(15).text(`Date: ${new Date().toLocaleDateString()}`, 100, 400, { align: 'center' });

    doc.end();

    // Wait for PDF to be written
    doc.on('finish', async () => {
      enrollment.certificateUrl = `/uploads/certificates/${fileName}`;
      await enrollment.save();

      // Award badge
      const user = await User.findById(req.user.id);
      const hasBadge = user.badges.some(b => b.name === 'Course Completer');
      if (!hasBadge) {
        user.badges.push({
          name: 'Course Completer',
          icon: '🎓',
          earnedAt: new Date()
        });
      }
      user.xp += 50;
      await user.save();

      res.json({ success: true, certificateUrl: enrollment.certificateUrl });
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Unenroll from course
// @route   DELETE /api/enrollments/:courseId
// @access  Private
exports.unenrollCourse = async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({
      student: req.user.id,
      course: req.params.courseId
    });

    if (!enrollment) {
      return res.status(404).json({ 
        success: false,
        message: 'Enrollment not found' 
      });
    }

    if (enrollment.status === 'dropped') {
      return res.status(400).json({ 
        success: false,
        message: 'Already unenrolled from this course' 
      });
    }

    // Mark as dropped instead of deleting
    enrollment.unenroll();
    await enrollment.save();

    // Update course stats
    const course = await Course.findById(req.params.courseId);
    if (course && course.enrolledCount > 0) {
      course.enrolledCount -= 1;
      await course.save();
    }

    // Update instructor stats
    if (course) {
      const instructor = await User.findById(course.instructor);
      if (instructor && instructor.totalStudents > 0) {
        instructor.totalStudents -= 1;
        await instructor.save();
      }
    }

    // Update course statistics
    await courseStatsService.handleUnenrollment(req.user.id, req.params.courseId);

    res.json({ 
      success: true, 
      message: 'Successfully unenrolled from course' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @desc    Mark course as completed
// @route   POST /api/enrollments/:courseId/complete
// @access  Private
exports.completeCourse = async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({
      student: req.user.id,
      course: req.params.courseId
    }).populate('course');

    if (!enrollment) {
      return res.status(404).json({ 
        success: false,
        message: 'Enrollment not found' 
      });
    }

    if (enrollment.isCompleted) {
      return res.status(400).json({ 
        success: false,
        message: 'Course already completed' 
      });
    }

    // Mark as completed
    enrollment.markAsCompleted();
    await enrollment.save();

    // Update user stats
    const user = await User.findById(req.user.id);
    user.completedCourses = (user.completedCourses || 0) + 1;
    user.xp += 100; // Bonus XP for course completion
    await user.save();

    // Update course completion count
    const course = await Course.findById(req.params.courseId);
    if (course) {
      course.completedCount = (course.completedCount || 0) + 1;
      await course.save();
    }

    // Update course statistics and handle completion
    await courseStatsService.handleCourseCompletion(req.user.id, req.params.courseId);

    res.json({ 
      success: true, 
      enrollment,
      message: 'Course marked as completed!' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @desc    Get enrollment status for a course
// @route   GET /api/enrollments/status/:courseId
// @access  Private
exports.getEnrollmentStatus = async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({
      student: req.user.id,
      course: req.params.courseId
    });

    if (!enrollment) {
      return res.json({ 
        success: true,
        enrolled: false,
        status: null
      });
    }

    res.json({ 
      success: true,
      enrolled: enrollment.status !== 'dropped',
      status: enrollment.status,
      completionPercentage: enrollment.completionPercentage,
      isCompleted: enrollment.isCompleted,
      enrolledAt: enrollment.enrolledAt,
      completedAt: enrollment.completedAt
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @desc    Get user's course statistics
// @route   GET /api/enrollments/stats
// @access  Private
exports.getUserStats = async (req, res) => {
  try {
    const stats = await courseStatsService.getUserStats(req.user.id);

    res.json({ 
      success: true,
      stats
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};
