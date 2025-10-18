const mongoose = require('mongoose');

const portfolioAnalyticsSchema = new mongoose.Schema({
  portfolio: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Portfolio',
    required: true
  },
  
  // Visit Details
  visitDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // Visitor Information
  visitorId: String, // Anonymous ID or user ID if logged in
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Session Details
  sessionId: String,
  ipAddress: String,
  userAgent: String,
  
  // Location Data
  location: {
    country: String,
    city: String,
    region: String,
    timezone: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  
  // Device Information
  device: {
    type: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet', 'unknown']
    },
    os: String,
    browser: String,
    screenResolution: String
  },
  
  // Referrer Information
  referrer: {
    source: String, // 'direct', 'google', 'linkedin', 'twitter', etc.
    url: String,
    campaign: String,
    medium: String
  },
  
  // Engagement Metrics
  pageViews: [{
    page: String,
    timestamp: Date,
    timeSpent: Number // seconds
  }],
  
  // Interactions
  interactions: [{
    type: {
      type: String,
      enum: ['project-view', 'project-click', 'certificate-view', 'resume-download', 'contact-submit', 'social-click', 'github-click', 'like', 'share']
    },
    target: String, // ID or name of the item interacted with
    timestamp: Date,
    metadata: mongoose.Schema.Types.Mixed
  }],
  
  // Session Metrics
  sessionDuration: Number, // Total time in seconds
  pagesVisited: Number,
  exitPage: String,
  bounced: Boolean, // True if only viewed one page
  converted: Boolean, // True if submitted contact form or downloaded resume
  
}, { timestamps: true });

// Indexes for efficient querying
portfolioAnalyticsSchema.index({ portfolio: 1, visitDate: -1 });
portfolioAnalyticsSchema.index({ portfolio: 1, 'referrer.source': 1 });
portfolioAnalyticsSchema.index({ visitorId: 1 });
portfolioAnalyticsSchema.index({ sessionId: 1 });

module.exports = mongoose.model('PortfolioAnalytics', portfolioAnalyticsSchema);
