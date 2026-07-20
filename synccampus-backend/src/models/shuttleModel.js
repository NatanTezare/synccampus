const pool = require('../config/db');

const ShuttleModel = {
  async listRoutes() {
    const { rows } = await pool.query(
      `SELECT id, route_name, origin, destination FROM bus_routes WHERE is_active = TRUE ORDER BY route_name`
    );
    return rows;
  },

  async listSchedulesByRoute(routeId) {
    const { rows } = await pool.query(
      `SELECT id, route_id, departure_time, total_seats
       FROM bus_schedules WHERE route_id = $1 AND is_active = TRUE ORDER BY departure_time`,
      [routeId]
    );
    return rows;
  },

  async findScheduleById(scheduleId) {
    const { rows } = await pool.query(
      `SELECT bs.*, br.route_name, br.origin, br.destination
       FROM bus_schedules bs JOIN bus_routes br ON br.id = bs.route_id
       WHERE bs.id = $1`,
      [scheduleId]
    );
    return rows[0];
  },

  // How many seats are already taken for this schedule + date
  async countBookedSeats(scheduleId, travelDate) {
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int AS count FROM bus_bookings
       WHERE schedule_id = $1 AND travel_date = $2 AND status = 'booked'`,
      [scheduleId, travelDate]
    );
    return rows[0].count;
  },
};

module.exports = ShuttleModel;