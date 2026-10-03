const { pool } = require('../config/db');

// POST /api/deliveries — record a delivery (one header + multiple items),
// increasing stock for each product in one atomic transaction.
// received_date/received_time are set by the DATABASE (CURRENT_DATE/
// CURRENT_TIME), not sent by the frontend — this matches "Automatic
// (not editable)" exactly, and avoids trusting the client's clock.
const createDelivery = async (req, res) => {
  const { items } = req.body; // [{ product_item_id, quantity_received }]

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'At least one item is required' });
  }

  for (const item of items) {
    if (!item.product_item_id || !item.quantity_received || item.quantity_received <= 0) {
      return res.status(400).json({ error: 'Each item needs a valid product_item_id and quantity_received greater than 0' });
    }
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const deliveryResult = await client.query(
      `INSERT INTO delivery (user_id, received_date, received_time)
       VALUES ($1, CURRENT_DATE, CURRENT_TIME)
       RETURNING delivery_id, received_date, received_time`,
      [req.user.id]
    );
    const delivery = deliveryResult.rows[0];

    for (const item of items) {
      await client.query(
        `INSERT INTO delivery_detail (delivery_id, product_item_id, quantity_received)
         VALUES ($1, $2, $3)`,
        [delivery.delivery_id, item.product_item_id, item.quantity_received]
      );

      await client.query(
        `UPDATE product_item
         SET stock_quantity = stock_quantity + $1
         WHERE product_item_id = $2`,
        [item.quantity_received, item.product_item_id]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      delivery_id: delivery.delivery_id,
      received_date: delivery.received_date,
      received_time: delivery.received_time,
      message: 'Delivery recorded',
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});

    if (err.code === '23503') {
      return res.status(400).json({ error: 'Invalid product_item_id' });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
};

module.exports = { createDelivery };