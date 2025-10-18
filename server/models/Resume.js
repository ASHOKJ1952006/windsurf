const mongoose = require('mongoose');

const experienceSchema = new mongoose.Schema({
  company: {
    type: String,
    required: true
  },
  position: {
    type: String,
    required: true
  },
  location: String,
  startDate: {
    type: Date,
    required: true
  },
  endDate: Date,
  current: {
    type: Boolean,
    default: false
  },
  description: String,
  achievements: [String]
});

const educationSchema = new mongoose.Schema({
  institution: {
    type: String,
    required: true
  },
  degree: {
    type: String,
    required: true
  },
  field: String,
  location: String,
  startDate: Date,
  endDate: Date,
  gpa: String,
  achievements: [String]
});

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  role: String,
  technologies: [String],
  url: String,
  startDate: Date,
  endDate: Date,
  highlights: [String]
});

const skillSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['technical', 'soft', 'language', 'tool', 'other'],
    default: 'other'
  },
  proficiency: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    default: 'intermediate'
  }
});

const certificationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  issuer: String,
  issueDate: Date,
  expiryDate: Date,
  credentialId: String,
  url: String
});

const resumeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Contact Information
  contact: {
    fullName: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    phone: String,
    location: String,
    linkedin: String,
    github: String,
    portfolio: String,
    website: String
  },
  
  // Professional Summary
  headline: String,
  summary: String,
  
  // Career Details
  experience: [experienceSchema],
  education: [educationSchema],
  projects: [projectSchema],
  skills: [skillSchema],
  certifications: [certificationSchema],
  
  // Additional Sections
  awards: [{
    title: String,
    issuer: String,
    date: Date,
    description: String
  }],
  
  publications: [{
    title: String,
    publisher: String,
    date: Date,
    url: String,
    description: String
  }],
  
  languages: [{
    name: String,
    proficiency: {
      type: String,
      enum: ['elementary', 'limited', 'professional', 'native'],
      default: 'professional'
    }
  }],
  
  customSections: [{
    title: String,
    content: String,
    items: [String]
  }],
  
  references: [{
    name: String,
    position: String,
    company: String,
    email: String,
    phone: String,
    relationship: String
  }],
  
  // Template & Styling
  template: {
    type: String,
    enum: ['professional', 'modern', 'creative', 'minimalist', 'executive', 'technical'],
    default: 'professional'
  },
  
  colorScheme: {
    type: String,
    default: '#2563eb'
  },
  
  // Metadata
  title: {
    type: String,
    default: 'My Resume'
  },
  
  targetRole: String,
  targetIndustry: String,
  
  // Status & Versioning
  status: {
    type: String,
    enum: ['draft', 'active', 'archived'],
    default: 'draft'
  },
  
  version: {
    type: Number,
    default: 1
  },
  
  // AI Suggestions
  aiSuggestions: {
    summaryScore: Number,
    atsScore: Number,
    keywords: [String],
    improvements: [String]
  },
  
  // Import Source
  importedFrom: {
    type: String,
    enum: ['manual', 'linkedin', 'upload'],
    default: 'manual'
  },
  
  // Privacy
  isPublic: {
    type: Boolean,
    default: false
  },
  
  // Analytics
  viewCount: {
    type: Number,
    default: 0
  },
  
  downloadCount: {
    type: Number,
    default: 0
  },
  
  lastExportedAt: Date,
  
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
resumeSchema.index({ user: 1, status: 1 });
resumeSchema.index({ user: 1, createdAt: -1 });

// Methods
resumeSchema.methods.calculateATSScore = function() {
  let score = 0;
  
  // Contact info completeness
  if (this.contact.email) score += 10;
  if (this.contact.phone) score += 5;
  if (this.contact.location) score += 5;
  
  // Professional summary
  if (this.summary && this.summary.length > 50) score += 15;
  
  // Experience
  if (this.experience.length > 0) {
    score += 20;
    if (this.experience.some(exp => exp.achievements && exp.achievements.length > 0)) {
      score += 10;
    }
  }
  
  // Education
  if (this.education.length > 0) score += 15;
  
  // Skills
  if (this.skills.length >= 5) score += 10;
  if (this.skills.length >= 10) score += 5;
  
  // Additional sections
  if (this.certifications.length > 0) score += 5;
  if (this.projects.length > 0) score += 5;
  
  this.aiSuggestions.atsScore = Math.min(score, 100);
  return this.aiSuggestions.atsScore;
};

resumeSchema.methods.generateKeywords = function() {
  const keywords = new Set();
  
  // Extract from skills
  this.skills.forEach(skill => keywords.add(skill.name.toLowerCase()));
  
  // Extract from experience
  this.experience.forEach(exp => {
    keywords.add(exp.position.toLowerCase());
    keywords.add(exp.company.toLowerCase());
  });
  
  // Extract from education
  this.education.forEach(edu => {
    if (edu.field) keywords.add(edu.field.toLowerCase());
  });
  
  this.aiSuggestions.keywords = Array.from(keywords);
  return this.aiSuggestions.keywords;
};

// Pre-save middleware
resumeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Resume', resumeSchema);
