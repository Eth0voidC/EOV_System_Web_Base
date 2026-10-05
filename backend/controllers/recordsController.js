const { pool } = require('../config/db');

// GET /api/records/:employeeId
// Returns the employee's transactions (with items), deductions, and balance.
const getEmployeeRecords = async (req, res) => {
  const employeeId = Number(req.params.employeeId);

  if (!Number.isInteger(employeeId) || employeeId <= 0) {
    return res.status(400).json({ error: 'Invalid employee id' });
  }

  try {
    const balanceResult = await pool.query(
      `SELECT total_balance FROM employee_balance WHERE employee_id = $1`,
      [employeeId]
    );

    // Items are grouped per product so the same product bought twice
    // in one day shows as one line (the modal uses the name as its key).
    const txnResult = await pool.query(
      `SELECT et.employee_transaction_id AS id,
              to_char(et.transaction_date, 'YYYY-MM-DD') AS date,
              COALESCE((
                SELECT json_agg(
                         json_build_object('name', x.product_name, 'qty', x.qty, 'price', x.unit_price)
                         ORDER BY x.product_name
                       )
                FROM (
                  SELECT p.product_name,
                         SUM(td.quantity)::int AS qty,
                         td.unit_price::float8 AS unit_price
                  FROM transaction_detail td
                  JOIN product_item p ON p.product_item_id = td.product_item_id
                  WHERE td.employee_transaction_id = et.employee_transaction_id
                  GROUP BY p.product_name, td.unit_price
                ) x
              ), '[]'::json) AS items
       FROM employee_transaction et
       WHERE et.employee_id = $1
       ORDER BY et.transaction_date DESC, et.employee_transaction_id DESC`,
      [employeeId]
    );

    res.status(200).json({
      balance: balanceResult.rows.length ? Number(balanceResult.rows[0].total_balance) : 0,
      // No paid/unpaid column yet, so everything counts as Pending until deductions exist.
      transactions: txnResult.rows.map((t) => ({ ...t, status: 'Pending' })),
      deductions: [], // not implemented yet
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getEmployeeRecords };