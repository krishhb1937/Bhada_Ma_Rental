const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const { 
  createPayment, 
  getPaymentDetails, 
  updatePaymentStatus, 
  getUserPayments,
  getPaymentById,
  deletePayment
} = require('../controllers/paymentController');

// Create payment for a confirmed booking
router.post('/create', auth, createPayment);

// Get payment details with QR code
router.get('/booking/:booking_id', auth, getPaymentDetails);

// Get all payments for the current user
router.get('/user', auth, getUserPayments);

// Update payment status
router.put('/:payment_id/status', auth, updatePaymentStatus);

// Delete payment
router.delete('/:payment_id', auth, deletePayment);

// Get payment by ID (must be last to avoid conflicts)
router.get('/:payment_id', auth, getPaymentById);

module.exports = router; 