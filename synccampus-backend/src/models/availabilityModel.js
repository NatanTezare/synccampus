const pool = require('../config/db');

const AvailabilityModel = {
  // Faculty sets/updates their recurring weekly template
  async create({ facultyId, dayOfWeek, startTime, endTime }) {
    const query = `
      INSERT INTO faculty_availability (faculty_id, day_of_week, start_time, end_time)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [facultyId, dayOfWeek, startTime, endTime]);
    return rows[0];
  },

  async findByFaculty(facultyId) {
    const { rows } = await pool.query(
      `SELECT * FROM faculty_availability
       WHERE faculty_id = $1 AND is_active = TRUE
       ORDER BY
         CASE day_of_week
           WHEN 'monday' THEN 1 WHEN 'tuesday' THEN 2 WHEN 'wednesday' THEN 3
           WHEN 'thursday' THEN 4 WHEN 'friday' THEN 5 WHEN 'saturday' THEN 6 ELSE 7
         END, start_time`,
      [facultyId]
    );
    return rows;
  },

  async deactivate({ id, facultyId }) {
    const { rows } = await pool.query(
      `UPDATE faculty_availability SET is_active = FALSE
       WHERE id = $1 AND faculty_id = $2 RETURNING *`,
      [id, facultyId]
    );
    return rows[0];
  },
};

module.exports = AvailabilityModel;