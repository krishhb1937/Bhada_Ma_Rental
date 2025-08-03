const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  owner_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  title: { 
    type: String, 
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: { 
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  price: { 
    type: Number, 
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  location: { 
    type: String, 
    required: [true, 'Location is required'],
    trim: true,
    maxlength: [200, 'Location cannot exceed 200 characters']
  },
  property_type: { 
    type: String, 
    enum: {
      values: ['villa', 'mansion', 'penthouse', 'beach-house', 'apartment', 'luxury-apartment'],
      message: 'Property type must be villa, mansion, penthouse, beach-house, apartment, or luxury-apartment'
    },
    required: [true, 'Property type is required']
  },
  bedrooms: { 
    type: Number,
    min: [0, 'Bedrooms cannot be negative'],
    default: 0
  },
  bathrooms: { 
    type: Number,
    min: [0, 'Bathrooms cannot be negative'],
    default: 0
  },
  photos: [{ 
    type: String,
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'Photo URL cannot be empty'
    }
  }], 
  status: { 
    type: String, 
    enum: {
      values: ['available', 'rented'],
      message: 'Status must be available or rented'
    },
    default: 'available' 
  },
  created_date: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true // Adds createdAt and updatedAt fields automatically
});

// Add index for better query performance
propertySchema.index({ owner_id: 1, created_date: -1 });
propertySchema.index({ location: 1 });
propertySchema.index({ property_type: 1 });
propertySchema.index({ price: 1 });

module.exports = mongoose.model('Property', propertySchema);
