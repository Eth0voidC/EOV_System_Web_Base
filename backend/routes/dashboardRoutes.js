// backend/routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const { getAdminDashboardData } = require('../controllers/dashboardController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

router.get('/', verifyToken, requireAdmin, getAdminDashboardData);

module.exports = router;