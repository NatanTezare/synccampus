const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  listVenues,
  getVenueAvailability,
  createBooking,
  getMyBookings,
  getAllBookings,
  reviewBooking,
  resetBooking,
  cancelBooking,
} = require('../controllers/venueBookingController');

router.get('/venues', protect, listVenues);

router.get('/venues/:venueId/availability', protect, getVenueAvailability);

router.post('/venue-bookings', protect, authorize('student', 'faculty_leadership'), createBooking);
router.get('/venue-bookings/my', protect, authorize('student', 'faculty_leadership'), getMyBookings);
router.patch('/venue-bookings/:id/cancel', protect, authorize('student', 'faculty_leadership'), cancelBooking);

router.get('/venue-bookings', protect, authorize('admin'), getAllBookings);
router.patch('/venue-bookings/:id/review', protect, authorize('admin'), reviewBooking);
router.patch('/venue-bookings/:id/reset', protect, authorize('admin'), resetBooking);

module.exports = router;