const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true
},
  password: { 
    type: String, 
    required: true,
    minlength: 6,
},
  name: { 
    type: String 
},
  phone: { 
    type: String
},
  user_type: { 
    type: String, 
    enum: ['renter', 'owner'], 
    default: 'renter' 
},
    profile_photo: { 
    type: String 
  },
  qr_code: { 
    type: String 
  },
  upi_id: { 
    type: String 
  },
  bank_details: {
    account_number: { type: String },
    ifsc_code: { type: String },
    bank_name: { type: String }
  },
  created_date: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('User', userSchema);
