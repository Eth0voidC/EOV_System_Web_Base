const express = require('express');
const router = express.Router();
const { getPendingDeductions, processDeductions } = require('../controllers/deductionController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

router.get('/pending', verifyToken, requireAdmin, getPendingDeductions);
router.post('/process', verifyToken, requireAdmin, processDeductions);

module.exports = router;