const express = require('express');
const router = express.Router();
const { createDelivery, getDeliveryHistory } = require('../controllers/deliveryController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/', verifyToken, createDelivery); // Staff + Admin can record deliveries
router.get('/', verifyToken, getDeliveryHistory); // Admin can view delivery history
module.exports = router;