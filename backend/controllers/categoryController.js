const { pool } = require('../config/db');

// GET /api/categories — Staff + Admin (dropdowns and filters)
const getAllCategories = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT product_category_id, category_name
       FROM product_category
       ORDER BY category_name`
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/categories — Admin only
const createCategory = async (req, res) => {
  const { category_name } = req.body ?? {};
  const name = typeof category_name === 'string' ? category_name.trim() : '';

  if (name.length < 2 || name.length > 30) {
    return res.status(400).json({ error: 'Category name must be 2 to 30 characters' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO product_category (category_name)
       VALUES ($1)
       RETURNING product_category_id, category_name`,
      [name]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'This category already exists' });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getAllCategories, createCategory };