const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

exports.register = async (req, res) => {
  try {
    const { email, password, name, phone, user_type } = req.body;
    
    // Validate required fields
    if (!email || !password || !name || !phone || !user_type) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate user type
    if (!['owner', 'renter'].includes(user_type)) {
      return res.status(400).json({ message: 'Invalid user type' });
    }

    // Check if user already exists
    const existing = await User.findOne({ email });
    if (existing) {
        return res.status(400).json({ message: 'User already exists' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashed, name, phone, user_type });
    
    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.status(201).json({ 
      message: 'User registered successfully',
      user: userResponse
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    
    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.json({ token, user: userResponse });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    
    // Validate at least one field is provided
    if (!name && !phone) {
      return res.status(400).json({ message: 'At least one field must be provided' });
    }
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields if provided
    if (name) user.name = name;
    if (phone) user.phone = phone;

    await user.save();
    
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.json({ 
      message: 'Profile updated successfully',
      user: userResponse 
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update payment details
exports.updatePaymentDetails = async (req, res) => {
  try {
    const { upi_id } = req.body;
    
    if (!upi_id) {
      return res.status(400).json({ message: 'UPI ID is required' });
    }
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.upi_id = upi_id;

    // Handle QR code file upload
    if (req.file) {
      // Remove old QR code if exists
      if (user.qr_code) {
        const oldPath = path.join(__dirname, '..', user.qr_code);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      
      user.qr_code = req.file.path.replace(/\\/g, '/');
    }

    await user.save();
    
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.json({ 
      message: 'Payment details updated successfully',
      user: userResponse 
    });
  } catch (error) {
    console.error('Update payment details error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Remove QR code
exports.removeQrCode = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove QR code file if exists
    if (user.qr_code) {
      const qrPath = path.join(__dirname, '..', user.qr_code);
      if (fs.existsSync(qrPath)) {
        fs.unlinkSync(qrPath);
      }
      user.qr_code = undefined;
    }

    await user.save();
    
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.json({ 
      message: 'QR code removed successfully',
      user: userResponse 
    });
  } catch (error) {
    console.error('Remove QR code error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get all users (admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Delete user (admin only)
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove QR code file if exists
    if (user.qr_code) {
      const qrPath = path.join(__dirname, '..', user.qr_code);
      if (fs.existsSync(qrPath)) {
        fs.unlinkSync(qrPath);
      }
    }

    await User.findByIdAndDelete(userId);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: error.message });
  }
};
