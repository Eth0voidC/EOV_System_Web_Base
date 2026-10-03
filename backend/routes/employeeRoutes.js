const express = require('express');
const router = express.Router();
const { getAllEmployees } = require('../controllers/employeeController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, getAllEmployees); // Staff + Admin can view

module.exports = router;