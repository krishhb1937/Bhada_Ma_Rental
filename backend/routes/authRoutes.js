const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const auth = require('../middlewares/authMiddleware');
const { 
  register, 
  login, 
  getProfile, 
  updateProfile, 
  updatePaymentDetails, 
  removeQrCode,
  getAllUsers,
  deleteUser
} = require('../controllers/authController');

// Configure multer for QR code uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/qr-codes/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'qr-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Auth routes
router.post('/register', register);
router.post('/login', login);

// Profile routes (protected)
router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);
router.put('/payment-details', auth, upload.single('qr_code'), updatePaymentDetails);
router.delete('/remove-qr-code', auth, removeQrCode);

// Admin routes (protected)
router.get('/users', auth, getAllUsers);
router.delete('/users/:userId', auth, deleteUser);

module.exports = router;
