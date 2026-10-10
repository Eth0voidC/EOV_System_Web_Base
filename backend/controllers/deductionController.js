const { pool } = require('../config/db');

// GET /api/deductions/pending
// Fetches both active (Pending) and archived (Deducted) transactions for a specific date range
const getPendingDeductions = async (req, res) => {
    const { start, end } = req.query;
    if (!start || !end) return res.status(400).json({ error: 'Start and end dates are required' });

    try {
        const result = await pool.query(`
            WITH daily_txns AS (
                -- 1. Get active (Pending) transactions
                SELECT et.employee_id, 
                       et.transaction_date, 
                       SUM(td.total_amount) AS daily_amount,
                       'Pending' AS status
                FROM employee_transaction et
                JOIN transaction_detail td ON et.employee_transaction_id = td.employee_transaction_id
                WHERE et.transaction_date BETWEEN $1 AND $2
                GROUP BY et.employee_id, et.transaction_date
                
                UNION ALL
                
                -- 2. Get archived (Deducted) transactions
                SELECT eta.employee_id, 
                       eta.transaction_date, 
                       SUM(tda.total_amount) AS daily_amount,
                       'Deducted' AS status
                FROM employee_transaction_archive eta
                JOIN transaction_detail_archive tda ON eta.employee_transaction_archive_id = tda.employee_transaction_archive_id
                WHERE eta.transaction_date BETWEEN $1 AND $2
                GROUP BY eta.employee_id, eta.transaction_date
            )
            SELECT 
                e.employee_id AS id,
                e.last_name || ', ' || e.first_name AS name,
                SUM(d.daily_amount) AS total,
                d.status,
                json_agg(json_build_object('date', to_char(d.transaction_date, 'YYYY-MM-DD'), 'amount', d.daily_amount)) AS details
            FROM daily_txns d
            JOIN employee e ON d.employee_id = e.employee_id
            GROUP BY e.employee_id, e.last_name, e.first_name, d.status
            ORDER BY e.last_name, d.status DESC
        `, [start, end]);

        // Format the period string and generate a unique ID for React mapping
        const formatted = result.rows.map(row => ({
            ...row,
            id: `${row.id}-${row.status}`, // Unique ID prevents React mapping errors if an employee has both statuses
            total: Number(row.total),
            period: `${start} to ${end}`
        }));

        res.status(200).json(formatted);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching deductions' });
    }
};

// POST /api/deductions/process
// Archives the transactions and lowers the employee balances
const processDeductions = async (req, res) => {
    const { start_date, end_date } = req.body;
    if (!start_date || !end_date) return res.status(400).json({ error: 'Start and end dates required' });

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const empRes = await client.query(
            `SELECT DISTINCT employee_id FROM employee_transaction WHERE transaction_date BETWEEN $1 AND $2`, 
            [start_date, end_date]
        );
        
        if (empRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'No pending transactions found for this period.' });
        }
        
        for (const emp of empRes.rows) {
            const employeeId = emp.employee_id;
            
            // 1. Calculate total for this employee
            const sumRes = await client.query(`
                SELECT SUM(td.total_amount) as total_amount
                FROM employee_transaction et
                JOIN transaction_detail td ON et.employee_transaction_id = td.employee_transaction_id
                WHERE et.employee_id = $1 AND et.transaction_date BETWEEN $2 AND $3
            `, [employeeId, start_date, end_date]);
            
            const totalAmount = sumRes.rows[0].total_amount;
            
            // 2. Create the Deduction Header
            const dedRes = await client.query(`
                INSERT INTO employee_deduction (employee_id, period_start, period_end, deduction_date, deduction_amount)
                VALUES ($1, $2, $3, (NOW() AT TIME ZONE 'Asia/Manila')::date, $4)
                RETURNING employee_deduction_id
            `, [employeeId, start_date, end_date, totalAmount]);
            const deductionId = dedRes.rows[0].employee_deduction_id;
            
            // 3. Move headers and details to the archives
            const txns = await client.query(`
                SELECT employee_transaction_id, transaction_date
                FROM employee_transaction
                WHERE employee_id = $1 AND transaction_date BETWEEN $2 AND $3
            `, [employeeId, start_date, end_date]);
            
            for (const txn of txns.rows) {
                const archiveHeader = await client.query(`
                    INSERT INTO employee_transaction_archive (employee_deduction_id, employee_id, transaction_date)
                    VALUES ($1, $2, $3)
                    RETURNING employee_transaction_archive_id
                `, [deductionId, employeeId, txn.transaction_date]);

                await client.query(`
                    INSERT INTO transaction_detail_archive (
                        employee_transaction_archive_id,
                        product_item_id,
                        quantity,
                        unit_price,
                        total_amount,
                        user_id
                    )
                    SELECT
                        $1,
                        product_item_id,
                        quantity,
                        unit_price,
                        total_amount,
                        user_id
                    FROM transaction_detail
                    WHERE employee_transaction_id = $2
                `, [
                    archiveHeader.rows[0].employee_transaction_archive_id,
                    txn.employee_transaction_id
                ]);
                
                // 4. Delete the active rows
                await client.query(`DELETE FROM transaction_detail WHERE employee_transaction_id = $1`, [txn.employee_transaction_id]);
                await client.query(`DELETE FROM employee_transaction WHERE employee_transaction_id = $1`, [txn.employee_transaction_id]);
            }
            
            // 5. Decrease the running balance
            await client.query(`
                UPDATE employee_balance 
                SET total_balance = total_balance - $1 
                WHERE employee_id = $2
            `, [totalAmount, employeeId]);
        }
        
        await client.query('COMMIT');
        res.status(200).json({ message: 'Deductions processed successfully' });
    } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        console.error(err);
        res.status(500).json({ error: 'Failed to process deductions' });
    } finally {
        client.release();
    }
};

module.exports = { getPendingDeductions, processDeductions };