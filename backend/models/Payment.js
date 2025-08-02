const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  booking_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Booking', 
    required: true 
  },
  renter_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  owner_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'failed'], 
    default: 'pending' 
  },
  payment_method: { 
    type: String, 
    enum: ['qr_code', 'bank_transfer', 'cash'], 
    default: 'qr_code' 
  },
  qr_code_url: { 
    type: String 
  },
  payment_date: { 
    type: Date, 
    default: Date.now 
  },
  transaction_id: { 
    type: String 
  },
  notes: { 
    type: String 
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Payment', paymentSchema); 