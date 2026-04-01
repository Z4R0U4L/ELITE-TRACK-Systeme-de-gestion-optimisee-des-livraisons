const pool = require('../config/db');
const bcrypt = require('bcryptjs');

// GET /api/users/drivers - merchant gets their drivers list
const getDrivers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.phone, u.is_active,
              dl.latitude, dl.longitude, dl.is_sharing, dl.updated_at as location_updated,
              COUNT(o.id) FILTER (WHERE o.status = 'in_progress') as active_orders
       FROM users u
       LEFT JOIN driver_locations dl ON u.id = dl.driver_id
       LEFT JOIN orders o ON u.id = o.driver_id
       WHERE u.role = 'driver'
       GROUP BY u.id, dl.latitude, dl.longitude, dl.is_sharing, dl.updated_at
       ORDER BY u.name`,
      []
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/users/drivers - merchant creates a driver account
const createDriver = async (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'Name, email, password required' });
  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length) return res.status(409).json({ message: 'Email already exists' });

    const hashed = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role, phone) VALUES ($1,$2,$3,'driver',$4)
       RETURNING id, name, email, phone, is_active`,
      [name, email, hashed, phone]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /api/users/drivers/:id/toggle - enable/disable driver
const toggleDriver = async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE users SET is_active = NOT is_active WHERE id = $1 AND role = 'driver'
       RETURNING id, name, is_active`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Driver not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/users/notifications
const getNotifications = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /api/users/notifications/read
const markNotificationsRead = async (req, res) => {
  try {
    await pool.query(`UPDATE notifications SET is_read = true WHERE user_id = $1`, [req.user.id]);
    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getDrivers, createDriver, toggleDriver, getNotifications, markNotificationsRead };
