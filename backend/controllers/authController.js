const pool = require('../config/db');
const bcrypt = require('bcrypt');

const jwt = require('jsonwebtoken');
// LOGIN — public
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const result = await pool.query(
      `SELECT u.user_id, u.username, u.password, u.role_id, r.role_name
       FROM "User" u
       JOIN roles r ON u.role_id = r.role_id
       WHERE u.username = $1`,
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    res.status(200).json({
      id: user.user_id,
      username: user.username,
      role: user.role_name,
      token: jwt.sign(
        {id: user.user_id, role: user.role_name},
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
      ),
      message: 'Login successful',
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// CREATE USER — admin-only (used later by Admin Dashboard, not public)
const createUser = async (req, res) => {
  try {
    const { last_name, first_name, middle_initial, role_id, username, password } = req.body;

    if (!last_name || !first_name || !role_id || !username || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existing = await pool.query(
      `SELECT * FROM "User" WHERE username = $1`,
      [username]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const newUser = await pool.query(
      `INSERT INTO "User" (last_name, first_name, middle_initial, role_id, username, password)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING user_id, last_name, first_name, username, role_id`,
      [last_name, first_name, middle_initial, role_id, username, password_hash]
    );

    res.status(201).json(newUser.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { login, createUser };