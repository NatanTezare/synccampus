const pool = require('../config/db');

const AppointmentModel = {
  async create({ studentId, facultyId, appointmentDate, startTime, endTime, purpose }) {
    const query = `
      INSERT INTO appointments (student_id, faculty_id, appointment_date, start_time, end_time, purpose)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [studentId, facultyId, appointmentDate, startTime, endTime, purpose]);
    return rows[0];
  },

  // Slots already taken for a given faculty member (used to compute open slots)
  async findBookedSlots(facultyId, fromDate) {
    const { rows } = await pool.query(
      `SELECT appointment_date, start_time, end_time FROM appointments
       WHERE faculty_id = $1 AND status IN ('pending', 'confirmed') AND appointment_date >= $2`,
      [facultyId, fromDate]
    );
    return rows;
  },

  // Student's own appointments
  async findByStudent(studentId) {
    const { rows } = await pool.query(
      `SELECT a.*, u.full_name AS faculty_name, u.title, u.department
       FROM appointments a JOIN users u ON u.id = a.faculty_id
       WHERE a.student_id = $1
       ORDER BY a.appointment_date DESC, a.start_time DESC`,
      [studentId]
    );
    return rows;
  },

  // Faculty's incoming requests (Tab A of their dashboard)
  async findByFaculty(facultyId, status) {
    let query = `
      SELECT a.*, u.full_name AS student_name, u.email AS student_email, u.student_id_no
      FROM appointments a JOIN users u ON u.id = a.student_id
      WHERE a.faculty_id = $1
    `;
    const values = [facultyId];
    if (status) {
      query += ` AND a.status = $2`;
      values.push(status);
    }
    query += ` ORDER BY a.appointment_date ASC, a.start_time ASC`;
    const { rows } = await pool.query(query, values);
    return rows;
  },

  async findById(id) {
    const { rows } = await pool.query('SELECT * FROM appointments WHERE id = $1', [id]);
    return rows[0];
  },

  async respond({ id, status, facultyNotes }) {
    const { rows } = await pool.query(
      `UPDATE appointments SET status = $1, faculty_notes = $2, updated_at = now()
       WHERE id = $3 RETURNING *`,
      [status, facultyNotes || null, id]
    );
    return rows[0];
  },

  async cancel({ id, studentId }) {
    const { rows } = await pool.query(
      `UPDATE appointments SET status = 'cancelled', updated_at = now()
       WHERE id = $1 AND student_id = $2 AND status IN ('pending','confirmed') RETURNING *`,
      [id, studentId]
    );
    return rows[0];
  },
};

module.exports = AppointmentModel;