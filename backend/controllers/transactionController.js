const { pool } = require('../config/db');

// POST /api/transactions
// Body: { employee_id, items: [{ product_item_id, quantity }] }
//
// Finds or creates today's transaction header for this employee,
// then adds detail rows for each item — all atomic:
//   - blocks if employee is Inactive or Restricted
//   - blocks if any item exceeds available stock
//   - decreases stock for each item
//   - increases the employee's running balance by the total
const createTransaction = async (req, res) => {
  const { employee_id, items } = req.body;
  const userId = req.user.id;

  if (!employee_id || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'employee_id and at least one item are required' });
  }

  for (const item of items) {
    if (!item.product_item_id || !item.quantity || item.quantity <= 0) {
      return res.status(400).json({ error: 'Each item needs a valid product_item_id and quantity greater than 0' });
    }
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Gate check: employment status + account status
    const employeeCheck = await client.query(
      `SELECT e.employee_id, e.first_name, e.last_name,
              es.name AS employment_status, acs.name AS account_status
       FROM employee e
       JOIN employment_status es ON e.employment_status_id = es.id
       JOIN account_status acs ON e.account_status_id = acs.id
       WHERE e.employee_id = $1
       FOR UPDATE`,
      [employee_id]
    );

    if (employeeCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Employee not found' });
    }

    const employee = employeeCheck.rows[0];

    if (employee.employment_status === 'Inactive') {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: `${employee.first_name} ${employee.last_name} is no longer an active employee` });
    }

    if (employee.account_status === 'Restricted') {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: `${employee.first_name} ${employee.last_name}'s account is restricted` });
    }

    // Find or create today's transaction header (one per employee per day)
    let transactionId;
    const existingTxn = await client.query(
      `SELECT employee_transaction_id FROM employee_transaction
      WHERE employee_id = $1 AND transaction_date = (NOW() AT TIME ZONE 'Asia/Manila')::date`,
      [employee_id]
    );

    if (existingTxn.rows.length > 0) {
      transactionId = existingTxn.rows[0].employee_transaction_id;
    } else {
      const newTxn = await client.query(
        `INSERT INTO employee_transaction (employee_id, transaction_date) 
        VALUES ($1, (NOW() AT TIME ZONE 'Asia/Manila')::date) 
        RETURNING employee_transaction_id`,
        [employee_id]
      );
      transactionId = newTxn.rows[0].employee_transaction_id;
    }

    let transactionTotal = 0;

    for (const item of items) {
      const productResult = await client.query(
        `SELECT pi.product_item_id, pi.product_name, pi.price, pi.stock_quantity,
         ps.name AS status
         FROM product_item pi
         JOIN product_status ps ON pi.product_status_id = ps.id
         WHERE pi.product_item_id = $1
         FOR UPDATE OF pi`,
        [item.product_item_id]
      );

      if (productResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Product ${item.product_item_id} not found` });
      }

      const product = productResult.rows[0];

        if (product.status !== 'Active') {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `${product.product_name} is no longer available` });
      }

      const unitPrice = Number(product.price);
      const totalAmount = unitPrice * item.quantity;
      transactionTotal += totalAmount;

      await client.query(
        `INSERT INTO transaction_detail
        (employee_transaction_id, product_item_id, quantity, unit_price, total_amount, user_id)
        VALUES ($1, $2, $3, $4, $5, $6)`,
        [transactionId, item.product_item_id, item.quantity, unitPrice, totalAmount, userId]
      );

      await client.query(
        `UPDATE product_item SET stock_quantity = stock_quantity - $1 WHERE product_item_id = $2`,
        [item.quantity, item.product_item_id]
      );
    }

    await client.query(
      `UPDATE employee_balance SET total_balance = total_balance + $1 WHERE employee_id = $2`,
      [transactionTotal, employee_id]
    );

    await client.query('COMMIT');

    res.status(201).json({
      employee_transaction_id: transactionId,
      employee_id,
      items_added: items.length,
      transaction_total: transactionTotal.toFixed(2),
      message: 'Transaction recorded',
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
};



const getTodayTransactions = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT et.employee_transaction_id,
              et.created_at,
              e.last_name, e.first_name,
              COUNT(td.transaction_detail_id)::int AS items,
              COALESCE(SUM(td.total_amount), 0) AS total
       FROM employee_transaction et
       JOIN employee e ON et.employee_id = e.employee_id
       LEFT JOIN transaction_detail td ON td.employee_transaction_id = et.employee_transaction_id
       WHERE et.transaction_date = (NOW() AT TIME ZONE 'Asia/Manila')::date
       GROUP BY et.employee_transaction_id, et.created_at, e.last_name, e.first_name
       ORDER BY et.created_at DESC`
    );

    res.status(200).json(
      result.rows.map((r) => ({
        id: r.employee_transaction_id,
        time: r.created_at,
        employee: `${r.first_name} ${r.last_name}`,
        items: r.items,
        total: Number(r.total),
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { createTransaction, getTodayTransactions };