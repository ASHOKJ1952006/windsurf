const User = require('../models/User');
const Enrollment = require('../models/Enrollment');

// @desc    Get user profile
// @route   GET /api/users/profile/:id or GET /api/users/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    // Use the ID from params if provided, otherwise use the authenticated user's ID
    const userId = req.params.id || req.user.id;
    
    // Validate user ID
    if (!userId || userId === 'undefined' || userId === 'null') {
      return res.status(400).json({ message: 'Invalid user ID provided' });
    }

    const user = await User.findById(userId)
      .populate('followers', 'name profilePicture')
      .populate('following', 'name profilePicture')
      .populate('wishlist', 'title description category level averageRating totalDuration enrolledCount');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's completed courses
    const completedCourses = await Enrollment.find({
      student: user._id,
      isCompleted: true
    }).populate('course', 'title thumbnail');

    res.json({
      success: true,
      user,
      completedCourses: completedCourses.length,
      certificates: completedCourses.filter(e => e.certificateUrl).length
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { 
      name, 
      email, 
      bio, 
      skills, 
      goals, 
      interests, 
      wishlist, 
      darkMode, 
      language, 
      emailNotifications, 
      instructorBio,
      phone,
      website,
      linkedin,
      github,
      twitter
    } = req.body;

    const user = await User.findById(req.user.id);

    if (name) user.name = name;
    if (email) {
      // Check if email is already taken by another user
      const existingUser = await User.findOne({ email, _id: { $ne: req.user.id } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email is already taken' });
      }
      user.email = email;
    }
    if (bio !== undefined) user.bio = bio;
    if (skills) user.skills = skills;
    if (goals) user.goals = goals;
    if (interests) user.interests = interests;
    if (wishlist) user.wishlist = wishlist.map(course => course._id || course);
    if (darkMode !== undefined) user.darkMode = darkMode;
    if (language) user.language = language;
    if (emailNotifications !== undefined) user.emailNotifications = emailNotifications;
    if (instructorBio !== undefined) user.instructorBio = instructorBio;
    if (phone !== undefined) user.phone = phone;
    if (website !== undefined) user.website = website;
    if (linkedin !== undefined) user.linkedin = linkedin;
    if (github !== undefined) user.github = github;
    if (twitter !== undefined) user.twitter = twitter;

    user.updatedAt = Date.now();
    await user.save();

    // Populate wishlist for response
    await user.populate('wishlist', 'title description category level averageRating totalDuration enrolledCount');

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload profile picture
// @route   POST /api/users/profile/picture
// @access  Private
exports.uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const user = await User.findById(req.user.id);
    user.profilePicture = `/uploads/profiles/${req.file.filename}`;
    await user.save();

    res.json({ success: true, profilePicture: user.profilePicture });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get leaderboard
// @route   GET /api/users/leaderboard
// @access  Private
exports.getLeaderboard = async (req, res) => {
  try {
    const { type = 'xp', limit = 50 } = req.query;

    let sortField = 'xp';
    if (type === 'streak') sortField = 'streak.current';
    if (type === 'courses') sortField = 'totalStudents';

    const users = await User.find()
      .sort({ [sortField]: -1 })
      .limit(parseInt(limit))
      .select('name profilePicture xp level streak badges');

    res.json({ success: true, leaderboard: users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Follow user
// @route   POST /api/users/follow/:id
// @access  Private
exports.followUser = async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);

    if (!userToFollow) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (currentUser.following.includes(userToFollow._id)) {
      return res.status(400).json({ message: 'Already following this user' });
    }

    currentUser.following.push(userToFollow._id);
    userToFollow.followers.push(currentUser._id);

    await currentUser.save();
    await userToFollow.save();

    res.json({ success: true, message: 'User followed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Unfollow user
// @route   POST /api/users/unfollow/:id
// @access  Private
exports.unfollowUser = async (req, res) => {
  try {
    const userToUnfollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);

    if (!userToUnfollow) {
      return res.status(404).json({ message: 'User not found' });
    }

    currentUser.following = currentUser.following.filter(
      id => id.toString() !== userToUnfollow._id.toString()
    );
    userToUnfollow.followers = userToUnfollow.followers.filter(
      id => id.toString() !== currentUser._id.toString()
    );

    await currentUser.save();
    await userToUnfollow.save();

    res.json({ success: true, message: 'User unfollowed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
