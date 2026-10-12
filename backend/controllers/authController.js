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


const getUsers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        u.user_id,
        u.last_name,
        u.first_name,
        u.middle_initial,
        u.username,
        u.role_id,
        r.role_name AS role
      FROM "User" u
      JOIN roles r ON u.role_id = r.role_id
      ORDER BY u.user_id ASC
    `);

    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

const updateUser = async (req, res) => {
  try {
    const userId = Number(req.params.id);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const {
      last_name,
      first_name,
      middle_initial,
      role_id,
      username,
      password,
    } = req.body;

    if (
      typeof last_name !== 'string' ||
      !last_name.trim() ||
      typeof first_name !== 'string' ||
      !first_name.trim() ||
      typeof username !== 'string' ||
      !username.trim() ||
      !Number.isInteger(role_id) ||
      role_id <= 0
    ) {
      return res.status(400).json({
        error: 'Valid name, username, and role are required',
      });
    }

    if (
      middle_initial !== undefined &&
      middle_initial !== null &&
      typeof middle_initial !== 'string'
    ) {
      return res.status(400).json({
        error: 'Invalid middle initial',
      });
    }

    if (
      password !== undefined &&
      (typeof password !== 'string' || password.length < 8)
    ) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters',
      });
    }

    const updatedUser = await withTransaction(async (client) => {
      const existing = await client.query(
        `SELECT user_id
         FROM "User"
         WHERE username = $1 AND user_id <> $2`,
        [username.trim(), userId]
      );

      if (existing.rows.length > 0) {
        const err = new Error('Username already exists');
        err.isDuplicate = true;
        throw err;
      }

      const passwordHash = password
        ? await bcrypt.hash(password, 10)
        : null;

      const result = await client.query(
        `UPDATE "User"
         SET last_name = $1,
             first_name = $2,
             middle_initial = $3,
             role_id = $4,
             username = $5,
             password = COALESCE($6, password)
         WHERE user_id = $7
         RETURNING
           user_id,
           last_name,
           first_name,
           middle_initial,
           username,
           role_id`,
        [
          last_name.trim(),
          first_name.trim(),
          middle_initial?.trim() || null,
          role_id,
          username.trim(),
          passwordHash,
          userId,
        ]
      );

      if (result.rows.length === 0) {
        const err = new Error('User not found');
        err.isNotFound = true;
        throw err;
      }

      return result.rows[0];
    });

    return res.status(200).json({
      message: 'Account updated successfully',
      user: updatedUser,
    });
  } catch (err) {
    if (err.isDuplicate || err.code === '23505') {
      return res.status(409).json({
        error: 'Username already exists',
      });
    }

    if (err.isNotFound) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (err.code === '23503') {
      return res.status(400).json({ error: 'Invalid role ID' });
    }

    console.error(err.message);
    return res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { login, createUser, getUsers, updateUser };