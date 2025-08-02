const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  sender_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  type: { 
    type: String, 
    enum: ['payment_completed', 'booking_confirmed', 'booking_rejected', 'new_message', 'new_booking_request'],
    required: true 
  },
  title: { 
    type: String, 
    required: true 
  },
  message: { 
    type: String, 
    required: true 
  },
  related_booking_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Booking' 
  },
  related_payment_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Payment' 
  },
  related_property_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Property' 
  },
  is_read: { 
    type: Boolean, 
    default: false 
  },
  created_at: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema); 