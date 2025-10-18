const mongoose = require('mongoose');

const jobApplicationSchema = new mongoose.Schema({
  // Job and Applicant Info
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  applicant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Application Details
  personalInfo: {
    fullName: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    location: {
      type: String,
      required: true
    }
  },
  
  // Professional Info
  experience: {
    type: String,
    required: true
  },
  education: {
    type: String,
    required: true
  },
  skills: [{
    type: String
  }],
  
  // Documents and Links
  resumeUrl: {
    type: String,
    required: true
  },
  portfolioUrl: {
    type: String
  },
  coverLetter: {
    type: String
  },
  
  // Application Status
  status: {
    type: String,
    enum: ['pending', 'reviewing', 'shortlisted', 'interviewed', 'hired', 'rejected'],
    default: 'pending'
  },
  
  // Admin Notes
  adminNotes: [{
    note: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Interview Details
  interview: {
    scheduled: {
      type: Boolean,
      default: false
    },
    date: Date,
    time: String,
    location: String,
    type: {
      type: String,
      enum: ['in-person', 'video', 'phone'],
      default: 'video'
    },
    meetingLink: String
  },
  
  // Timestamps
  appliedAt: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
jobApplicationSchema.index({ job: 1, applicant: 1 }, { unique: true }); // Prevent duplicate applications
jobApplicationSchema.index({ status: 1 });
jobApplicationSchema.index({ appliedAt: -1 });

// Methods
jobApplicationSchema.methods.updateStatus = function(newStatus, adminId, note) {
  this.status = newStatus;
  this.lastUpdated = new Date();
  
  if (note) {
    this.adminNotes.push({
      note,
      addedBy: adminId,
      addedAt: new Date()
    });
  }
  
  return this.save();
};

jobApplicationSchema.methods.scheduleInterview = function(interviewDetails) {
  this.interview = {
    ...this.interview,
    ...interviewDetails,
    scheduled: true
  };
  this.status = 'interviewed';
  this.lastUpdated = new Date();
  
  return this.save();
};

// Static methods
jobApplicationSchema.statics.getApplicationStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
};

module.exports = mongoose.model('JobApplication', jobApplicationSchema);
