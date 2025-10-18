const Course = require('../models/Course');
const Review = require('../models/Review');
const User = require('../models/User');

// @desc    Get all courses
// @route   GET /api/courses
// @access  Public
exports.getCourses = async (req, res) => {
  try {
    const { category, level, search, sort, page = 1, limit = 12, instructor } = req.query;

    let query = {};

    // If instructor parameter is provided, get instructor's courses (including drafts)
    if (instructor) {
      // Validate instructor ID format
      if (!instructor.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({ message: 'Invalid instructor ID format' });
      }
      query.instructor = instructor;
    } else {
      // For public access, only show published and approved courses
      query = { status: 'published', isApproved: true };
    }

    if (category) query.category = category;
    if (level) query.level = level;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'popular') sortOption = { enrolledCount: -1 };
    if (sort === 'rating') sortOption = { averageRating: -1 };
    if (sort === 'newest') sortOption = { createdAt: -1 };

    const courses = await Course.find(query)
      .populate('instructor', 'name profilePicture instructorRating')
      .sort(sortOption)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Course.countDocuments(query);

    res.json({
      success: true,
      courses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Public
exports.getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'name profilePicture bio instructorRating totalStudents');

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.json({ success: true, course });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create course
// @route   POST /api/courses
// @access  Private (Instructor/Admin)
exports.createCourse = async (req, res) => {
  try {
    console.log('=== Create Course Request ===');
    console.log('User:', req.user);
    console.log('Body:', JSON.stringify(req.body, null, 2));
    
    if (!req.user || !req.user.id) {
      console.error('❌ No user found in request');
      return res.status(401).json({ 
        success: false,
        message: 'User authentication required' 
      });
    }

    // Validate required fields
    const { title, description, category } = req.body;
    
    if (!title || title.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Course title is required'
      });
    }
    
    if (!description || description.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Course description is required'
      });
    }
    
    if (!category || category.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Course category is required'
      });
    }

    // Validate category is in allowed enum values
    const allowedCategories = ['Web Development', 'Mobile Development', 'Data Science', 'Machine Learning', 'Design', 'Business', 'Marketing', 'Other'];
    if (!allowedCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Must be one of: ${allowedCategories.join(', ')}`
      });
    }

    const courseData = {
      ...req.body,
      instructor: req.user.id,
      title: title.trim(),
      description: description.trim(),
      category: category.trim()
    };

    // Set default status if not provided
    if (!courseData.status) {
      courseData.status = 'published';
    }

    // Auto-approve courses for now (you can change this logic later)
    if (courseData.status === 'published') {
      courseData.isApproved = true;
    }

    console.log('✅ Creating course with data:', {
      title: courseData.title,
      instructor: courseData.instructor,
      status: courseData.status,
      category: courseData.category
    });

    const course = await Course.create(courseData);
    
    // Calculate total duration
    course.calculateDuration();
    await course.save();

    // Populate instructor info for response
    await course.populate('instructor', 'name profilePicture instructorRating');

    console.log('✅ Course created successfully:', course._id);
    res.status(201).json({ success: true, course });
  } catch (error) {
    console.error('❌ Course creation error:', error);
    
    // Handle MongoDB validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    // Handle ObjectId casting errors
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: `Invalid ID format for field "${error.path}". Expected MongoDB ObjectId but received: ${error.value}`
      });
    }
    
    // Handle BSON errors (like invalid ObjectId)
    if (error.name === 'BSONError' || error.message.includes('Cast to ObjectId failed')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid data format. Please check that all IDs are valid MongoDB ObjectIds.'
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A course with this title already exists'
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private (Instructor/Admin)
exports.updateCourse = async (req, res) => {
  try {
    console.log('=== Update Course Request ===');
    console.log('Course ID:', req.params.id);
    console.log('User:', req.user?.id);
    console.log('Update data keys:', Object.keys(req.body));

    let course = await Course.findById(req.params.id);

    if (!course) {
      console.error('Course not found:', req.params.id);
      return res.status(404).json({ 
        success: false,
        message: 'Course not found' 
      });
    }

    console.log('Current instructor:', course.instructor.toString());
    console.log('Requesting user:', req.user.id);

    // Check ownership
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      console.error('Unauthorized update attempt');
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to update this course' 
      });
    }

    // Update course
    const updateData = {
      ...req.body,
      updatedAt: Date.now()
    };

    course = await Course.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('instructor', 'name profilePicture instructorRating');

    // Recalculate duration if modules updated
    if (req.body.modules) {
      console.log('Recalculating course duration...');
      course.calculateDuration();
      await course.save();
    }

    console.log('✅ Course updated successfully:', course._id);
    res.json({ success: true, course });
  } catch (error) {
    console.error('❌ Update course error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private (Instructor/Admin)
exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check ownership
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this course' });
    }

    await course.deleteOne();
    res.json({ success: true, message: 'Course deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload video
// @route   POST /api/courses/upload-video
// @access  Private (Instructor/Admin)
exports.uploadVideo = async (req, res) => {
  try {
    console.log('=== Video Upload Request ===');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('File:', req.file);
    console.log('User:', req.user?.id);
    
    if (!req.file) {
      console.log('❌ No file in request');
      return res.status(400).json({ 
        success: false,
        message: 'No video file uploaded',
        details: 'Make sure to send the file with fieldname "video"'
      });
    }

    console.log('✅ File received:', {
      originalname: req.file.originalname,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
      path: req.file.path
    });

    const videoUrl = `/uploads/videos/${req.file.filename}`;
    console.log('✅ Generated video URL:', videoUrl);
    
    res.json({ 
      success: true, 
      videoUrl,
      fileInfo: {
        originalName: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype
      }
    });
  } catch (error) {
    console.error('❌ Video upload error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// @desc    Upload thumbnail
// @route   POST /api/courses/upload-thumbnail
// @access  Private (Instructor/Admin)
exports.uploadThumbnail = async (req, res) => {
  try {
    console.log('Thumbnail upload request received');
    console.log('Request file:', req.file);
    console.log('Request body:', req.body);
    
    if (!req.file) {
      console.log('No file in request');
      return res.status(400).json({ message: 'No thumbnail file uploaded' });
    }

    const thumbnailUrl = `/uploads/thumbnails/${req.file.filename}`;
    console.log('Generated thumbnail URL:', thumbnailUrl);
    
    res.json({ success: true, thumbnailUrl });
  } catch (error) {
    console.error('Thumbnail upload error:', error);
    res.status(500).json({ message: error.message, stack: error.stack });
  }
};

// @desc    Add review
// @route   POST /api/courses/:id/reviews
// @access  Private (Student)
exports.addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    const review = await Review.create({
      course: req.params.id,
      student: req.user.id,
      rating,
      comment
    });

    // Update course rating
    const course = await Course.findById(req.params.id);
    await course.updateRating();

    res.status(201).json({ success: true, review });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'You have already reviewed this course' });
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get reviews
// @route   GET /api/courses/:id/reviews
// @access  Public
exports.getReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ course: req.params.id })
      .populate('student', 'name profilePicture')
      .sort({ createdAt: -1 });

    res.json({ success: true, reviews });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle wishlist
// @route   POST /api/courses/:id/wishlist
// @access  Private
exports.toggleWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const courseId = req.params.id;

    // Create wishlist field if doesn't exist
    if (!user.wishlist) {
      user.wishlist = [];
    }

    const index = user.wishlist.indexOf(courseId);
    if (index > -1) {
      user.wishlist.splice(index, 1);
      await user.save();
      return res.json({ success: true, message: 'Removed from wishlist', inWishlist: false });
    } else {
      user.wishlist.push(courseId);
      await user.save();
      return res.json({ success: true, message: 'Added to wishlist', inWishlist: true });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get wishlist
// @route   GET /api/courses/wishlist/my
// @access  Private
exports.getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'wishlist',
      populate: { path: 'instructor', select: 'name profilePicture' }
    });

    res.json({ success: true, wishlist: user.wishlist || [] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
