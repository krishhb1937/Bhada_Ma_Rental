const Property = require('../models/Property');

exports.createProperty = async (req, res) => {
  try {
    console.log('=== CREATE PROPERTY REQUEST ===');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('Files:', req.files ? req.files.length : 0);
    console.log('User:', req.user);
    
    const { title, description, price, location, property_type, bedrooms, bathrooms } = req.body;
    
    // Validate required fields
    if (!title || !price || !location || !property_type) {
      console.log('❌ Missing required fields:', { 
        title: !!title, 
        price: !!price, 
        location: !!location, 
        property_type: !!property_type 
      });
      return res.status(400).json({ 
        error: 'Missing required fields: title, price, location, and property_type are required' 
      });
    }

    console.log('✅ All required fields present');

    // Validate property_type
    const validPropertyTypes = ['villa', 'mansion', 'penthouse', 'beach-house', 'apartment', 'luxury-apartment'];
    if (!validPropertyTypes.includes(property_type)) {
      console.log('❌ Invalid property type:', property_type);
      return res.status(400).json({ 
        error: 'Invalid property_type. Must be one of: villa, mansion, penthouse, beach-house, apartment, luxury-apartment' 
      });
    }

    console.log('✅ Property type valid:', property_type);

    // Validate price is a positive number
    const priceNum = Number(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      console.log('❌ Invalid price:', price);
      return res.status(400).json({ 
        error: 'Price must be a positive number' 
      });
    }

    console.log('✅ Price valid:', priceNum);

    // Validate numeric fields
    const bedroomsNum = bedrooms ? Number(bedrooms) : 0;
    const bathroomsNum = bathrooms ? Number(bathrooms) : 0;
    
    if (bedrooms && (isNaN(bedroomsNum) || bedroomsNum < 0)) {
      console.log('❌ Invalid bedrooms:', bedrooms);
      return res.status(400).json({ 
        error: 'Bedrooms must be a non-negative number' 
      });
    }
    
    if (bathrooms && (isNaN(bathroomsNum) || bathroomsNum < 0)) {
      console.log('❌ Invalid bathrooms:', bathrooms);
      return res.status(400).json({ 
        error: 'Bathrooms must be a non-negative number' 
      });
    }

    console.log('✅ Numeric fields valid:', { bedrooms: bedroomsNum, bathrooms: bathroomsNum });

    // Handle photo uploads
    let photoPaths = [];
    if (req.files && req.files.length > 0) {
      photoPaths = req.files.map(file => `/uploads/${file.filename}`);
      console.log('✅ Photo paths:', photoPaths);
    } else {
      console.log('ℹ️ No photos uploaded');
    }

    const newProperty = new Property({
      owner_id: req.user.id,
      title: title.trim(),
      description: description ? description.trim() : '',
      price: priceNum,
      location: location.trim(),
      property_type,
      bedrooms: bedroomsNum,
      bathrooms: bathroomsNum,
      photos: photoPaths,
    });

    console.log('📝 Saving property:', newProperty);
    await newProperty.save();
    console.log('✅ Property saved successfully');
    
    res.status(201).json({ 
        message: 'Property added successfully', 
        property: newProperty 
    });
  } catch (error) {
    console.error('❌ Create property error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      console.log('❌ Validation errors:', validationErrors);
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validationErrors 
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      console.log('❌ Duplicate key error');
      return res.status(400).json({ 
        error: 'Property with this title already exists' 
      });
    }
    
    res.status(500).json({ error: 'Failed to create property. Please try again.' });
  }
};

exports.getAllProperties = async (req, res) => {
  try {
    const { location, minPrice, maxPrice, property_type } = req.query;

    let filters = {};

    if (location) {
      filters.location = { $regex: location, $options: 'i' };
    }

    if (minPrice && maxPrice) {
      filters.price = { $gte: Number(minPrice), $lte: Number(maxPrice) };
    } else if (minPrice) {
      filters.price = { $gte: Number(minPrice) };
    } else if (maxPrice) {
      filters.price = { $lte: Number(maxPrice) };
    }

    if (property_type) {
      filters.property_type = property_type;
    }

    const properties = await Property.find(filters).populate('owner_id', 'name _id');
    res.json(properties);
  } catch (error) {
    console.error('Get all properties error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getPropertyById = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id).populate('owner_id', 'name _id');
    if (!property) {
        return res.status(404).json({ message: 'Property not found' });
    }
    res.json(property);
  } catch (error) {
    console.error('Get property by ID error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    if (property.owner_id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Validate property_type if provided
    if (req.body.property_type) {
      const validPropertyTypes = ['villa', 'mansion', 'penthouse', 'beach-house', 'apartment', 'luxury-apartment'];
      if (!validPropertyTypes.includes(req.body.property_type)) {
        return res.status(400).json({ 
          error: 'Invalid property_type. Must be one of: villa, mansion, penthouse, beach-house, apartment, luxury-apartment' 
        });
      }
    }

    // Validate price if provided
    if (req.body.price) {
      const priceNum = Number(req.body.price);
      if (isNaN(priceNum) || priceNum <= 0) {
        return res.status(400).json({ 
          error: 'Price must be a positive number' 
        });
      }
      req.body.price = priceNum;
    }

    // Validate numeric fields
    if (req.body.bedrooms) {
      const bedroomsNum = Number(req.body.bedrooms);
      if (isNaN(bedroomsNum) || bedroomsNum < 0) {
        return res.status(400).json({ 
          error: 'Bedrooms must be a non-negative number' 
        });
      }
      req.body.bedrooms = bedroomsNum;
    }

    if (req.body.bathrooms) {
      const bathroomsNum = Number(req.body.bathrooms);
      if (isNaN(bathroomsNum) || bathroomsNum < 0) {
        return res.status(400).json({ 
          error: 'Bathrooms must be a non-negative number' 
        });
      }
      req.body.bathrooms = bathroomsNum;
    }

    // Handle file uploads if new photos are provided
    if (req.files && req.files.length > 0) {
      const photoFiles = req.files;
      const photoPaths = photoFiles.map(file => `/uploads/${file.filename}`);
      req.body.photos = photoPaths;
    }

    // Clean string fields
    if (req.body.title) req.body.title = req.body.title.trim();
    if (req.body.description) req.body.description = req.body.description.trim();
    if (req.body.location) req.body.location = req.body.location.trim();

    const updatedProperty = await Property.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('owner_id', 'name _id');

    res.json({ message: 'Property updated successfully', property: updatedProperty });
  } catch (error) {
    console.error('Update property error:', error);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validationErrors 
      });
    }
    
    res.status(500).json({ error: 'Failed to update property. Please try again.' });
  }
};

exports.deleteProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    if (property.owner_id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Use findByIdAndDelete instead of the deprecated remove() method
    await Property.findByIdAndDelete(req.params.id);
    res.json({ message: 'Property deleted successfully' });
  } catch (error) {
    console.error('Delete property error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get properties by owner
exports.getPropertiesByOwner = async (req, res) => {
  try {
    const properties = await Property.find({ owner_id: req.user.id })
      .populate('owner_id', 'name _id')
      .sort({ createdAt: -1 });
    res.json(properties);
  } catch (error) {
    console.error('Get properties by owner error:', error);
    res.status(500).json({ error: error.message });
  }
};

