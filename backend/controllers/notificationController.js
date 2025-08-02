const Notification = require('../models/Notification');
const User = require('../models/User');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');

// Create notification
exports.createNotification = async (recipientId, type, title, message, options = {}) => {
  try {
    const notification = await Notification.create({
      recipient_id: recipientId,
      sender_id: options.senderId,
      type,
      title,
      message,
      related_booking_id: options.bookingId,
      related_payment_id: options.paymentId,
      related_property_id: options.propertyId
    });

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Get notifications for a user
exports.getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const notifications = await Notification.find({ recipient_id: userId })
      .populate('sender_id', 'name')
      .populate('related_booking_id')
      .populate('related_payment_id')
      .populate('related_property_id', 'title')
      .sort({ created_at: -1 })
      .limit(50);

    res.json(notifications);
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({ error: error.message });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient_id: userId },
      { is_read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification marked as read', notification });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: error.message });
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await Notification.updateMany(
      { recipient_id: userId, is_read: false },
      { is_read: true }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get unread notification count
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const count = await Notification.countDocuments({
      recipient_id: userId,
      is_read: false
    });

    res.json({ unreadCount: count });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ error: error.message });
  }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      recipient_id: userId
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: error.message });
  }
};

// Notify owner when payment is completed
exports.notifyPaymentCompleted = async (paymentId) => {
  try {
    const payment = await Payment.findById(paymentId)
      .populate('owner_id', 'name')
      .populate('renter_id', 'name')
      .populate('booking_id')
      .populate({
        path: 'booking_id',
        populate: {
          path: 'property_id',
          select: 'title'
        }
      });

    if (!payment) {
      throw new Error('Payment not found');
    }

    const title = 'Payment Completed';
    const message = `${payment.renter_id.name} has completed the payment of ₹${payment.amount.toLocaleString()} for ${payment.booking_id.property_id.title}`;

    await this.createNotification(
      payment.owner_id._id,
      'payment_completed',
      title,
      message,
      {
        senderId: payment.renter_id._id,
        paymentId: payment._id,
        bookingId: payment.booking_id._id,
        propertyId: payment.booking_id.property_id._id
      }
    );

    console.log(`Payment completion notification sent to owner: ${payment.owner_id.name}`);
  } catch (error) {
    console.error('Error notifying payment completion:', error);
  }
};

// Notify renter when booking is confirmed
exports.notifyBookingConfirmed = async (bookingId) => {
  try {
    const booking = await Booking.findById(bookingId)
      .populate('owner_id', 'name')
      .populate('renter_id', 'name')
      .populate('property_id', 'title');

    if (!booking) {
      throw new Error('Booking not found');
    }

    const title = 'Booking Confirmed';
    const message = `Your booking for ${booking.property_id.title} has been confirmed by ${booking.owner_id.name}`;

    await this.createNotification(
      booking.renter_id._id,
      'booking_confirmed',
      title,
      message,
      {
        senderId: booking.owner_id._id,
        bookingId: booking._id,
        propertyId: booking.property_id._id
      }
    );

    console.log(`Booking confirmation notification sent to renter: ${booking.renter_id.name}`);
  } catch (error) {
    console.error('Error notifying booking confirmation:', error);
  }
};

// Notify renter when booking is rejected
exports.notifyBookingRejected = async (bookingId) => {
  try {
    const booking = await Booking.findById(bookingId)
      .populate('owner_id', 'name')
      .populate('renter_id', 'name')
      .populate('property_id', 'title');

    if (!booking) {
      throw new Error('Booking not found');
    }

    const title = 'Booking Rejected';
    const message = `Your booking for ${booking.property_id.title} has been rejected by ${booking.owner_id.name}`;

    await this.createNotification(
      booking.renter_id._id,
      'booking_rejected',
      title,
      message,
      {
        senderId: booking.owner_id._id,
        bookingId: booking._id,
        propertyId: booking.property_id._id
      }
    );

    console.log(`Booking rejection notification sent to renter: ${booking.renter_id.name}`);
  } catch (error) {
    console.error('Error notifying booking rejection:', error);
  }
}; 