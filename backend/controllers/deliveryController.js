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
        VALUES (
          $1,
          (NOW() AT TIME ZONE 'Asia/Manila')::date,
          (NOW() AT TIME ZONE 'Asia/Manila')::time
        )
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


const getDeliveryHistory = async (req, res) => {
    try {
        const { month, year } = req.query;

        if (!month || !year) {
            return res.status(400).json({
                error: 'Month and year are required',
            });
        }

        const selectedMonth = Number(month);
        const selectedYear = Number(year);

        if (
            !Number.isInteger(selectedMonth) ||
            selectedMonth < 1 ||
            selectedMonth > 12 ||
            !Number.isInteger(selectedYear) ||
            selectedYear < 2000 ||
            selectedYear > 2100
        ) {
            return res.status(400).json({
                error: 'Invalid month or year',
            });
        }

        const result = await pool.query(
            `SELECT
                d.delivery_id,
                d.received_date,
                d.received_time,
                u.first_name,
                u.last_name,
                dd.product_item_id,
                p.product_name,
                p.price AS unit_price,
                dd.quantity_received,
                (p.price * dd.quantity_received) AS total_amount
            FROM delivery d
            JOIN "User" u
                ON u.user_id = d.user_id
            LEFT JOIN delivery_detail dd
                ON dd.delivery_id = d.delivery_id
            LEFT JOIN product_item p
                ON p.product_item_id = dd.product_item_id
            WHERE EXTRACT(MONTH FROM d.received_date) = $1
              AND EXTRACT(YEAR FROM d.received_date) = $2
            ORDER BY d.received_date DESC,
                     d.received_time DESC,
                     d.delivery_id DESC`,
            [selectedMonth, selectedYear]
        );

        // Group all deliveries by date.
        const deliveriesMap = new Map();

        for (const row of result.rows) {
            const dateKey = String(row.received_date).slice(0, 10);

            if (!deliveriesMap.has(dateKey)) {
                deliveriesMap.set(dateKey, {
                    id: dateKey,
                    date: row.received_date,
                    items: [],
                    totalValue: 0,
                    people: [],
                    deliveryTimes: [],
                });
            }

            const dailyDelivery = deliveriesMap.get(dateKey);

            // Keep receiver names and times for all deliveries that day.
            const person =
                `${row.first_name} ${row.last_name}`;

            if (!dailyDelivery.people.includes(person)) {
                dailyDelivery.people.push(person);
            }

            const time = String(row.received_time).slice(0, 8);

            if (!dailyDelivery.deliveryTimes.includes(time)) {
                dailyDelivery.deliveryTimes.push(time);
            }

            if (row.product_item_id !== null) {
                const quantity = Number(row.quantity_received) || 0;
                const unitPrice = Number(row.unit_price) || 0;
                const total = Number(row.total_amount) || 0;

                dailyDelivery.items.push({
                    product_item_id: row.product_item_id,
                    delivery_id: row.delivery_id,
                    name: row.product_name,
                    qty: quantity,
                    unit_price: unitPrice,
                    total,
                });

                dailyDelivery.totalValue += total;
            }
        }

        return res.status(200).json(
            Array.from(deliveriesMap.values())
        );
    } catch (err) {
        console.error('Get delivery history error:', err);

        return res.status(500).json({
            error: 'Server error',
        });
    }
};

module.exports = { createDelivery, getDeliveryHistory,};