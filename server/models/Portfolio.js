const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  detailedDescription: String,
  tags: [String],
  images: [String],
  thumbnail: String,
  demoUrl: String,
  githubUrl: String,
  codeSnippets: [{
    language: String,
    code: String,
    description: String
  }],
  technologies: [String],
  featured: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    default: 0
  },
  startDate: Date,
  endDate: Date,
  status: {
    type: String,
    enum: ['completed', 'in-progress', 'planned'],
    default: 'completed'
  },
  visibility: {
    type: String,
    enum: ['public', 'private'],
    default: 'public'
  },
  metrics: {
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 }
  }
}, { timestamps: true });

const portfolioSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  // Basic Info
  slug: {
    type: String,
    unique: true,
    sparse: true
  },
  customDomain: {
    domain: String,
    verified: { type: Boolean, default: false },
    verificationToken: String,
    dnsRecords: [{
      type: String,
      name: String,
      value: String,
      verified: Boolean
    }]
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  
  // Profile Customization
  theme: {
    type: String,
    enum: ['modern', 'minimal', 'creative', 'professional', 'dark', 'light'],
    default: 'modern'
  },
  layout: {
    type: String,
    enum: ['single-page', 'multi-page', 'sidebar', 'grid'],
    default: 'single-page'
  },
  colors: {
    primary: { type: String, default: '#3B82F6' },
    secondary: { type: String, default: '#10B981' },
    background: { type: String, default: '#FFFFFF' },
    text: { type: String, default: '#1F2937' }
  },
  
  // Content Sections
  hero: {
    title: String,
    subtitle: String,
    tagline: String,
    backgroundImage: String,
    ctaText: String,
    ctaLink: String,
    showResume: { type: Boolean, default: true }
  },
  
  about: {
    bio: String,
    longBio: String,
    profileImage: String,
    coverImage: String,
    location: String,
    availability: {
      type: String,
      enum: ['available', 'busy', 'not-looking'],
      default: 'available'
    },
    yearsOfExperience: Number
  },
  
  // Skills Display
  skills: [{
    name: String,
    category: {
      type: String,
      enum: ['technical', 'soft', 'language', 'tool', 'framework', 'other']
    },
    proficiency: {
      type: Number,
      min: 0,
      max: 100
    },
    yearsOfExperience: Number,
    endorsed: { type: Boolean, default: false },
    showInPortfolio: { type: Boolean, default: true }
  }],
  
  // Work Experience
  experience: [{
    company: String,
    position: String,
    location: String,
    description: String,
    achievements: [String],
    startDate: Date,
    endDate: Date,
    current: { type: Boolean, default: false },
    companyLogo: String,
    showInPortfolio: { type: Boolean, default: true }
  }],
  
  // Education
  education: [{
    institution: String,
    degree: String,
    field: String,
    startDate: Date,
    endDate: Date,
    gpa: String,
    achievements: [String],
    showInPortfolio: { type: Boolean, default: true }
  }],
  
  // Projects
  projects: [projectSchema],
  
  // Certifications (references to actual certificates from courses)
  certifications: [{
    certificate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Certificate'
    },
    customTitle: String,
    customDescription: String,
    featured: { type: Boolean, default: false },
    showInPortfolio: { type: Boolean, default: true }
  }],
  
  // Courses (references to completed courses)
  courses: [{
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    },
    enrollment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Enrollment'
    },
    featured: { type: Boolean, default: false },
    showInPortfolio: { type: Boolean, default: true }
  }],
  
  // Achievements & Awards
  achievements: [{
    title: String,
    description: String,
    issuer: String,
    date: Date,
    image: String,
    verificationUrl: String,
    category: String,
    showInPortfolio: { type: Boolean, default: true }
  }],
  
  // GitHub Integration
  github: {
    connected: { type: Boolean, default: false },
    username: String,
    accessToken: String, // Encrypted
    repositories: [{
      id: Number,
      name: String,
      description: String,
      url: String,
      stars: Number,
      forks: Number,
      language: String,
      topics: [String],
      pinned: Boolean,
      lastUpdated: Date,
      showInPortfolio: { type: Boolean, default: true }
    }],
    stats: {
      totalRepos: Number,
      totalStars: Number,
      totalCommits: Number,
      totalPRs: Number,
      contributionsLastYear: Number,
      lastSynced: Date
    },
    pinnedRepos: [Number],
    autoSync: { type: Boolean, default: true }
  },
  
  // Social Links
  social: {
    linkedin: String,
    twitter: String,
    github: String,
    website: String,
    blog: String,
    youtube: String,
    instagram: String,
    dribbble: String,
    behance: String,
    medium: String,
    stackoverflow: String,
    codepen: String,
    email: String,
    phone: String
  },
  
  // Testimonials
  testimonials: [{
    name: String,
    position: String,
    company: String,
    content: String,
    image: String,
    rating: Number,
    date: Date,
    verified: { type: Boolean, default: false },
    showInPortfolio: { type: Boolean, default: true }
  }],
  
  // Contact Form Settings
  contactForm: {
    enabled: { type: Boolean, default: true },
    email: String,
    successMessage: String,
    fields: [{
      name: String,
      label: String,
      type: String,
      required: Boolean
    }]
  },
  
  // SEO Settings
  seo: {
    metaTitle: String,
    metaDescription: String,
    metaKeywords: [String],
    ogImage: String,
    favicon: String,
    customScripts: String
  },
  
  // Sections Visibility & Order
  sections: [{
    name: {
      type: String,
      enum: ['hero', 'about', 'skills', 'experience', 'education', 'projects', 'certifications', 'courses', 'achievements', 'testimonials', 'contact', 'github']
    },
    visible: { type: Boolean, default: true },
    order: Number
  }],
  
  // Settings
  settings: {
    enableComments: { type: Boolean, default: false },
    enableLikes: { type: Boolean, default: true },
    enableSharing: { type: Boolean, default: true },
    enableDownloadResume: { type: Boolean, default: true },
    enableContactForm: { type: Boolean, default: true },
    enableAnalytics: { type: Boolean, default: true },
    privacyMode: { type: Boolean, default: false },
    requireApprovalForComments: { type: Boolean, default: true }
  },
  
  // Analytics
  analytics: {
    totalViews: { type: Number, default: 0 },
    uniqueVisitors: { type: Number, default: 0 },
    averageTimeOnPage: { type: Number, default: 0 },
    bounceRate: { type: Number, default: 0 },
    topReferrers: [{
      source: String,
      count: Number
    }],
    topPages: [{
      page: String,
      views: Number
    }],
    projectClicks: { type: Number, default: 0 },
    resumeDownloads: { type: Number, default: 0 },
    contactFormSubmissions: { type: Number, default: 0 }
  },
  
  // Version Control
  publishedAt: Date,
  lastPublishedVersion: String,
  draftMode: { type: Boolean, default: false }
  
}, { timestamps: true });

// Index for slug-based lookup
portfolioSchema.index({ slug: 1 });
portfolioSchema.index({ user: 1 });
portfolioSchema.index({ 'customDomain.domain': 1 });

// Generate unique slug from username
portfolioSchema.pre('save', async function(next) {
  if (!this.slug && this.user) {
    try {
      const User = mongoose.model('User');
      const user = await User.findById(this.user);
      if (user) {
        let baseSlug = user.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        let slug = baseSlug;
        let counter = 1;
        
        // Check if slug exists
        while (await mongoose.model('Portfolio').findOne({ slug, _id: { $ne: this._id } })) {
          slug = `${baseSlug}-${counter}`;
          counter++;
        }
        
        this.slug = slug;
      }
    } catch (error) {
      console.error('Error generating slug:', error);
    }
  }
  next();
});

module.exports = mongoose.model('Portfolio', portfolioSchema);
