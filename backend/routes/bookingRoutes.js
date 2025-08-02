const express = require('express');
const router = express.Router();
const { 
  createBooking, 
  getBookingsForOwner, 
  updateBookingStatus, 
  getBookingsForRenter,
  getBookingById,
  deleteBooking
} = require('../controllers/bookingController');
const auth = require('../middlewares/authMiddleware');

// POST /api/bookings – Renters book property
router.post('/', auth, createBooking);

// GET /api/bookings/owner – Owner sees all booking requests
router.get('/owner', auth, getBookingsForOwner);

// GET /api/bookings/me – Renter sees their bookings
router.get('/me', auth, getBookingsForRenter);

// PATCH /api/bookings/:id – Owner updates booking status
router.patch('/:id', auth, updateBookingStatus);

// DELETE /api/bookings/:id – Delete booking
router.delete('/:id', auth, deleteBooking);

// GET /api/bookings/:id – Get specific booking (must be last to avoid conflicts)
router.get('/:id', auth, getBookingById);

module.exports = router;
