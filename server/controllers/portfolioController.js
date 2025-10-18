const Portfolio = require('../models/Portfolio');
const PortfolioAnalytics = require('../models/PortfolioAnalytics');
const Certificate = require('../models/Certificate');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const User = require('../models/User');
const githubService = require('../services/githubService');
const linkedinService = require('../services/linkedinService');
const crypto = require('crypto');

/**
 * @desc    Test portfolio system health
 * @route   GET /api/portfolios/health
 * @access  Private
 */
exports.healthCheck = async (req, res) => {
  try {
    console.log('=== Portfolio Health Check ===');
    console.log('User ID:', req.user?._id);
    
    // Test 1: Check if models are imported correctly
    console.log('🔍 Testing model imports...');
    console.log('Portfolio model:', typeof Portfolio);
    console.log('User model:', typeof User);
    
    if (typeof Portfolio !== 'function') {
      return res.status(500).json({ success: false, message: 'Portfolio model not imported correctly' });
    }
    
    if (typeof User !== 'function') {
      return res.status(500).json({ success: false, message: 'User model not imported correctly' });
    }
    
    // Test 2: Check if user exists
    console.log('🔍 Testing user lookup...');
    let user;
    try {
      user = await User.findById(req.user._id);
      console.log('✅ User found:', !!user);
    } catch (userError) {
      console.error('❌ User lookup failed:', userError);
      return res.status(500).json({ success: false, message: 'User lookup failed', error: userError.message });
    }
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Test 3: Check if portfolio exists
    console.log('🔍 Testing portfolio lookup...');
    let portfolio;
    try {
      portfolio = await Portfolio.findOne({ user: req.user._id });
      console.log('✅ Portfolio lookup completed, exists:', !!portfolio);
    } catch (portfolioError) {
      console.error('❌ Portfolio lookup failed:', portfolioError);
      return res.status(500).json({ success: false, message: 'Portfolio lookup failed', error: portfolioError.message });
    }
    
    // Test 4: Try to create a minimal portfolio if none exists
    if (!portfolio) {
      console.log('🔍 Testing portfolio creation...');
      try {
        const testPortfolio = new Portfolio({ user: req.user._id });
        console.log('✅ Portfolio instance created successfully');
        // Don't save it, just test creation
      } catch (createError) {
        console.error('❌ Portfolio creation test failed:', createError);
        return res.status(500).json({ success: false, message: 'Portfolio creation test failed', error: createError.message });
      }
    }
    
    // Test 5: Check existing portfolios and their slugs
    console.log('🔍 Checking existing portfolios...');
    try {
      const allPortfolios = await Portfolio.find({}, 'slug user isPublic').populate('user', 'name');
      console.log('📊 Existing portfolios:', allPortfolios.map(p => ({
        id: p._id,
        slug: p.slug,
        user: p.user?.name,
        isPublic: p.isPublic
      })));
    } catch (portfolioListError) {
      console.error('❌ Error listing portfolios:', portfolioListError);
    }
    
    res.status(200).json({ 
      success: true, 
      message: 'Portfolio system healthy',
      tests: {
        modelImports: '✅ Pass',
        userLookup: '✅ Pass',
        portfolioLookup: '✅ Pass',
        portfolioCreation: '✅ Pass'
      },
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      },
      portfolio: {
        exists: !!portfolio,
        id: portfolio?._id
      }
    });
  } catch (error) {
    console.error('❌ Portfolio health check error:', error);
    console.error('📋 Error stack:', error.stack);
    res.status(500).json({ success: false, message: 'Health check failed', error: error.message, stack: error.stack });
  }
};

/**
 * @desc    Get or create user's portfolio
 * @route   GET /api/portfolios/my
 * @access  Private
 */
exports.getMyPortfolio = async (req, res) => {
  try {
    console.log('=== Portfolio API Call ===');
    console.log('User ID:', req.user?._id);
    console.log('User Name:', req.user?.name);
    console.log('User Email:', req.user?.email);
    
    // Validate user object
    if (!req.user || !req.user._id) {
      console.error('❌ Invalid user object:', req.user);
      return res.status(401).json({ success: false, message: 'User not authenticated properly' });
    }

    // Test database connection first
    console.log('🔍 Testing database connection...');
    try {
      const testUser = await User.findById(req.user._id);
      console.log('✅ User found in database:', !!testUser);
      if (!testUser) {
        return res.status(404).json({ success: false, message: 'User not found in database' });
      }
    } catch (dbError) {
      console.error('❌ Database connection error:', dbError);
      return res.status(500).json({ success: false, message: 'Database connection failed', error: dbError.message });
    }
    
    console.log('🔍 Searching for existing portfolio...');
    let portfolio;
    try {
      portfolio = await Portfolio.findOne({ user: req.user._id });
      console.log('📁 Found existing portfolio:', !!portfolio);
    } catch (findError) {
      console.error('❌ Error finding portfolio:', findError);
      return res.status(500).json({ success: false, message: 'Error searching for portfolio', error: findError.message });
    }

    if (!portfolio) {
      console.log('🔨 Creating new portfolio...');
      
      // Create the most minimal portfolio possible
      const portfolioData = {
        user: req.user._id
      };

      console.log('📝 Portfolio data to create:', portfolioData);

      try {
        portfolio = await Portfolio.create(portfolioData);
        console.log('✅ Portfolio created successfully with ID:', portfolio._id);
      } catch (createError) {
        console.error('❌ Portfolio creation failed:', createError.message);
        console.error('📋 Error details:', createError);
        
        // Return more specific error message
        if (createError.name === 'ValidationError') {
          const validationErrors = Object.values(createError.errors).map(err => err.message);
          return res.status(400).json({ 
            success: false, 
            message: 'Portfolio validation failed', 
            errors: validationErrors 
          });
        }
        
        if (createError.code === 11000) {
          return res.status(400).json({ 
            success: false, 
            message: 'Portfolio already exists for this user' 
          });
        }
        
        throw createError;
      }
    }

    // Get user data
    const user = await User.findById(req.user._id, 'name email profilePicture');
    if (!user) {
      console.error('❌ User not found in database:', req.user._id);
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Return portfolio with user data
    const response = {
      success: true,
      portfolio: {
        ...portfolio.toObject(),
        user: user.toObject()
      }
    };

    console.log('✅ Returning portfolio data');
    res.status(200).json(response);
    
  } catch (error) {
    console.error('❌ Portfolio API Error:', error.message);
    console.error('📋 Full error:', error);
    console.error('📋 Error stack:', error.stack);
    
    // Return detailed error information for debugging
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error in portfolio API', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * @desc    Update user's portfolio
 * @route   PUT /api/portfolios/my
 * @access  Private
 */
exports.updateMyPortfolio = async (req, res) => {
  try {
    console.log('=== Portfolio Update API Call ===');
    console.log('User ID:', req.user?._id);
    
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'User not authenticated properly' });
    }

    let portfolio = await Portfolio.findOne({ user: req.user._id });

    if (!portfolio) {
      portfolio = await Portfolio.create({
        ...req.body,
        user: req.user._id
      });
    } else {
      Object.assign(portfolio, req.body);
      await portfolio.save();
    }

    // Get user data
    const user = await User.findById(req.user._id, 'name email profilePicture');
    
    const response = {
      success: true,
      portfolio: {
        ...portfolio.toObject(),
        user: user.toObject()
      }
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Update portfolio error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Get public portfolio by slug or custom domain
 * @route   GET /api/portfolios/public/:identifier
 * @access  Public
 */
exports.getPublicPortfolio = async (req, res) => {
  try {
    console.log('=== Public Portfolio API Call ===');
    const { identifier } = req.params;
    const { domain } = req.query;
    console.log('Identifier:', identifier);
    console.log('Domain:', domain);

    let portfolio;
    
    if (domain) {
      console.log('🔍 Searching by custom domain...');
      // Find by custom domain
      portfolio = await Portfolio.findOne({ 
        'customDomain.domain': domain,
        'customDomain.verified': true,
        isPublic: true
      });
    } else {
      console.log('🔍 Searching by slug...');
      // Find by slug
      portfolio = await Portfolio.findOne({ 
        slug: identifier,
        isPublic: true
      });
    }
    
    console.log('📁 Portfolio found:', !!portfolio);

    if (!portfolio) {
      console.log('❌ Portfolio not found with identifier:', identifier);
      
      // Debug: Check if any portfolios exist
      const allPortfolios = await Portfolio.find({}, 'slug user isPublic').populate('user', 'name');
      console.log('📊 All portfolios in database:', allPortfolios.map(p => ({
        id: p._id,
        slug: p.slug,
        user: p.user?.name,
        isPublic: p.isPublic
      })));
      
      return res.status(404).json({ 
        success: false, 
        message: 'Portfolio not found',
        debug: {
          searchedFor: identifier,
          availablePortfolios: allPortfolios.map(p => ({
            slug: p.slug,
            user: p.user?.name,
            isPublic: p.isPublic
          }))
        }
      });
    }

    // Get user data separately to avoid populate errors
    const user = await User.findById(portfolio.user, 'name email profilePicture');
    
    // Create response with user data
    const portfolioWithUser = {
      ...portfolio.toObject(),
      user: user ? user.toObject() : null
    };

    // Track analytics
    if (req.headers['x-visitor-id'] || req.ip) {
      try {
        await trackPortfolioView(portfolio._id, req);
      } catch (analyticsError) {
        console.error('Analytics tracking error:', analyticsError);
        // Don't fail the request if analytics fails
      }
    }

    res.status(200).json({ success: true, portfolio: portfolioWithUser });
  } catch (error) {
    console.error('❌ Get public portfolio error:', error.message);
    console.error('📋 Full error:', error);
    console.error('📋 Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Server error in public portfolio API', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * @desc    Add project to portfolio
 * @route   POST /api/portfolios/projects
 * @access  Private
 */
exports.addProject = async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ user: req.user._id });

    if (!portfolio) {
      return res.status(404).json({ success: false, message: 'Portfolio not found' });
    }

    portfolio.projects.push(req.body);
    await portfolio.save();

    res.status(201).json({ success: true, project: portfolio.projects[portfolio.projects.length - 1] });
  } catch (error) {
    console.error('Add project error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Update project
 * @route   PUT /api/portfolios/projects/:projectId
 * @access  Private
 */
exports.updateProject = async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ user: req.user._id });

    if (!portfolio) {
      return res.status(404).json({ success: false, message: 'Portfolio not found' });
    }

    const project = portfolio.projects.id(req.params.projectId);
    
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    Object.assign(project, req.body);
    await portfolio.save();

    res.status(200).json({ success: true, project });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Delete project
 * @route   DELETE /api/portfolios/projects/:projectId
 * @access  Private
 */
exports.deleteProject = async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ user: req.user._id });

    if (!portfolio) {
      return res.status(404).json({ success: false, message: 'Portfolio not found' });
    }

    portfolio.projects.pull(req.params.projectId);
    await portfolio.save();

    res.status(200).json({ success: true, message: 'Project deleted' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Sync completed courses and certificates
 * @route   POST /api/portfolios/sync-courses
 * @access  Private
 */
exports.syncCourses = async (req, res) => {
  try {
    let portfolio = await Portfolio.findOne({ user: req.user._id });

    if (!portfolio) {
      return res.status(404).json({ success: false, message: 'Portfolio not found. Please create your portfolio first.' });
    }

    let coursesCount = 0;
    let certificatesCount = 0;

    try {
      // Get completed enrollments - handle if Enrollment model doesn't exist
      const completedEnrollments = await Enrollment.find({
        user: req.user._id,
        status: 'completed',
        progress: 100
      }).populate('course');

      // Update courses in portfolio
      if (completedEnrollments && completedEnrollments.length > 0) {
        portfolio.courses = completedEnrollments.map(enrollment => ({
          course: enrollment.course._id,
          enrollment: enrollment._id,
          featured: false,
          showInPortfolio: true
        }));
        coursesCount = portfolio.courses.length;
      }
    } catch (enrollmentError) {
      console.log('Enrollment sync skipped:', enrollmentError.message);
      portfolio.courses = portfolio.courses || [];
    }

    try {
      // Get certificates - handle if Certificate model doesn't exist
      const certificates = await Certificate.find({ user: req.user._id });

      // Update certifications
      if (certificates && certificates.length > 0) {
        portfolio.certifications = certificates.map(cert => ({
          certificate: cert._id,
          featured: false,
          showInPortfolio: true
        }));
        certificatesCount = portfolio.certifications.length;
      }
    } catch (certificateError) {
      console.log('Certificate sync skipped:', certificateError.message);
      portfolio.certifications = portfolio.certifications || [];
    }

    await portfolio.save();

    res.status(200).json({ 
      success: true, 
      message: 'Courses and certificates synced successfully',
      coursesCount,
      certificatesCount
    });
  } catch (error) {
    console.error('Sync courses error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Connect GitHub account
 * @route   POST /api/portfolios/github/connect
 * @access  Private
 */
exports.connectGitHub = async (req, res) => {
  try {
    const { username, token } = req.body;

    if (!username) {
      return res.status(400).json({ success: false, message: 'GitHub username is required' });
    }

    // Validate token if provided
    if (token) {
      const validation = await githubService.validateToken(token);
      if (!validation.valid) {
        return res.status(400).json({ success: false, message: 'Invalid GitHub token' });
      }
    }

    const portfolio = await Portfolio.findOne({ user: req.user._id });

    if (!portfolio) {
      return res.status(404).json({ success: false, message: 'Portfolio not found' });
    }

    // Sync GitHub data
    const githubData = await githubService.syncGitHubData(username, token);

    // Update portfolio
    portfolio.github = {
      connected: true,
      username,
      accessToken: token ? encryptToken(token) : undefined,
      repositories: githubData.repositories,
      stats: githubData.stats,
      pinnedRepos: githubData.pinnedRepos,
      autoSync: true
    };

    await portfolio.save();

    res.status(200).json({ 
      success: true, 
      message: 'GitHub connected successfully',
      github: {
        ...portfolio.github.toObject(),
        accessToken: undefined // Don't send token back
      }
    });
  } catch (error) {
    console.error('Connect GitHub error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Sync GitHub repositories
 * @route   POST /api/portfolios/github/sync
 * @access  Private
 */
exports.syncGitHub = async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ user: req.user._id });

    if (!portfolio || !portfolio.github?.connected) {
      return res.status(400).json({ success: false, message: 'GitHub not connected' });
    }

    const token = portfolio.github.accessToken ? decryptToken(portfolio.github.accessToken) : null;
    const githubData = await githubService.syncGitHubData(portfolio.github.username, token);

    // Update repositories
    portfolio.github.repositories = githubData.repositories;
    portfolio.github.stats = githubData.stats;
    portfolio.github.pinnedRepos = githubData.pinnedRepos;

    await portfolio.save();

    res.status(200).json({ 
      success: true, 
      message: 'GitHub data synced successfully',
      repositoriesCount: githubData.repositories.length
    });
  } catch (error) {
    console.error('Sync GitHub error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Disconnect GitHub
 * @route   DELETE /api/portfolios/github
 * @access  Private
 */
exports.disconnectGitHub = async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ user: req.user._id });

    if (!portfolio) {
      return res.status(404).json({ success: false, message: 'Portfolio not found' });
    }

    portfolio.github = {
      connected: false,
      username: '',
      accessToken: '',
      repositories: [],
      stats: {},
      pinnedRepos: [],
      autoSync: false
    };

    await portfolio.save();

    res.status(200).json({ success: true, message: 'GitHub disconnected' });
  } catch (error) {
    console.error('Disconnect GitHub error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Export to LinkedIn format
 * @route   GET /api/portfolios/export/linkedin
 * @access  Private
 */
exports.exportToLinkedIn = async (req, res) => {
  try {
    const { format = 'json' } = req.query;
    
    const portfolio = await Portfolio.findOne({ user: req.user._id })
      .populate('certifications.certificate')
      .populate('user', 'name email');

    if (!portfolio) {
      return res.status(404).json({ success: false, message: 'Portfolio not found' });
    }

    const certificates = await Certificate.find({ user: req.user._id });

    let exportData;
    let contentType;
    let filename;

    switch (format) {
      case 'text':
        exportData = linkedinService.generateProfileText(portfolio, req.user, certificates);
        contentType = 'text/plain';
        filename = 'linkedin-profile.txt';
        break;
      
      case 'csv':
        exportData = linkedinService.generateCSV(portfolio, req.user, certificates);
        contentType = 'text/csv';
        filename = 'linkedin-profile.csv';
        break;
      
      case 'json':
      default:
        exportData = linkedinService.generateExportData(portfolio, req.user, certificates);
        contentType = 'application/json';
        filename = 'linkedin-profile.json';
        exportData = JSON.stringify(exportData, null, 2);
        break;
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(exportData);
  } catch (error) {
    console.error('LinkedIn export error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Get portfolio analytics
 * @route   GET /api/portfolios/analytics
 * @access  Private
 */
exports.getAnalytics = async (req, res) => {
  try {
    const { timeRange = '30' } = req.query; // days
    const daysAgo = parseInt(timeRange);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    const portfolio = await Portfolio.findOne({ user: req.user._id });

    if (!portfolio) {
      return res.status(404).json({ success: false, message: 'Portfolio not found' });
    }

    // Get analytics data
    const analytics = await PortfolioAnalytics.find({
      portfolio: portfolio._id,
      visitDate: { $gte: startDate }
    });

    // Calculate metrics
    const totalViews = analytics.length;
    const uniqueVisitors = new Set(analytics.map(a => a.visitorId)).size;
    
    // Views over time (grouped by day)
    const viewsByDay = {};
    analytics.forEach(visit => {
      const day = visit.visitDate.toISOString().split('T')[0];
      viewsByDay[day] = (viewsByDay[day] || 0) + 1;
    });

    // Top referrers
    const referrerCounts = {};
    analytics.forEach(visit => {
      const source = visit.referrer?.source || 'direct';
      referrerCounts[source] = (referrerCounts[source] || 0) + 1;
    });
    const topReferrers = Object.entries(referrerCounts)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Device breakdown
    const deviceCounts = {};
    analytics.forEach(visit => {
      const device = visit.device?.type || 'unknown';
      deviceCounts[device] = (deviceCounts[device] || 0) + 1;
    });

    // Location breakdown
    const locationCounts = {};
    analytics.forEach(visit => {
      const country = visit.location?.country || 'unknown';
      locationCounts[country] = (locationCounts[country] || 0) + 1;
    });
    const topLocations = Object.entries(locationCounts)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Interaction metrics
    let projectClicks = 0;
    let resumeDownloads = 0;
    let contactSubmissions = 0;

    analytics.forEach(visit => {
      visit.interactions?.forEach(interaction => {
        if (interaction.type === 'project-click') projectClicks++;
        if (interaction.type === 'resume-download') resumeDownloads++;
        if (interaction.type === 'contact-submit') contactSubmissions++;
      });
    });

    // Average session duration
    const avgSessionDuration = analytics.reduce((sum, a) => sum + (a.sessionDuration || 0), 0) / (analytics.length || 1);

    res.status(200).json({
      success: true,
      analytics: {
        overview: {
          totalViews: portfolio.analytics.totalViews || 0,
          uniqueVisitors: portfolio.analytics.uniqueVisitors || 0,
          averageTimeOnPage: Math.round(avgSessionDuration),
          bounceRate: portfolio.analytics.bounceRate || 0,
          projectClicks: portfolio.analytics.projectClicks || 0,
          resumeDownloads: portfolio.analytics.resumeDownloads || 0,
          contactFormSubmissions: portfolio.analytics.contactFormSubmissions || 0
        },
        timeRange: {
          days: daysAgo,
          totalViews,
          uniqueVisitors,
          viewsByDay,
          avgSessionDuration: Math.round(avgSessionDuration)
        },
        traffic: {
          topReferrers,
          topLocations,
          devices: deviceCounts
        },
        engagement: {
          projectClicks,
          resumeDownloads,
          contactSubmissions
        }
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Track portfolio interaction
 * @route   POST /api/portfolios/track
 * @access  Public
 */
exports.trackInteraction = async (req, res) => {
  try {
    const { portfolioId, type, target, metadata } = req.body;

    const portfolio = await Portfolio.findById(portfolioId);

    if (!portfolio) {
      return res.status(404).json({ success: false, message: 'Portfolio not found' });
    }

    // Update portfolio analytics
    if (type === 'project-click') {
      portfolio.analytics.projectClicks++;
    } else if (type === 'resume-download') {
      portfolio.analytics.resumeDownloads++;
    } else if (type === 'contact-submit') {
      portfolio.analytics.contactFormSubmissions++;
    }

    await portfolio.save();

    // Track in analytics collection
    const visitorId = req.headers['x-visitor-id'] || req.ip;
    const sessionId = req.headers['x-session-id'] || crypto.randomBytes(16).toString('hex');

    await PortfolioAnalytics.findOneAndUpdate(
      { sessionId, portfolio: portfolioId },
      {
        $push: {
          interactions: {
            type,
            target,
            timestamp: new Date(),
            metadata
          }
        }
      },
      { upsert: true }
    );

    res.status(200).json({ success: true, message: 'Interaction tracked' });
  } catch (error) {
    console.error('Track interaction error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Check slug availability
 * @route   GET /api/portfolios/check-slug/:slug
 * @access  Private
 */
exports.checkSlugAvailability = async (req, res) => {
  try {
    const { slug } = req.params;
    
    const exists = await Portfolio.findOne({ 
      slug, 
      user: { $ne: req.user._id } 
    });

    res.status(200).json({ 
      success: true, 
      available: !exists,
      slug
    });
  } catch (error) {
    console.error('Check slug error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Generate slugs for portfolios that don't have them
 * @route   POST /api/portfolios/generate-slugs
 * @access  Private
 */
exports.generateSlugs = async (req, res) => {
  try {
    console.log('=== Generate Slugs API Call ===');
    
    // Find portfolios without slugs
    const portfoliosWithoutSlugs = await Portfolio.find({ 
      $or: [
        { slug: { $exists: false } },
        { slug: null },
        { slug: '' }
      ]
    }).populate('user', 'name');
    
    console.log('📊 Found portfolios without slugs:', portfoliosWithoutSlugs.length);
    
    const updates = [];
    
    for (const portfolio of portfoliosWithoutSlugs) {
      if (portfolio.user && portfolio.user.name) {
        // Generate slug from user name
        let baseSlug = portfolio.user.name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
        
        // Ensure uniqueness
        let slug = baseSlug;
        let counter = 1;
        
        while (await Portfolio.findOne({ slug, _id: { $ne: portfolio._id } })) {
          slug = `${baseSlug}-${counter}`;
          counter++;
        }
        
        // Update portfolio with slug
        await Portfolio.findByIdAndUpdate(portfolio._id, { slug });
        updates.push({ portfolioId: portfolio._id, slug, userName: portfolio.user.name });
        
        console.log(`✅ Generated slug "${slug}" for ${portfolio.user.name}`);
      }
    }
    
    res.status(200).json({
      success: true,
      message: `Generated slugs for ${updates.length} portfolios`,
      updates
    });
    
  } catch (error) {
    console.error('❌ Generate slugs error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Helper functions
async function trackPortfolioView(portfolioId, req) {
  try {
    const visitorId = req.headers['x-visitor-id'] || req.ip;
    const sessionId = req.headers['x-session-id'] || crypto.randomBytes(16).toString('hex');

    // Parse user agent for device info
    const userAgent = req.headers['user-agent'] || '';
    const deviceType = /mobile/i.test(userAgent) ? 'mobile' : /tablet/i.test(userAgent) ? 'tablet' : 'desktop';

    await PortfolioAnalytics.create({
      portfolio: portfolioId,
      visitDate: new Date(),
      visitorId,
      sessionId,
      ipAddress: req.ip,
      userAgent,
      device: {
        type: deviceType
      },
      referrer: {
        source: req.headers.referer ? new URL(req.headers.referer).hostname : 'direct',
        url: req.headers.referer
      }
    });

    // Update portfolio view count
    await Portfolio.findByIdAndUpdate(portfolioId, {
      $inc: { 'analytics.totalViews': 1 }
    });
  } catch (error) {
    console.error('Track view error:', error);
  }
}

function encryptToken(token) {
  // In production, use proper encryption (e.g., crypto.createCipher)
  // For now, just return the token (should be encrypted in real app)
  return token;
}

function decryptToken(encryptedToken) {
  // In production, use proper decryption
  return encryptedToken;
}

module.exports = exports;
