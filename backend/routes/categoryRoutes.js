const express = require('express');
const router = express.Router();
const { getAllCategories, createCategory } = require('../controllers/categoryController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

router.get('/', verifyToken, getAllCategories);
router.post('/', verifyToken, requireAdmin, createCategory);

module.exports = router;