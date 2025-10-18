const Mentorship = require('../models/Mentorship');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Get mentorships
// @route   GET /api/mentorships
// @access  Private
exports.getMentorships = async (req, res) => {
  try {
    const { role = 'all', status } = req.query;

    let query = {};

    if (role === 'mentor') {
      query.mentor = req.user.id;
    } else if (role === 'mentee') {
      query.mentee = req.user.id;
    } else {
      query.$or = [{ mentor: req.user.id }, { mentee: req.user.id }];
    }

    if (status) {
      query.status = status;
    }

    const mentorships = await Mentorship.find(query)
      .populate('mentor', 'name profilePicture bio')
      .populate('mentee', 'name profilePicture')
      .populate('participants', 'name profilePicture')
      .sort({ scheduledAt: -1 });

    res.json({ success: true, mentorships });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single mentorship
// @route   GET /api/mentorships/:id
// @access  Private
exports.getMentorship = async (req, res) => {
  try {
    const mentorship = await Mentorship.findById(req.params.id)
      .populate('mentor', 'name profilePicture bio email')
      .populate('mentee', 'name profilePicture email')
      .populate('participants', 'name profilePicture');

    if (!mentorship) {
      return res.status(404).json({ message: 'Mentorship not found' });
    }

    // Check authorization
    const isMentor = mentorship.mentor._id.toString() === req.user.id;
    const isMentee = mentorship.mentee._id.toString() === req.user.id;
    const isParticipant = mentorship.participants.some(
      p => p._id.toString() === req.user.id
    );

    if (!isMentor && !isMentee && !isParticipant) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json({ success: true, mentorship });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create mentorship request
// @route   POST /api/mentorships
// @access  Private
exports.createMentorship = async (req, res) => {
  try {
    const { mentor, topic, description, scheduledAt, duration, isGroupSession, participants } = req.body;

    const mentorship = await Mentorship.create({
      mentor,
      mentee: req.user.id,
      topic,
      description,
      scheduledAt,
      duration,
      isGroupSession,
      participants: isGroupSession ? participants : [],
      roomId: `mentorship-${Date.now()}`
    });

    // Create notification for mentor
    await Notification.create({
      recipient: mentor,
      sender: req.user.id,
      type: 'mentorship',
      title: 'New Mentorship Request',
      message: `${req.user.name} has requested a mentorship session on "${topic}"`,
      link: `/mentorships/${mentorship._id}`
    });

    res.status(201).json({ success: true, mentorship });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update mentorship
// @route   PUT /api/mentorships/:id
// @access  Private
exports.updateMentorship = async (req, res) => {
  try {
    let mentorship = await Mentorship.findById(req.params.id);

    if (!mentorship) {
      return res.status(404).json({ message: 'Mentorship not found' });
    }

    const isMentor = mentorship.mentor.toString() === req.user.id;
    const isMentee = mentorship.mentee.toString() === req.user.id;

    if (!isMentor && !isMentee) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    mentorship = await Mentorship.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );

    // Notify on status change
    if (req.body.status) {
      const recipient = isMentor ? mentorship.mentee : mentorship.mentor;
      await Notification.create({
        recipient,
        sender: req.user.id,
        type: 'mentorship',
        title: 'Mentorship Update',
        message: `Your mentorship session status has been updated to: ${req.body.status}`,
        link: `/mentorships/${mentorship._id}`
      });
    }

    res.json({ success: true, mentorship });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Submit feedback
// @route   POST /api/mentorships/:id/feedback
// @access  Private
exports.submitFeedback = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    const mentorship = await Mentorship.findById(req.params.id);

    if (!mentorship) {
      return res.status(404).json({ message: 'Mentorship not found' });
    }

    if (mentorship.mentee.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only mentee can submit feedback' });
    }

    if (mentorship.status !== 'completed') {
      return res.status(400).json({ message: 'Can only submit feedback for completed sessions' });
    }

    mentorship.feedback = {
      rating,
      comment,
      submittedAt: new Date()
    };

    await mentorship.save();

    // Update mentor rating
    const mentor = await User.findById(mentorship.mentor);
    const allMentorships = await Mentorship.find({
      mentor: mentor._id,
      'feedback.rating': { $exists: true }
    });

    const totalRating = allMentorships.reduce((sum, m) => sum + m.feedback.rating, 0);
    mentor.instructorRating = totalRating / allMentorships.length;
    await mentor.save();

    res.json({ success: true, mentorship });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
