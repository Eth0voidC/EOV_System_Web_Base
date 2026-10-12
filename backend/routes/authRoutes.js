const express = require('express');
const router = express.Router();
const { login, createUser, getUsers, updateUser } = require('../controllers/authController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

router.post('/login', login);
router.post('/users', verifyToken, requireAdmin, createUser);
router.get('/users', verifyToken, requireAdmin, getUsers);
router.patch('/users/:id', verifyToken, requireAdmin, updateUser);
module.exports = router;