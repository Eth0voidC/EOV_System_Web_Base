const express = require('express');
const router = express.Router();
const { createDelivery } = require('../controllers/deliveryController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/', verifyToken, createDelivery); // Staff + Admin can record deliveries

module.exports = router;