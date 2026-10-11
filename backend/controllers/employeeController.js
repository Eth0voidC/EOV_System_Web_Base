// const { pool } = require('../config/db');

// // GET /api/employees — list all employees with status names joined
// const getAllEmployees = async (req, res) => {
//   try {
//     const result = await pool.query(
//       `SELECT e.employee_id, e.employee_code, e.last_name, e.first_name, e.middle_initial,
//               es.name AS employment_status,
//               acs.name AS account_status
//        FROM employee e
//        JOIN employment_status es ON e.employment_status_id = es.id
//        JOIN account_status acs ON e.account_status_id = acs.id
//        ORDER BY e.last_name, e.first_name`
//     );
//     res.status(200).json(result.rows);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Server error' });
//   }
// };

// module.exports = { getAllEmployees };



const { pool, withTransaction } = require('../config/db');

// GET /api/employees
// Staff and Admin can view all employees.
const getAllEmployees = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        e.employee_id,
        e.employee_code,
        e.last_name,
        e.first_name,
        e.middle_initial,
        es.name AS employment_status,
        acs.name AS account_status,
        COALESCE(eb.total_balance, 0) AS balance
      FROM employee e
      JOIN employment_status es
        ON e.employment_status_id = es.id
      JOIN account_status acs
        ON e.account_status_id = acs.id
      LEFT JOIN employee_balance eb
        ON e.employee_id = eb.employee_id
      ORDER BY e.last_name, e.first_name
    `);

    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Get employees error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/employees
// Register a new Regular or Extra employee.
const createEmployee = async (req, res) => {
  try {
    const {
      last_name,
      first_name,
      middle_initial = null,
      employment_status,
    } = req.body;

    // Validate required fields.
    if (
      typeof last_name !== 'string' ||
      typeof first_name !== 'string' ||
      !last_name.trim() ||
      !first_name.trim()
    ) {
      return res.status(400).json({
        error: 'First name and last name are required.',
      });
    }

    const cleanLastName = last_name.trim();
    const cleanFirstName = first_name.trim();

    const cleanMiddleInitial =
      typeof middle_initial === 'string'
        ? middle_initial.trim() || null
        : null;

    // Validate name characters.
    const namePattern = /^[\p{L}\p{M} .'-]+$/u;

    if (
      !namePattern.test(cleanLastName) ||
      !namePattern.test(cleanFirstName) ||
      (cleanMiddleInitial &&
        !/^[\p{L}\p{M}.]+$/u.test(cleanMiddleInitial))
    ) {
      return res.status(400).json({
        error: 'Names contain invalid characters.',
      });
    }

    // New registrations cannot be Inactive.
    if (!['Regular', 'Extra'].includes(employment_status)) {
      return res.status(400).json({
        error: 'Employment status must be Regular or Extra.',
      });
    }

    const employee = await withTransaction(async (client) => {
      // Check for an existing employee with the same name.
      const duplicate = await client.query(
        `
          SELECT employee_id
          FROM employee
          WHERE LOWER(TRIM(last_name)) = LOWER($1)
            AND LOWER(TRIM(first_name)) = LOWER($2)
            AND LOWER(TRIM(COALESCE(middle_initial, ''))) =
                LOWER($3)
          LIMIT 1
        `,
        [
          cleanLastName,
          cleanFirstName,
          cleanMiddleInitial || '',
        ]
      );

      if (duplicate.rowCount > 0) {
        const error = new Error('An employee with this name already exists.');
        error.statusCode = 409;
        throw error;
      }

      const statusResult = await client.query(
        `
          SELECT
            es.id AS employment_status_id,
            acs.id AS account_status_id
          FROM employment_status es
          CROSS JOIN account_status acs
          WHERE es.name = $1
            AND acs.name = 'Active'
        `,
        [employment_status]
      );

      if (statusResult.rowCount === 0) {
        const error = new Error('Invalid employee status configuration.');
        error.statusCode = 500;
        throw error;
      }

      const {
        employment_status_id,
        account_status_id,
      } = statusResult.rows[0];

      // Database triggers generate employee_code and employee_balance.
      const inserted = await client.query(
        `
          INSERT INTO employee (
            last_name,
            first_name,
            middle_initial,
            employment_status_id,
            account_status_id
          )
          VALUES ($1, $2, $3, $4, $5)
          RETURNING employee_id
        `,
        [
          cleanLastName,
          cleanFirstName,
          cleanMiddleInitial,
          employment_status_id,
          account_status_id,
        ]
      );

      const newEmployeeId = inserted.rows[0].employee_id;

      const result = await client.query(
        `
          SELECT
            e.employee_id,
            e.employee_code,
            e.last_name,
            e.first_name,
            e.middle_initial,
            es.name AS employment_status,
            acs.name AS account_status,
            COALESCE(eb.total_balance, 0) AS balance
          FROM employee e
          JOIN employment_status es
            ON e.employment_status_id = es.id
          JOIN account_status acs
            ON e.account_status_id = acs.id
          LEFT JOIN employee_balance eb
            ON e.employee_id = eb.employee_id
          WHERE e.employee_id = $1
        `,
        [newEmployeeId]
      );

      return result.rows[0];
    });

    res.status(201).json({
      message: 'Employee registered successfully.',
      employee,
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }

    if (err.code === '23505') {
      return res.status(409).json({
        error: 'An employee with this information already exists.',
      });
    }

    console.error('Create employee error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// PUT /api/employees/:id
// Update employee details and apply employment/account status rules.
const updateEmployee = async (req, res) => {
  try {
    const employeeId = Number(req.params.id);

    if (!Number.isInteger(employeeId) || employeeId <= 0) {
      return res.status(400).json({ error: 'Invalid employee ID.' });
    }

    const {
      last_name,
      first_name,
      middle_initial = null,
      employment_status,
      account_status,
    } = req.body;

    if (
      typeof last_name !== 'string' ||
      typeof first_name !== 'string' ||
      !last_name.trim() ||
      !first_name.trim()
    ) {
      return res.status(400).json({
        error: 'First name and last name are required.',
      });
    }

    const cleanLastName = last_name.trim();
    const cleanFirstName = first_name.trim();

    const cleanMiddleInitial =
      typeof middle_initial === 'string'
        ? middle_initial.trim() || null
        : null;

    const namePattern = /^[\p{L}\p{M} .'-]+$/u;

    if (
      !namePattern.test(cleanLastName) ||
      !namePattern.test(cleanFirstName) ||
      (cleanMiddleInitial &&
        !/^[\p{L}\p{M}.]+$/u.test(cleanMiddleInitial))
    ) {
      return res.status(400).json({
        error: 'Names contain invalid characters.',
      });
    }

    if (!['Regular', 'Extra', 'Inactive'].includes(employment_status)) {
      return res.status(400).json({
        error: 'Invalid employment status.',
      });
    }

    if (!['Active', 'Restricted'].includes(account_status)) {
      return res.status(400).json({
        error: 'Invalid account status.',
      });
    }

    const employee = await withTransaction(async (client) => {
      // Lock this employee row while applying status rules.
      const currentResult = await client.query(
        `
          SELECT
            e.employee_id,
            es.name AS employment_status,
            acs.name AS account_status
          FROM employee e
          JOIN employment_status es
            ON e.employment_status_id = es.id
          JOIN account_status acs
            ON e.account_status_id = acs.id
          WHERE e.employee_id = $1
          FOR UPDATE OF e
        `,
        [employeeId]
      );

      if (currentResult.rowCount === 0) {
        const error = new Error('Employee not found.');
        error.statusCode = 404;
        throw error;
      }

      const current = currentResult.rows[0];

      // Check duplicate names, excluding the employee being edited.
      const duplicate = await client.query(
        `
          SELECT employee_id
          FROM employee
          WHERE employee_id <> $1
            AND LOWER(TRIM(last_name)) = LOWER($2)
            AND LOWER(TRIM(first_name)) = LOWER($3)
            AND LOWER(TRIM(COALESCE(middle_initial, ''))) =
                LOWER($4)
          LIMIT 1
        `,
        [
          employeeId,
          cleanLastName,
          cleanFirstName,
          cleanMiddleInitial || '',
        ]
      );

      if (duplicate.rowCount > 0) {
        const error = new Error('Another employee with this name already exists.');
        error.statusCode = 409;
        throw error;
      }

      // Apply the agreed status rules.
      let finalAccountStatus = account_status;

      if (employment_status === 'Inactive') {
        finalAccountStatus = 'Restricted';
      } else if (current.employment_status === 'Inactive') {
        // Reactivating an inactive employee restores account access.
        finalAccountStatus = 'Active';
      }

      const statusResult = await client.query(
        `
          SELECT
            es.id AS employment_status_id,
            acs.id AS account_status_id
          FROM employment_status es
          CROSS JOIN account_status acs
          WHERE es.name = $1
            AND acs.name = $2
        `,
        [employment_status, finalAccountStatus]
      );

      if (statusResult.rowCount === 0) {
        const error = new Error('Invalid employee status configuration.');
        error.statusCode = 500;
        throw error;
      }

      const {
        employment_status_id,
        account_status_id,
      } = statusResult.rows[0];

      await client.query(
        `
          UPDATE employee
          SET
            last_name = $1,
            first_name = $2,
            middle_initial = $3,
            employment_status_id = $4,
            account_status_id = $5
          WHERE employee_id = $6
        `,
        [
          cleanLastName,
          cleanFirstName,
          cleanMiddleInitial,
          employment_status_id,
          account_status_id,
          employeeId,
        ]
      );

      const result = await client.query(
        `
          SELECT
            e.employee_id,
            e.employee_code,
            e.last_name,
            e.first_name,
            e.middle_initial,
            es.name AS employment_status,
            acs.name AS account_status,
            COALESCE(eb.total_balance, 0) AS balance
          FROM employee e
          JOIN employment_status es
            ON e.employment_status_id = es.id
          JOIN account_status acs
            ON e.account_status_id = acs.id
          LEFT JOIN employee_balance eb
            ON e.employee_id = eb.employee_id
          WHERE e.employee_id = $1
        `,
        [employeeId]
      );

      return result.rows[0];
    });

    res.status(200).json({
      message: 'Employee updated successfully.',
      employee,
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }

    if (err.code === '23505') {
      return res.status(409).json({
        error: 'An employee with this information already exists.',
      });
    }

    console.error('Update employee error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  getAllEmployees,
  createEmployee,
  updateEmployee,
};