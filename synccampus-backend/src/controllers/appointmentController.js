const AppointmentModel = require('../models/appointmentModel');
const AvailabilityModel = require('../models/availabilityModel');
const UserModel = require('../models/userModel');
const { generateAvailableSlots } = require('../utils/slotEngine');

// GET /api/faculty-directory — Student browses Faculty/HODs/VC
exports.getFacultyDirectory = async (req, res, next) => {
  try {
    const directory = await UserModel.listFacultyDirectory();
    res.status(200).json({ success: true, data: directory });
  } catch (err) {
    next(err);
  }
};

// GET /api/faculty/:facultyId/available-slots
exports.getAvailableSlots = async (req, res, next) => {
  try {
    const { facultyId } = req.params;
    const today = new Date().toISOString().split('T')[0];

    const [availabilityRows, bookedSlots] = await Promise.all([
      AvailabilityModel.findByFaculty(facultyId),
      AppointmentModel.findBookedSlots(facultyId, today),
    ]);

    if (availabilityRows.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: 'This faculty member has not set their availability yet.',
      });
    }

    const slots = generateAvailableSlots({ availabilityRows, bookedSlots });
    res.status(200).json({ success: true, data: slots });
  } catch (err) {
    next(err);
  }
};

// POST /api/appointments — Student books a specific open slot
exports.createAppointment = async (req, res, next) => {
  try {
    const { facultyId, appointmentDate, startTime, endTime, purpose } = req.body;

    if (!facultyId || !appointmentDate || !startTime || !endTime || !purpose) {
      return res.status(400).json({ success: false, message: 'All fields are required to request an appointment.' });
    }

    if (purpose.trim().length < 10) {
      return res.status(400).json({ success: false, message: 'Please provide a brief purpose (at least 10 characters) so the faculty member has context.' });
    }

    if (purpose.trim().length < 10) {
      return res.status(400).json({ success: false, message: 'Please provide a brief purpose (at least 10 characters) so the faculty member has context.' });
    }

    const conflicts = await AppointmentModel.findOverlapping({ facultyId, appointmentDate, startTime, endTime });
    if (conflicts.length > 0) {
      return res.status(409).json({
        success: false,
        message: `This faculty member already has an appointment from ${conflicts[0].start_time.slice(0, 5)} to ${conflicts[0].end_time.slice(0, 5)} that day. Please pick a different time.`,
      });
    }

    

    const appointment = await AppointmentModel.create({
      studentId: req.user.id,
      facultyId,
      appointmentDate,
      startTime,
      endTime,
      purpose,
    });

    res.status(201).json({
      success: true,
      message: 'Your appointment request has been sent. You will be notified once it is confirmed.',
      data: appointment,
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ success: false, message: 'That slot was just booked by someone else. Please pick another.' });
    }
    next(err);
  }
};

// GET /api/appointments/my — Student's own appointments
exports.getMyAppointments = async (req, res, next) => {
  try {
    const appointments = await AppointmentModel.findByStudent(req.user.id);
    res.status(200).json({ success: true, data: appointments });
  } catch (err) {
    next(err);
  }
};

// GET /api/appointments/incoming — Faculty Tab A: incoming requests
exports.getIncomingAppointments = async (req, res, next) => {
  try {
    const { status } = req.query;
    const appointments = await AppointmentModel.findByFaculty(req.user.id, status);
    res.status(200).json({ success: true, data: appointments });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/appointments/:id/respond — Faculty confirms/rejects
exports.respondToAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { decision, facultyNotes } = req.body; // decision: 'confirmed' | 'rejected'

    if (!['confirmed', 'rejected'].includes(decision)) {
      return res.status(400).json({ success: false, message: "Decision must be 'confirmed' or 'rejected'." });
    }

    const existing = await AppointmentModel.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Appointment request not found.' });
    }
    if (existing.faculty_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only respond to your own appointment requests.' });
    }
    if (existing.status !== 'pending') {
      return res.status(409).json({ success: false, message: 'This request has already been responded to.' });
    }

    const updated = await AppointmentModel.respond({ id, status: decision, facultyNotes });

    res.status(200).json({ success: true, message: `Appointment ${decision}.`, data: updated });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/appointments/:id/cancel — Student cancels
exports.cancelAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const cancelled = await AppointmentModel.cancel({ id, studentId: req.user.id });
    if (!cancelled) {
      return res.status(400).json({ success: false, message: 'Only your own pending or confirmed appointments can be cancelled.' });
    }
    res.status(200).json({ success: true, message: 'Appointment cancelled.', data: cancelled });
  } catch (err) {
    next(err);
  }
};