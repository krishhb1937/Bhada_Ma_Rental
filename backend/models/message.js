const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', required: true 
},
  receiver_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
},
  property_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Property', 
    required: true 
},
  message_text: { 
    type: String, 
    required: true 
},
  sent_date: { 
    type: Date, 
    default: Date.now 
},
  is_read: { 
    type: Boolean, 
    default: false 
}
});

module.exports = mongoose.model('Message', messageSchema);
