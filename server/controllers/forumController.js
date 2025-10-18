const ForumPost = require('../models/Forum');
const User = require('../models/User');

// @desc    Get all forum posts
// @route   GET /api/forums
// @access  Public
exports.getPosts = async (req, res) => {
  try {
    const { category, tags, search, sort = 'recent', page = 1, limit = 20 } = req.query;

    const query = {};

    if (category) query.category = category;
    if (tags) query.tags = { $in: tags.split(',') };
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'popular') sortOption = { upvotes: -1, views: -1 };
    if (sort === 'unanswered') query['answers.0'] = { $exists: false };

    const posts = await ForumPost.find(query)
      .populate('author', 'name profilePicture xp level')
      .populate('course', 'title')
      .sort(sortOption)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await ForumPost.countDocuments(query);

    res.json({
      success: true,
      posts,
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

// @desc    Get single post
// @route   GET /api/forums/:id
// @access  Public
exports.getPost = async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id)
      .populate('author', 'name profilePicture xp level badges')
      .populate('course', 'title')
      .populate('answers.author', 'name profilePicture xp level')
      .populate('answers.comments.author', 'name profilePicture');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Increment views
    post.views += 1;
    await post.save();

    res.json({ success: true, post });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create post
// @route   POST /api/forums
// @access  Private
exports.createPost = async (req, res) => {
  try {
    const { title, content, category, tags, course } = req.body;

    const post = await ForumPost.create({
      title,
      content,
      category,
      tags,
      course,
      author: req.user.id
    });

    // Award XP
    const user = await User.findById(req.user.id);
    user.xp += 5;
    await user.save();

    res.status(201).json({ success: true, post });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update post
// @route   PUT /api/forums/:id
// @access  Private
exports.updatePost = async (req, res) => {
  try {
    let post = await ForumPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    post = await ForumPost.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );

    res.json({ success: true, post });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete post
// @route   DELETE /api/forums/:id
// @access  Private
exports.deletePost = async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await post.deleteOne();
    res.json({ success: true, message: 'Post deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add answer
// @route   POST /api/forums/:id/answers
// @access  Private
exports.addAnswer = async (req, res) => {
  try {
    const { content } = req.body;

    const post = await ForumPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    post.answers.push({
      author: req.user.id,
      content
    });

    await post.save();

    // Award XP
    const user = await User.findById(req.user.id);
    user.xp += 10;
    await user.save();

    res.status(201).json({ success: true, post });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update answer
// @route   PUT /api/forums/:postId/answers/:answerId
// @access  Private
exports.updateAnswer = async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const answer = post.answers.id(req.params.answerId);

    if (!answer) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    if (answer.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    answer.content = req.body.content;
    answer.updatedAt = Date.now();

    await post.save();

    res.json({ success: true, post });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Accept answer
// @route   POST /api/forums/:postId/answers/:answerId/accept
// @access  Private
exports.acceptAnswer = async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only post author can accept answers' });
    }

    // Unaccept all other answers
    post.answers.forEach(ans => {
      ans.isAccepted = false;
    });

    const answer = post.answers.id(req.params.answerId);
    if (answer) {
      answer.isAccepted = true;

      // Award XP to answer author
      const answerAuthor = await User.findById(answer.author);
      if (answerAuthor) {
        answerAuthor.xp += 20;
        await answerAuthor.save();
      }
    }

    await post.save();

    res.json({ success: true, post });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upvote post
// @route   POST /api/forums/:id/upvote
// @access  Private
exports.upvotePost = async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const index = post.upvotes.indexOf(req.user.id);

    if (index > -1) {
      post.upvotes.splice(index, 1);
    } else {
      post.upvotes.push(req.user.id);
    }

    await post.save();

    res.json({ success: true, upvotes: post.upvotes.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upvote answer
// @route   POST /api/forums/:postId/answers/:answerId/upvote
// @access  Private
exports.upvoteAnswer = async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const answer = post.answers.id(req.params.answerId);

    if (!answer) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    const index = answer.upvotes.indexOf(req.user.id);

    if (index > -1) {
      answer.upvotes.splice(index, 1);
    } else {
      answer.upvotes.push(req.user.id);
    }

    await post.save();

    res.json({ success: true, upvotes: answer.upvotes.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add comment to answer
// @route   POST /api/forums/:postId/answers/:answerId/comments
// @access  Private
exports.addComment = async (req, res) => {
  try {
    const { content } = req.body;

    const post = await ForumPost.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const answer = post.answers.id(req.params.answerId);

    if (!answer) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    answer.comments.push({
      author: req.user.id,
      content
    });

    await post.save();

    res.status(201).json({ success: true, post });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
