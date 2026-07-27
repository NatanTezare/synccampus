const pool = require('../config/db');

const VenueBookingModel = {
  async create({ requesterId, venueId, bookingDate, startTime, endTime, purpose }) {
    const query = `
      INSERT INTO venue_bookings (requester_id, venue_id, booking_date, start_time, end_time, purpose)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [requesterId, venueId, bookingDate, startTime, endTime, purpose]);
    return rows[0];
  },

  // Requester's own bookings (Student/Faculty "My Requests" view)
  async findByRequester(requesterId) {
    const query = `
      SELECT vb.*, v.name AS venue_name, v.building, v.venue_type,
             r.full_name AS reviewed_by_name
      FROM venue_bookings vb
      JOIN venues v ON v.id = vb.venue_id
      LEFT JOIN users r ON r.id = vb.reviewed_by
      WHERE vb.requester_id = $1
      ORDER BY vb.created_at DESC;
    `;
    const { rows } = await pool.query(query, [requesterId]);
    return rows;
  },

  // Admin Triage Queue — filterable by status, defaults to pending
  async findAll({ status } = {}) {
    let query = `
      SELECT vb.*, v.name AS venue_name, v.building, v.venue_type, v.capacity,
             u.full_name AS requester_name, u.email AS requester_email, u.role AS requester_role,
             r.full_name AS reviewed_by_name
      FROM venue_bookings vb
      JOIN venues v ON v.id = vb.venue_id
      JOIN users u ON u.id = vb.requester_id
      LEFT JOIN users r ON r.id = vb.reviewed_by
    `;
    const values = [];

    if (status) {
      query += ` WHERE vb.status = $1`;
      values.push(status);
    }

    query += ` ORDER BY vb.created_at ASC`; // oldest pending first = fair queue order

    const { rows } = await pool.query(query, values);
    return rows;
  },

  async findById(id) {
    const { rows } = await pool.query(
      `SELECT vb.*, v.name AS venue_name, vb.requester_id
       FROM venue_bookings vb JOIN venues v ON v.id = vb.venue_id
       WHERE vb.id = $1`,
      [id]
    );
    return rows[0];
  },

  // All pending/approved bookings for a venue+date that overlap a given time range.
  // Overlap rule: two ranges overlap if one starts before the other ends, on both sides.
  async findOverlapping({ venueId, bookingDate, startTime, endTime }) {
    const query = `
      SELECT id, start_time, end_time, status
      FROM venue_bookings
      WHERE venue_id = $1
        AND booking_date = $2
        AND status IN ('pending', 'approved')
        AND start_time < $4
        AND end_time > $3
      ORDER BY start_time ASC;
    `;
    const { rows } = await pool.query(query, [venueId, bookingDate, startTime, endTime]);
    return rows;
  },

  // All busy windows for a venue on a given date — powers the proactive
  // "here's what's already booked" display on the request form.
  async findBusyWindows(venueId, bookingDate) {
    const query = `
      SELECT start_time, end_time, status
      FROM venue_bookings
      WHERE venue_id = $1 AND booking_date = $2 AND status IN ('pending', 'approved')
      ORDER BY start_time ASC;
    `;
    const { rows } = await pool.query(query, [venueId, bookingDate]);
    return rows;
  },

  async review({ id, status, reviewedBy, rejectionReason }) {
    const query = `
      UPDATE venue_bookings
      SET status = $1, reviewed_by = $2, reviewed_at = now(), rejection_reason = $3, updated_at = now()
      WHERE id = $4
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [status, reviewedBy, rejectionReason || null, id]);
    return rows[0];
  },

  async resetToPending(id) {
    const query = `
      UPDATE venue_bookings
      SET status = 'pending', reviewed_by = NULL, reviewed_at = NULL, rejection_reason = NULL, updated_at = now()
      WHERE id = $1
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0];
  },

  async cancel({ id, requesterId }) {
    // Only the original requester can cancel, and only while still pending
    const query = `
      UPDATE venue_bookings
      SET status = 'cancelled', updated_at = now()
      WHERE id = $1 AND requester_id = $2 AND status = 'pending'
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [id, requesterId]);
    return rows[0];
  },
};

module.exports = VenueBookingModel;