const pool = require('../config/db');
const crypto = require('crypto');

function generateTicketCode() {
  // e.g. SC-8F3A1B2C — short, unique, readable, and barcode-friendly
  return `SC-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

const BusBookingModel = {
  async create({ userId, scheduleId, travelDate, seatNumber }) {
    const ticketCode = generateTicketCode();
    const { rows } = await pool.query(
      `INSERT INTO bus_bookings (user_id, schedule_id, travel_date, seat_number, ticket_code)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [userId, scheduleId, travelDate, seatNumber, ticketCode]
    );
    return rows[0];
  },

  // Active tickets: today or future, status booked
  async findActiveByUser(userId) {
    const { rows } = await pool.query(
      `SELECT bb.*, br.route_name, br.origin, br.destination, bs.departure_time
       FROM bus_bookings bb
       JOIN bus_schedules bs ON bs.id = bb.schedule_id
       JOIN bus_routes br ON br.id = bs.route_id
       WHERE bb.user_id = $1 AND bb.status = 'booked' AND bb.travel_date >= CURRENT_DATE
       ORDER BY bb.travel_date ASC, bs.departure_time ASC`,
      [userId]
    );
    return rows;
  },

  // Ride history: past or completed/cancelled
  async findHistoryByUser(userId) {
    const { rows } = await pool.query(
      `SELECT bb.*, br.route_name, br.origin, br.destination, bs.departure_time
       FROM bus_bookings bb
       JOIN bus_schedules bs ON bs.id = bb.schedule_id
       JOIN bus_routes br ON br.id = bs.route_id
       WHERE bb.user_id = $1 AND (bb.travel_date < CURRENT_DATE OR bb.status != 'booked')
       ORDER BY bb.travel_date DESC, bs.departure_time DESC
       LIMIT 50`,
      [userId]
    );
    return rows;
  },

  async findById(id) {
    const { rows } = await pool.query('SELECT * FROM bus_bookings WHERE id = $1', [id]);
    return rows[0];
  },

  async cancel({ id, userId }) {
    const { rows } = await pool.query(
      `UPDATE bus_bookings SET status = 'cancelled'
       WHERE id = $1 AND user_id = $2 AND status = 'booked' AND travel_date >= CURRENT_DATE
       RETURNING *`,
      [id, userId]
    );
    return rows[0];
  },
};

module.exports = BusBookingModel;