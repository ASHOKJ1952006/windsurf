const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (id) => {
  const secret = process.env.JWT_SECRET || 'fallback-jwt-secret-for-development';
  return jwt.sign({ id }, secret, {
    expiresIn: '7d'
  });
};

// @desc    Bootstrap first admin (development helper)
// @route   POST /api/auth/bootstrap-admin
// @access  Public (guarded by env and one-time admin existence check)
exports.bootstrapAdmin = async (req, res) => {
  try {
    if (process.env.ALLOW_BOOTSTRAP_ADMIN === 'false') {
      return res.status(403).json({ message: 'Bootstrap admin is disabled' });
    }

    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin already exists' });
    }

    const {
      name = 'Admin',
      email = 'admin@elearn.local',
      password = 'Admin@12345'
    } = req.body || {};

    const user = await User.create({ name, email, password, role: 'admin' });

    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    return res.status(201).json({
      success: true,
      message: 'Admin account created',
      credentials: { email, password },
      token,
      refreshToken,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Generate Refresh Token
const generateRefreshToken = (id) => {
  const secret = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret-for-development';
  return jwt.sign({ id }, secret, {
    expiresIn: '30d'
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'student'
    });

    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.status(201).json({
      success: true,
      token,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user
    let user = await User.findOne({ email }).select('+password');

    // Bootstrap admin on-the-fly if enabled, no admin exists yet, and default creds used
    if (!user) {
      const allowBootstrap = process.env.ALLOW_BOOTSTRAP_ADMIN !== 'false';
      const hasAnyAdmin = await User.exists({ role: 'admin' });
      const defaultEmail = process.env.BOOTSTRAP_ADMIN_EMAIL || 'admin@elearn.local';
      const defaultPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD || 'Admin@12345';

      if (allowBootstrap && !hasAnyAdmin && email === defaultEmail && password === defaultPassword) {
        user = await User.create({ name: 'Admin', email: defaultEmail, password: defaultPassword, role: 'admin' });
        // Refetch with password excluded behavior handled below
        user = await User.findById(user._id).select('+password');
      } else if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update streak
    user.updateStreak();
    await user.save();

    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.json({
      success: true,
      token,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        xp: user.xp,
        level: user.level,
        streak: user.streak
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
};

// @desc    Refresh token
// @route   POST /api/auth/refresh
// @access  Public
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: 'No refresh token provided' });
    }

    const secret = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret-for-development';
    const decoded = jwt.verify(refreshToken, secret);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const newToken = generateToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    res.json({
      success: true,
      token: newToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ success: true, user });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ message: error.message });
  }
};
