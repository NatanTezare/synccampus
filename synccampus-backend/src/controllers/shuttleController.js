const ShuttleModel = require('../models/shuttleModel');
const BusBookingModel = require('../models/busBookingModel');
const pool = require('../config/db');

// GET /api/shuttle/routes
exports.listRoutes = async (req, res, next) => {
  try {
    const routes = await ShuttleModel.listRoutes();
    res.status(200).json({ success: true, data: routes });
  } catch (err) {
    next(err);
  }
};

// GET /api/shuttle/schedules?routeId=...&date=YYYY-MM-DD
exports.listSchedules = async (req, res, next) => {
  try {
    const { routeId } = req.params; // Changed from req.query to req.params
    const { date } = req.query;

    if (!routeId) {
      return res.status(400).json({ success: false, message: 'Please select a route first.' });
    }
    
    const schedules = await ShuttleModel.listSchedulesByRoute(routeId, date);
    res.status(200).json({ success: true, data: schedules });
  } catch (err) {
    next(err);
  }
};

// GET /api/shuttle/schedules/:scheduleId/availability?date=YYYY-MM-DD
// Powers the "X of Y seats left" indicator on the booking screen
exports.getSeatAvailability = async (req, res, next) => {
  try {
    const { scheduleId } = req.params;
    const { date } = req.query;

    const schedule = await ShuttleModel.findScheduleById(scheduleId);
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Schedule not found.' });
    }

    const bookedCount = await ShuttleModel.countBookedSeats(scheduleId, date);
    const seatsLeft = schedule.total_seats - bookedCount;

    res.status(200).json({
      success: true,
      data: { totalSeats: schedule.total_seats, bookedCount, seatsLeft: Math.max(seatsLeft, 0) },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/shuttle/bookings — Book a ticket
exports.createBooking = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { scheduleId, travelDate } = req.body;

    if (!scheduleId || !travelDate) {
      return res.status(400).json({ success: false, message: 'Please select a schedule and travel date.' });
    }

    const requestedDate = new Date(travelDate);
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    if (requestedDate < todayMidnight) {
      return res.status(400).json({ success: false, message: 'You cannot book a ride for a past date.' });
    }

    const schedule = await ShuttleModel.findScheduleById(scheduleId);
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Shuttle schedule not found.' });
    }

    // Transaction: check seat count and insert atomically to prevent overbooking
    await client.query('BEGIN');

    // 1. Lock the schedule row first to safely queue any concurrent booking attempts
    await client.query('SELECT id FROM bus_schedules WHERE id = $1 FOR UPDATE', [scheduleId]);

    // 2. Now safely count the currently booked seats without locking the COUNT itself
    const { rows: countRows } = await client.query(
      `SELECT COUNT(*)::int AS count FROM bus_bookings
       WHERE schedule_id = $1 AND travel_date = $2 AND status = 'booked'`,
      [scheduleId, travelDate]
    );
    const bookedCount = countRows[0].count;

    if (bookedCount >= schedule.total_seats) {
      await client.query('ROLLBACK');
      return res.status(409).json({ success: false, message: 'This shuttle is fully booked for the selected date. Please choose another time.' });
    }

    const seatNumber = bookedCount + 1;
    const crypto = require('crypto');
    const ticketCode = `SC-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    const { rows: bookingRows } = await client.query(
      `INSERT INTO bus_bookings (user_id, schedule_id, travel_date, seat_number, ticket_code)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user.id, scheduleId, travelDate, seatNumber, ticketCode]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: `Seat ${seatNumber} booked! Your ticket is ready.`,
      data: bookingRows[0],
    });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      return res.status(409).json({ success: false, message: 'You already have a ticket booked for this ride.' });
    }
    next(err);
  } finally {
    client.release();
  }
};

// GET /api/shuttle/bookings/my — Ticket Dashboard: active + history
exports.getMyBookings = async (req, res, next) => {
  try {
    const [active, history] = await Promise.all([
      BusBookingModel.findActiveByUser(req.user.id),
      BusBookingModel.findHistoryByUser(req.user.id),
    ]);
    res.status(200).json({ success: true, data: { active, history } });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/shuttle/bookings/:id/cancel
exports.cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const cancelled = await BusBookingModel.cancel({ id, userId: req.user.id });
    if (!cancelled) {
      return res.status(400).json({ success: false, message: 'Only your own upcoming, active tickets can be cancelled.' });
    }
    res.status(200).json({ success: true, message: 'Ticket cancelled.', data: cancelled });
  } catch (err) {
    next(err);
  }
};