const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  certificateId: {
    type: String,
    required: true,
    unique: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Certificate Details
  studentName: {
    type: String,
    required: true
  },
  courseName: {
    type: String,
    required: true
  },
  instructorName: {
    type: String,
    required: true
  },
  
  // Completion Details
  completedAt: {
    type: Date,
    required: true
  },
  finalScore: {
    type: Number,
    required: true
  },
  grade: {
    type: String,
    enum: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F'],
    required: true
  },
  
  // Course Statistics
  totalModules: {
    type: Number,
    required: true
  },
  totalTimeSpent: {
    type: Number, // in hours
    required: true
  },
  
  // Certificate File
  pdfUrl: String,
  pdfPath: String,
  
  // Verification
  verificationCode: {
    type: String,
    required: true,
    unique: true
  },
  isVerified: {
    type: Boolean,
    default: true
  },
  
  // Template and Design
  template: {
    type: String,
    default: 'default'
  },
  backgroundColor: {
    type: String,
    default: '#ffffff'
  },
  textColor: {
    type: String,
    default: '#000000'
  },
  accentColor: {
    type: String,
    default: '#3b82f6'
  },
  
  // Metadata
  generatedAt: {
    type: Date,
    default: Date.now
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  lastDownloadedAt: Date,
  
  // Sharing and Social
  isPublic: {
    type: Boolean,
    default: false
  },
  shareableUrl: String,
  socialShares: {
    linkedin: { type: Number, default: 0 },
    twitter: { type: Number, default: 0 },
    facebook: { type: Number, default: 0 }
  },
  
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
certificateSchema.index({ student: 1 });
certificateSchema.index({ course: 1 });
certificateSchema.index({ certificateId: 1 });
certificateSchema.index({ verificationCode: 1 });
certificateSchema.index({ completedAt: 1 });

// Methods
certificateSchema.methods.generateVerificationCode = function() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  this.verificationCode = result;
  return result;
};

certificateSchema.methods.calculateGrade = function(score) {
  if (score >= 97) return 'A+';
  if (score >= 93) return 'A';
  if (score >= 90) return 'A-';
  if (score >= 87) return 'B+';
  if (score >= 83) return 'B';
  if (score >= 80) return 'B-';
  if (score >= 77) return 'C+';
  if (score >= 73) return 'C';
  if (score >= 70) return 'C-';
  if (score >= 60) return 'D';
  return 'F';
};

certificateSchema.methods.incrementDownload = function() {
  this.downloadCount += 1;
  this.lastDownloadedAt = new Date();
  this.updatedAt = new Date();
};

certificateSchema.methods.generateShareableUrl = function() {
  const baseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  this.shareableUrl = `${baseUrl}/certificates/verify/${this.verificationCode}`;
  return this.shareableUrl;
};

// Static methods
certificateSchema.statics.generateCertificateId = function() {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `CERT-${timestamp}-${randomStr}`.toUpperCase();
};

certificateSchema.statics.verifyCertificate = function(verificationCode) {
  return this.findOne({ verificationCode, isVerified: true });
};

module.exports = mongoose.model('Certificate', certificateSchema);
