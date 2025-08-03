const Booking = require('../models/Booking');
const Property = require('../models/Property');

exports.createBooking = async (req, res) => {
  try {
    const { property_id, move_in_date, total_amount } = req.body;

    // Validate required fields
    if (!property_id || !move_in_date || !total_amount) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const property = await Property.findById(property_id);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Check if user is trying to book their own property
    if (property.owner_id.toString() === req.user.id) {
      return res.status(400).json({ message: 'Cannot book your own property' });
    }

    const newBooking = await Booking.create({
      property_id,
      renter_id: req.user.id,
      owner_id: property.owner_id,
      move_in_date,
      total_amount
    });

    // Populate the booking with property and user details
    const populatedBooking = await Booking.findById(newBooking._id)
      .populate('property_id')
      .populate('renter_id', 'name phone')
      .populate('owner_id', 'name');

    res.status(201).json({ 
        message: 'Booking request sent', 
        booking: populatedBooking 
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getBookingsForOwner = async (req, res) => {
  try {
    const bookings = await Booking.find({ owner_id: req.user.id })
      .populate('property_id')
      .populate('renter_id', 'name phone')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    console.error('Get bookings for owner error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getBookingsForRenter = async (req, res) => {
  try {
    const bookings = await Booking.find({ renter_id: req.user.id })
      .populate({
        path: 'property_id',
        populate: {
          path: 'owner_id',
          select: 'name _id'
        }
      })
      .populate('renter_id')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    console.error('Get bookings for renter error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('property_id')
      .populate('renter_id', 'name phone')
      .populate('owner_id', 'name');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user is authorized to view this booking
    if (booking.renter_id._id.toString() !== req.user.id && 
        booking.owner_id._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    res.json(booking);
  } catch (error) {
    console.error('Get booking by ID error:', error);
    res.status(500).json({ error: error.message });
  }
};
  
exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body; // should be 'confirmed' or 'rejected'
    
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }
    
    if (!['confirmed', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be "confirmed" or "rejected"' });
    }

    if (!req.params.id) {
      return res.status(400).json({ message: 'Booking ID is required' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    if (booking.owner_id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this booking' });
    }

    // Check if booking is already in a final state
    if (booking.status !== 'pending') {
      return res.status(400).json({ message: `Booking is already ${booking.status}. Cannot update from ${booking.status} to ${status}` });
    }

    // Validate that the booking has all required fields
    if (!booking.property_id || !booking.renter_id || !booking.owner_id) {
      return res.status(400).json({ message: 'Booking is missing required information' });
    }

    // Update booking status
    console.log(`Updating booking ${req.params.id} to status: ${status}`);
    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate('property_id')
     .populate('renter_id', 'name phone')
     .populate('owner_id', 'name');

    if (!updatedBooking) {
      throw new Error('Failed to update booking');
    }

    console.log(`Booking ${req.params.id} updated successfully to ${status}`);

    // Send notifications for booking status changes
    try {
      const notificationController = require('./notificationController');
      
      if (status === 'confirmed') {
        await notificationController.notifyBookingConfirmed(booking._id);
      } else if (status === 'rejected') {
        await notificationController.notifyBookingRejected(booking._id);
      }
    } catch (notificationError) {
      console.error('Error sending booking notification:', notificationError);
      // Don't fail the booking update if notification fails
    }

    // If booking is confirmed, automatically create a payment record
    if (status === 'confirmed') {
      try {
        const Payment = require('../models/Payment');
        const User = require('../models/User');
        
        // Check if payment already exists
        const existingPayment = await Payment.findOne({ booking_id: booking._id });
        if (!existingPayment) {
          // Generate QR code URL
          const owner = await User.findById(booking.owner_id);
          if (!owner) {
            console.error('Owner not found for payment creation');
            // Don't fail the booking update if owner info is missing
          } else {
            // Use owner's UPI ID if available, otherwise use phone number
            const upiId = owner.upi_id || (owner.phone ? owner.phone + '@upi' : null);
            
            if (upiId) {
              const qrData = {
                upi_id: upiId,
                amount: booking.total_amount,
                name: owner.name,
                note: 'Rental Payment'
              };
              const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(JSON.stringify(qrData))}`;
              
              await Payment.create({
                booking_id: booking._id,
                renter_id: booking.renter_id,
                owner_id: booking.owner_id,
                amount: booking.total_amount,
                qr_code_url: qrCodeUrl
              });
              
              console.log(`Payment record created for booking ${booking._id}`);
            } else {
              console.log(`No UPI ID available for owner ${owner._id}, payment record not created`);
            }
          }
        } else {
          console.log(`Payment record already exists for booking ${booking._id}`);
        }
      } catch (paymentError) {
        console.error('Error creating payment:', paymentError);
        // Don't fail the booking update if payment creation fails
      }
    }

    console.log(`Booking ${req.params.id} ${status} successfully`);
    res.json({ message: `Booking ${status}`, booking: updatedBooking });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Only allow deletion if booking is pending or if user is the renter
    if (booking.status !== 'pending' && booking.renter_id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Cannot delete this booking' });
    }

    await Booking.findByIdAndDelete(req.params.id);
    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('Delete booking error:', error);
    res.status(500).json({ error: error.message });
  }
};
