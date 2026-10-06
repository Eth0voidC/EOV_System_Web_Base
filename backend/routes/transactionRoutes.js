const express = require('express');
const router = express.Router();
const { createTransaction, getTodayTransactions } = require('../controllers/transactionController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/', verifyToken, createTransaction);
router.get('/today', verifyToken, getTodayTransactions);

module.exports = router;