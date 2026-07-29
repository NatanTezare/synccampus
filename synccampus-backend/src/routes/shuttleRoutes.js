const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  listRoutes, listSchedules, getSeatAvailability,
  createBooking, getMyBookings, cancelBooking,
} = require('../controllers/shuttleController');

const canBookShuttle = authorize('student', 'faculty_leadership');

router.get('/shuttle/routes', protect, canBookShuttle, listRoutes);

// FIXED: Added /routes/:routeId/schedules to match the frontend request
router.get('/shuttle/routes/:routeId/schedules', protect, canBookShuttle, listSchedules);

router.get('/shuttle/schedules/:scheduleId/availability', protect, canBookShuttle, getSeatAvailability);

router.post('/shuttle/bookings', protect, canBookShuttle, createBooking);
router.get('/shuttle/bookings/my', protect, canBookShuttle, getMyBookings);
router.patch('/shuttle/bookings/:id/cancel', protect, canBookShuttle, cancelBooking);

module.exports = router;