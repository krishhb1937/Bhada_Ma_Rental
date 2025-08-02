const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  property_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Property', required: true 
},
  renter_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', required: true 
},
  owner_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', required: true 
},
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'rejected'], 
    default: 'pending' 
},
  booking_date: { 
    type: Date, 
    default: Date.now
},
  move_in_date: { 
    type: Date, 
    required: true 
},
  total_amount: { 
    type: Number, 
    required: true 
}
});

module.exports = mongoose.model('Booking', bookingSchema);
