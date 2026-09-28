const { pool, withTransaction } = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10);

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password ||
        typeof username !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    let user;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        `SELECT u.user_id, u.username, u.password, u.role_id, r.role_name
         FROM "User" u
         JOIN roles r ON u.role_id = r.role_id
         WHERE u.username = $1`,
        [username.trim()]
      );
      user = result.rows[0];

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }

    // Always run a compare so response time doesn't reveal whether the username exists
    const isMatch = await bcrypt.compare(password, user ? user.password : DUMMY_HASH);

    if (!user || !isMatch) {
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
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Username already exists' });
    }
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { login, createUser };