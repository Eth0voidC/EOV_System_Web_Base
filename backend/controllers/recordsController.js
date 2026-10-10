const { pool } = require('../config/db');

// GET /api/records/:employeeId
// Returns the employee's transactions (both active and archived), deductions, and balance.
const getEmployeeRecords = async (req, res) => {
  const employeeId = Number(req.params.employeeId);

  if (!Number.isInteger(employeeId) || employeeId <= 0) {
    return res.status(400).json({ error: 'Invalid employee id' });
  }

  try {
    // 1. Get the current active balance
    const balanceResult = await pool.query(
      `SELECT total_balance FROM employee_balance WHERE employee_id = $1`,
      [employeeId]
    );

    // 2. Get ALL Transactions (Active/Pending + Archived/Deducted)
    const txnResult = await pool.query(
      `
      -- Active (Pending) Transactions
      SELECT et.employee_transaction_id AS id,
             to_char(et.transaction_date, 'YYYY-MM-DD') AS date,
             'Pending' AS status,
             COALESCE((
               SELECT json_agg(json_build_object('name', p.product_name, 'qty', td.quantity, 'price', td.unit_price::float8) ORDER BY p.product_name)
               FROM transaction_detail td
               JOIN product_item p ON p.product_item_id = td.product_item_id
               WHERE td.employee_transaction_id = et.employee_transaction_id
             ), '[]'::json) AS items
      FROM employee_transaction et
      WHERE et.employee_id = $1

      UNION ALL

      -- Archived (Deducted) Transactions
      SELECT eta.employee_transaction_archive_id AS id,
             to_char(eta.transaction_date, 'YYYY-MM-DD') AS date,
             'Deducted' AS status,
             COALESCE((
               SELECT json_agg(json_build_object('name', p.product_name, 'qty', tda.quantity, 'price', tda.unit_price::float8) ORDER BY p.product_name)
               FROM transaction_detail_archive tda
               JOIN product_item p ON p.product_item_id = tda.product_item_id
               WHERE tda.employee_transaction_archive_id = eta.employee_transaction_archive_id
             ), '[]'::json) AS items
      FROM employee_transaction_archive eta
      WHERE eta.employee_id = $1
      
      ORDER BY date DESC, id DESC
      `,
      [employeeId]
    );

    // 3. Get Deductions History (with nested daily totals for the drill-down modal)
    const deductionResult = await pool.query(
      `
      SELECT ed.employee_deduction_id AS id,
             to_char(ed.deduction_date, 'YYYY-MM-DD') AS date,
             to_char(ed.period_start, 'YYYY-MM-DD') AS "periodStart",
             to_char(ed.period_end, 'YYYY-MM-DD') AS "periodEnd",
             COALESCE((
               SELECT json_agg(
                  json_build_object(
                      'date', to_char(eta.transaction_date, 'YYYY-MM-DD'),
                      'amount', (
                          SELECT SUM(total_amount)::float8
                          FROM transaction_detail_archive tda
                          WHERE tda.employee_transaction_archive_id = eta.employee_transaction_archive_id
                      )
                  ) ORDER BY eta.transaction_date
               )
               FROM employee_transaction_archive eta
               WHERE eta.employee_deduction_id = ed.employee_deduction_id
             ), '[]'::json) AS entries
      FROM employee_deduction ed
      WHERE ed.employee_id = $1
      ORDER BY ed.deduction_date DESC
      `,
      [employeeId]
    );

    res.status(200).json({
      balance: balanceResult.rows.length ? Number(balanceResult.rows[0].total_balance) : 0,
      transactions: txnResult.rows,
      deductions: deductionResult.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getEmployeeRecords };