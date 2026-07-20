const pool = require('../config/db');

const UserModel = {
  async create({ fullName, email, passwordHash, role, title, department, studentIdNo, phoneNumber }) {
    const query = `
      INSERT INTO users (full_name, email, password_hash, role, title, department, student_id_no, phone_number)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, full_name, email, role, title, department, created_at;
    `;
    const values = [fullName, email, passwordHash, role, title || null, department || null, studentIdNo || null, phoneNumber || null];
    const { rows } = await pool.query(query, values);
    return rows[0];
  },

  async findByEmail(email) {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return rows[0];
  },

  async findById(id) {
    const { rows } = await pool.query(
      `SELECT id, full_name, email, role, title, department, student_id_no, phone_number, is_active, created_at
       FROM users WHERE id = $1`,
      [id]
    );
    return rows[0];
  },

  async listFacultyDirectory() {
    // Powers the Student "Browse Faculty" screen in the Appointments module
    const { rows } = await pool.query(
      `SELECT id, full_name, title, department, email
       FROM users
       WHERE role = 'faculty_leadership' AND is_active = TRUE
       ORDER BY department, full_name`
    );
    return rows;
  },
};

module.exports = UserModel;