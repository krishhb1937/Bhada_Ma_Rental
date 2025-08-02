const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const User = require('../models/User');

// Create payment record when booking is confirmed
exports.createPayment = async (req, res) => {
  try {
    const { booking_id } = req.body;
    
    if (!booking_id) {
      return res.status(400).json({ message: 'Booking ID is required' });
    }
    
    const booking = await Booking.findById(booking_id)
      .populate('property_id')
      .populate('owner_id');
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    if (booking.status !== 'confirmed') {
      return res.status(400).json({ message: 'Booking must be confirmed before payment' });
    }
    
    // Check if payment already exists
    const existingPayment = await Payment.findOne({ booking_id });
    if (existingPayment) {
      return res.status(400).json({ message: 'Payment already exists for this booking' });
    }
    
    // Generate QR code URL
    const qrCodeUrl = await generateQRCode(booking.owner_id, booking.total_amount);
    
    const payment = await Payment.create({
      booking_id,
      renter_id: booking.renter_id,
      owner_id: booking.owner_id,
      amount: booking.total_amount,
      qr_code_url: qrCodeUrl
    });

    // Populate the payment with related data
    const populatedPayment = await Payment.findById(payment._id)
      .populate('booking_id')
      .populate('owner_id', 'name phone email')
      .populate('renter_id', 'name');
    
    res.status(201).json({ 
      message: 'Payment created successfully', 
      payment: populatedPayment 
    });
  } catch (error) {
    console.error('Payment creation error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get payment details with QR code
exports.getPaymentDetails = async (req, res) => {
  try {
    const { booking_id } = req.params;
    
    if (!booking_id) {
      return res.status(400).json({ message: 'Booking ID is required' });
    }
    
    const payment = await Payment.findOne({ booking_id })
      .populate('booking_id')
      .populate('owner_id', 'name phone email')
      .populate('renter_id', 'name');
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Check if user is authorized to view this payment
    if (payment.renter_id._id.toString() !== req.user.id && 
        payment.owner_id._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    res.json(payment);
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update payment status
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { payment_id } = req.params;
    const { status, transaction_id, notes } = req.body;
    
    if (!payment_id) {
      return res.status(400).json({ message: 'Payment ID is required' });
    }

    if (!['pending', 'completed', 'failed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid payment status' });
    }
    
    const payment = await Payment.findById(payment_id);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Check if user is authorized to update this payment
    if (payment.renter_id.toString() !== req.user.id && 
        payment.owner_id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    const previousStatus = payment.status;
    
    // Update payment
    const updatedPayment = await Payment.findByIdAndUpdate(
      payment_id,
      {
        status,
        ...(transaction_id && { transaction_id }),
        ...(notes && { notes })
      },
      { new: true, runValidators: true }
    ).populate('booking_id')
     .populate('owner_id', 'name phone email')
     .populate('renter_id', 'name');
    
    // Send notification to owner when payment is completed
    if (status === 'completed' && previousStatus !== 'completed') {
      try {
        const { notifyPaymentCompleted } = require('./notificationController');
        await notifyPaymentCompleted(payment_id);
      } catch (notificationError) {
        console.error('Error sending payment notification:', notificationError);
        // Don't fail the payment update if notification fails
      }
    }
    
    res.json({ 
      message: 'Payment status updated', 
      payment: updatedPayment 
    });
  } catch (error) {
    console.error('Update payment error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get all payments for a user
exports.getUserPayments = async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.user_type;
    
    let query = {};
    if (userType === 'owner') {
      query.owner_id = userId;
    } else {
      query.renter_id = userId;
    }
    
    const payments = await Payment.find(query)
      .populate('booking_id')
      .populate('owner_id', 'name')
      .populate('renter_id', 'name')
      .sort({ createdAt: -1 });
    
    res.json(payments);
  } catch (error) {
    console.error('Get user payments error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get payment by ID
exports.getPaymentById = async (req, res) => {
  try {
    const { payment_id } = req.params;
    
    if (!payment_id) {
      return res.status(400).json({ message: 'Payment ID is required' });
    }
    
    const payment = await Payment.findById(payment_id)
      .populate('booking_id')
      .populate('owner_id', 'name phone email')
      .populate('renter_id', 'name');
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Check if user is authorized to view this payment
    if (payment.renter_id._id.toString() !== req.user.id && 
        payment.owner_id._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    res.json(payment);
  } catch (error) {
    console.error('Get payment by ID error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Delete payment (only for failed/cancelled payments)
exports.deletePayment = async (req, res) => {
  try {
    const { payment_id } = req.params;
    
    if (!payment_id) {
      return res.status(400).json({ message: 'Payment ID is required' });
    }
    
    const payment = await Payment.findById(payment_id);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Only allow deletion of failed or cancelled payments
    if (!['failed', 'cancelled'].includes(payment.status)) {
      return res.status(400).json({ message: 'Cannot delete payment with current status' });
    }

    // Check if user is authorized to delete this payment
    if (payment.renter_id.toString() !== req.user.id && 
        payment.owner_id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    await Payment.findByIdAndDelete(payment_id);
    res.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    console.error('Delete payment error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Generate QR code URL - use owner's uploaded QR code or generate placeholder
async function generateQRCode(ownerId, amount) {
  try {
    const owner = await User.findById(ownerId);
    
    if (!owner) {
      throw new Error('Owner not found');
    }
    
    // If owner has uploaded their own QR code, use it
    if (owner.qr_code) {
      return `http://localhost:5000${owner.qr_code}`;
    }
    
    // Otherwise, generate a placeholder QR code with UPI data
    const qrData = {
      upi_id: owner.upi_id || owner.phone + '@upi',
      amount: amount,
      name: owner.name,
      note: 'Rental Payment'
    };
    
    // Return a placeholder QR code URL
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(JSON.stringify(qrData))}`;
  } catch (error) {
    console.error('Error generating QR code:', error);
    // Return a fallback QR code URL
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent('Payment QR Code')}`;
  }
} 