const express = require('express');
const router = express.Router();
const mongoose = require('mongoose')
const Message = require('../models/message');
const auth = require('../middlewares/authMiddleware');

// Send a new message
router.post('/', auth, async (req, res) => {
  try {
    const { receiver_id, property_id, message_text } = req.body;

    // Validate input
    if (!receiver_id || !property_id || !message_text) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (message_text.trim().length === 0) {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }

    if (message_text.length > 1000) {
      return res.status(400).json({ message: 'Message too long (max 1000 characters)' });
    }

    const message = await Message.create({
      sender_id: req.user.id,
      receiver_id,
      property_id,
      message_text: message_text.trim()
    });

    // Populate sender and receiver info
    const populatedMessage = await Message.findById(message._id)
      .populate('sender_id', 'name email')
      .populate('receiver_id', 'name email');

    res.status(201).json(populatedMessage);
  } catch (err) {
    console.error('Message creation error:', err);
    res.status(400).json({ message: 'Send failed', error: err.message });
  }
});

// Get conversation messages between two users for a specific property
router.get('/:propertyId/:userId', auth, async (req, res) => {
  try {
    const { propertyId, userId } = req.params;

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(propertyId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid property or user ID' });
    }

    const messages = await Message.find({
      property_id: propertyId,
      $or: [
        {
          sender_id: req.user.id,
          receiver_id: userId
        },
        {
          sender_id: userId,
          receiver_id: req.user.id
        }
      ]
    })
    .populate('sender_id', 'name email')
    .populate('receiver_id', 'name email')
    .sort({ sent_date: 1 });

    res.json(messages);
  } catch (err) {
    console.error('Fetch messages error:', err);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
});

// Get all conversations for the current user
router.get('/conversations', auth, async (req, res) => {
  try {
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender_id: new mongoose.Types.ObjectId(req.user.id) },
            { receiver_id: new mongoose.Types.ObjectId(req.user.id) }
          ]
        }
      },
      {
        $sort: { sent_date: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender_id', new mongoose.Types.ObjectId(req.user.id)] },
              { otherUser: '$receiver_id', property: '$property_id' },
              { otherUser: '$sender_id', property: '$property_id' }
            ]
          },
          lastMessage: { $first: '$$ROOT' },
          messageCount: { $sum: 1 }
        }
      },
      {
        $sort: { 'lastMessage.sent_date': -1 }
      }
    ]);

    // Populate user and property information
    const populatedConversations = await Message.populate(conversations, [
      { path: '_id.otherUser', select: 'name email' },
      { path: '_id.property', select: 'title address' },
      { path: 'lastMessage.sender_id', select: 'name email' },
      { path: 'lastMessage.receiver_id', select: 'name email' }
    ]);

    res.json(populatedConversations);
  } catch (err) {
    console.error('Fetch conversations error:', err);
    res.status(500).json({ message: 'Failed to fetch conversations' });
  }
});

// Mark messages as read
router.put('/read/:propertyId/:userId', auth, async (req, res) => {
  try {
    const { propertyId, userId } = req.params;

    const result = await Message.updateMany(
      {
        property_id: propertyId,
        sender_id: userId,
        receiver_id: req.user.id,
        is_read: false
      },
      { is_read: true }
    );

    res.json({ message: 'Messages marked as read', updatedCount: result.modifiedCount });
  } catch (err) {
    console.error('Mark as read error:', err);
    res.status(500).json({ message: 'Failed to mark messages as read' });
  }
});

// Get unread message count
router.get('/unread/count', auth, async (req, res) => {
  try {
    const count = await Message.countDocuments({
      receiver_id: req.user.id,
      is_read: false
    });

    res.json({ unreadCount: count });
  } catch (err) {
    console.error('Unread count error:', err);
    res.status(500).json({ message: 'Failed to get unread count' });
  }
});

module.exports = router;
