const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getFacultyDirectory, getAvailableSlots, createAppointment,
  getMyAppointments, getIncomingAppointments, respondToAppointment, cancelAppointment,
} = require('../controllers/appointmentController');
const {
  createAvailability, getMyAvailability, deleteAvailability,
} = require('../controllers/availabilityController');

// Directory + slots (student-facing, read-only for browsing)
router.get('/faculty-directory', protect, getFacultyDirectory);
router.get('/faculty/:facultyId/available-slots', protect, getAvailableSlots);

// Appointments
router.post('/appointments', protect, authorize('student'), createAppointment);
router.get('/appointments/my', protect, authorize('student'), getMyAppointments);
router.patch('/appointments/:id/cancel', protect, authorize('student'), cancelAppointment);

router.get('/appointments/incoming', protect, authorize('faculty_leadership'), getIncomingAppointments);
router.patch('/appointments/:id/respond', protect, authorize('faculty_leadership'), respondToAppointment);

// Faculty availability management
router.post('/availability', protect, authorize('faculty_leadership'), createAvailability);
router.get('/availability/my', protect, authorize('faculty_leadership'), getMyAvailability);
router.delete('/availability/:id', protect, authorize('faculty_leadership'), deleteAvailability);

module.exports = router;