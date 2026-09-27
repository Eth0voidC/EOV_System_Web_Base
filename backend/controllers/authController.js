const { pool, withTransaction } = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// LOGIN — public
// Read-only (SELECT only), so no transaction is needed here.

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
        { id: user.user_id, role: user.role_name },
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
// Uses withTransaction so the duplicate-check + insert either both
// succeed or both roll back together.

const createUser = async (req, res) => {
  try {
    const { last_name, first_name, middle_initial, role_id, username, password } = req.body;

    if (!last_name || !first_name || !role_id || !username || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newUser = await withTransaction(async (client) => {
      const existing = await client.query(
        `SELECT 1 FROM "User" WHERE username = $1`,
        [username]
      );

      if (existing.rows.length > 0) {
        // Throwing here triggers withTransaction's ROLLBACK + release.
        // We tag the error so the outer catch knows this is a
        // "duplicate" case rather than an unexpected failure.
        const err = new Error('Username already exists');
        err.isDuplicate = true;
        throw err;
      }

      const password_hash = await bcrypt.hash(password, 10);

      const result = await client.query(
        `INSERT INTO "User" (last_name, first_name, middle_initial, role_id, username, password)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING user_id, last_name, first_name, username, role_id`,
        [last_name, first_name, middle_initial, role_id, username, password_hash]
      );

      return result.rows[0];
    });

    res.status(201).json(newUser);
  } catch (err) {
    if (err.isDuplicate) {
      return res.status(409).json({ error: err.message });
    }

    // 23505 = unique_violation — the DB-level safety net that catches
    // the race condition the SELECT check above can miss (two requests
    // inserting the same username at nearly the same time).

    if (err.code === '23505') {
      return res.status(409).json({ error: 'Username already exists' });
    }

    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { login, createUser };