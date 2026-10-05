const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const { getEmployeeRecords } = require('../controllers/recordsController');

const router = express.Router();

router.get('/:employeeId', verifyToken, getEmployeeRecords);

module.exports = router;