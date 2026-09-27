const express = require('express');
const router = express.Router();
const { login, createUser } = require('../controllers/authController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

router.post('/login', login);
router.post('/users', verifyToken, requireAdmin, createUser);

module.exports = router;