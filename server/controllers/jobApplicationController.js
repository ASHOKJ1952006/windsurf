const JobApplication = require('../models/JobApplication');
const Job = require('../models/Job');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Submit job application
// @route   POST /api/job-applications/apply/:jobId
// @access  Private (Students only)
exports.submitApplication = async (req, res) => {
  try {
    const { jobId } = req.params;
    const applicantId = req.user.id;
    const {
      personalInfo,
      experience,
      education,
      skills,
      resumeUrl,
      portfolioUrl,
      coverLetter
    } = req.body;

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check if user already applied
    const existingApplication = await JobApplication.findOne({
      job: jobId,
      applicant: applicantId
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this job'
      });
    }

    // Create application
    const application = new JobApplication({
      job: jobId,
      applicant: applicantId,
      personalInfo,
      experience,
      education,
      skills: skills || [],
      resumeUrl,
      portfolioUrl,
      coverLetter
    });

    await application.save();

    // Populate the application with job and applicant details
    await application.populate([
      { path: 'job', select: 'title company' },
      { path: 'applicant', select: 'name email' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully!',
      application
    });
  } catch (error) {
    console.error('Submit application error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get user's applications
// @route   GET /api/job-applications/my
// @access  Private (Students only)
exports.getMyApplications = async (req, res) => {
  try {
    const applicantId = req.user.id;

    const applications = await JobApplication.find({ applicant: applicantId })
      .populate('job', 'title company location type salary')
      .sort({ appliedAt: -1 });

    res.json({
      success: true,
      applications
    });
  } catch (error) {
    console.error('Get my applications error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all applications (Admin only)
// @route   GET /api/job-applications/admin/all
// @access  Private (Admin only)
exports.getAllApplications = async (req, res) => {
  try {
    const { status, jobId, page = 1, limit = 10 } = req.query;
    
    // Build filter
    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (jobId) {
      filter.job = jobId;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get applications with pagination
    const applications = await JobApplication.find(filter)
      .populate('job', 'title company location type')
      .populate('applicant', 'name email profilePicture')
      .sort({ appliedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await JobApplication.countDocuments(filter);

    // Get application statistics
    const stats = await JobApplication.getApplicationStats();

    res.json({
      success: true,
      applications,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalApplications: total,
        hasNext: skip + applications.length < total,
        hasPrev: parseInt(page) > 1
      },
      stats
    });
  } catch (error) {
    console.error('Get all applications error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single application details
// @route   GET /api/job-applications/admin/:applicationId
// @access  Private (Admin only)
exports.getApplicationDetails = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await JobApplication.findById(applicationId)
      .populate('job')
      .populate('applicant', 'name email profilePicture createdAt')
      .populate('adminNotes.addedBy', 'name');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    res.json({
      success: true,
      application
    });
  } catch (error) {
    console.error('Get application details error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update application status
// @route   PUT /api/job-applications/admin/:applicationId/status
// @access  Private (Admin only)
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status, note } = req.body;
    const adminId = req.user.id;

    const application = await JobApplication.findById(applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    await application.updateStatus(status, adminId, note);

    // Populate for response
    await application.populate([
      { path: 'job', select: 'title company' },
      { path: 'applicant', select: 'name email' }
    ]);

    // Create notification for the applicant
    const statusMessages = {
      pending: 'Your application is pending review',
      reviewing: 'Your application is being reviewed',
      shortlisted: 'Congratulations! You have been shortlisted',
      interviewed: 'Interview scheduled for your application',
      hired: 'Congratulations! You have been hired',
      rejected: 'Your application has been rejected'
    };

    await Notification.create({
      recipient: application.applicant._id,
      sender: adminId,
      type: 'job_application',
      title: `Job Application Status Update`,
      message: `${statusMessages[status]} for ${application.job.title} at ${application.job.company}`,
      link: `/jobs`
    });

    // Emit real-time notification via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${application.applicant._id}`).emit('notification', {
        type: 'job_application',
        title: 'Job Application Status Update',
        message: `${statusMessages[status]} for ${application.job.title}`,
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Application status updated successfully',
      application
    });
  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Schedule interview
// @route   PUT /api/job-applications/admin/:applicationId/interview
// @access  Private (Admin only)
exports.scheduleInterview = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const interviewDetails = req.body;

    const application = await JobApplication.findById(applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    await application.scheduleInterview(interviewDetails);

    // Populate for response
    await application.populate([
      { path: 'job', select: 'title company' },
      { path: 'applicant', select: 'name email' }
    ]);

    res.json({
      success: true,
      message: 'Interview scheduled successfully',
      application
    });
  } catch (error) {
    console.error('Schedule interview error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Add admin note
// @route   POST /api/job-applications/admin/:applicationId/note
// @access  Private (Admin only)
exports.addAdminNote = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { note } = req.body;
    const adminId = req.user.id;

    const application = await JobApplication.findById(applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    application.adminNotes.push({
      note,
      addedBy: adminId,
      addedAt: new Date()
    });

    application.lastUpdated = new Date();
    await application.save();

    // Populate the new note
    await application.populate('adminNotes.addedBy', 'name');

    res.json({
      success: true,
      message: 'Note added successfully',
      application
    });
  } catch (error) {
    console.error('Add admin note error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete application
// @route   DELETE /api/job-applications/admin/:applicationId
// @access  Private (Admin only)
exports.deleteApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await JobApplication.findById(applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    await JobApplication.findByIdAndDelete(applicationId);

    res.json({
      success: true,
      message: 'Application deleted successfully'
    });
  } catch (error) {
    console.error('Delete application error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
