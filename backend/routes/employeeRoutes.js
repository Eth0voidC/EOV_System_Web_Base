// const express = require('express');
// const router = express.Router();
// const { getAllEmployees } = require('../controllers/employeeController');
// const { verifyToken } = require('../middleware/authMiddleware');

// router.get('/', verifyToken, getAllEmployees); // Staff + Admin can view

// module.exports = router;


const express = require('express');
const router = express.Router();

const {
  getAllEmployees,
  createEmployee,
  updateEmployee,
} = require('../controllers/employeeController');

const {
  verifyToken,
  requireAdmin,
} = require('../middleware/authMiddleware');

// GET: Staff and Admin can view employees.
router.get('/', verifyToken, getAllEmployees);

// POST: Admin only — register an employee.
router.post('/', verifyToken, requireAdmin, createEmployee);

// PUT: Admin only — update an employee.
router.put('/:id', verifyToken, requireAdmin, updateEmployee);

module.exports = router;