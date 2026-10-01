const express = require('express');
const router = express.Router();
const { upload, createProduct, getAllProducts } = require('../controllers/productController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

router.get('/', verifyToken, getAllProducts);
router.post('/', verifyToken, requireAdmin, upload.single('image'), createProduct);

module.exports = router;