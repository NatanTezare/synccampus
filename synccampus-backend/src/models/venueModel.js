const pool = require('../config/db');

const VenueModel = {
  async listAll() {
    const { rows } = await pool.query(
      `SELECT id, name, building, venue_type, capacity
       FROM venues WHERE is_active = TRUE ORDER BY name`
    );
    return rows;
  },

  async findById(id) {
    const { rows } = await pool.query('SELECT * FROM venues WHERE id = $1', [id]);
    return rows[0];
  },
};

module.exports = VenueModel;