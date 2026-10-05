const express = require('express');
const router = express.Router();
const { createTransaction } = require('../controllers/transactionController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/', verifyToken, createTransaction);

module.exports = router;