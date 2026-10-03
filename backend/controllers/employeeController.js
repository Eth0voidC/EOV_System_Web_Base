const { pool } = require('../config/db');

// GET /api/employees — list all employees with status names joined
const getAllEmployees = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT e.employee_id, e.employee_code, e.last_name, e.first_name, e.middle_initial,
              es.name AS employment_status,
              acs.name AS account_status
       FROM employee e
       JOIN employment_status es ON e.employment_status_id = es.id
       JOIN account_status acs ON e.account_status_id = acs.id
       ORDER BY e.last_name, e.first_name`
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getAllEmployees };