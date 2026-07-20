const VenueBookingModel = require('../models/venueBookingModel');
const VenueModel = require('../models/venueModel');

// GET /api/venues  — list of bookable venues (for the request form dropdown)
exports.listVenues = async (req, res, next) => {
  try {
    const venues = await VenueModel.listAll();
    res.status(200).json({ success: true, data: venues });
  } catch (err) {
    next(err);
  }
};

// POST /api/venue-bookings — Student/Faculty submit a request
exports.createBooking = async (req, res, next) => {
  try {
    const { venueId, bookingDate, startTime, endTime, purpose } = req.body;

    if (!venueId || !bookingDate || !startTime || !endTime || !purpose) {
      return res.status(400).json({ success: false, message: 'All fields are required to submit a venue request.' });
    }

    if (startTime >= endTime) {
      return res.status(400).json({ success: false, message: 'End time must be after start time.' });
    }

    // Prevent requesting a slot in the past
    const requestedDateTime = new Date(`${bookingDate}T${startTime}`);
    if (requestedDateTime < new Date()) {
      return res.status(400).json({ success: false, message: 'You cannot request a venue for a time in the past.' });
    }

    const venue = await VenueModel.findById(venueId);
    if (!venue || !venue.is_active) {
      return res.status(404).json({ success: false, message: 'Selected venue is not available.' });
    }

    const booking = await VenueBookingModel.create({
      requesterId: req.user.id,
      venueId,
      bookingDate,
      startTime,
      endTime,
      purpose,
    });

    res.status(201).json({
      success: true,
      message: 'Your venue request has been submitted and is pending review.',
      data: booking,
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ success: false, message: 'This venue is already booked or requested for that exact time slot.' });
    }
    next(err);
  }
};

// GET /api/venue-bookings/my — requester's own history + live status
exports.getMyBookings = async (req, res, next) => {
  try {
    const bookings = await VenueBookingModel.findByRequester(req.user.id);
    res.status(200).json({ success: true, data: bookings });
  } catch (err) {
    next(err);
  }
};

// GET /api/venue-bookings?status=pending — Admin Triage Queue
exports.getAllBookings = async (req, res, next) => {
  try {
    const { status } = req.query;
    const bookings = await VenueBookingModel.findAll({ status });
    res.status(200).json({ success: true, data: bookings });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/venue-bookings/:id/review — Admin approves/rejects
exports.reviewBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { decision, rejectionReason } = req.body; // decision: 'approved' | 'rejected'

    if (!['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({ success: false, message: "Decision must be 'approved' or 'rejected'." });
    }

    if (decision === 'rejected' && !rejectionReason) {
      return res.status(400).json({ success: false, message: 'Please provide a reason for rejection so the requester understands.' });
    }

    const existing = await VenueBookingModel.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Booking request not found.' });
    }
    if (existing.status !== 'pending') {
      return res.status(409).json({ success: false, message: 'This request has already been reviewed.' });
    }

    const updated = await VenueBookingModel.review({
      id,
      status: decision,
      reviewedBy: req.user.id,
      rejectionReason,
    });

    res.status(200).json({
      success: true,
      message: `Request has been ${decision}.`,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/venue-bookings/:id/cancel — Requester cancels their own pending request
exports.cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const cancelled = await VenueBookingModel.cancel({ id, requesterId: req.user.id });

    if (!cancelled) {
      return res.status(400).json({ success: false, message: 'Only pending requests you submitted can be cancelled.' });
    }

    res.status(200).json({ success: true, message: 'Your request has been cancelled.', data: cancelled });
  } catch (err) {
    next(err);
  }
};