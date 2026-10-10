const express = require('express');
const router = express.Router();
const {
  uploadImage,
  createProduct,
  getAllProducts,
  updateProduct,
  updateProductStatus,
} = require('../controllers/productController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

router.get('/', verifyToken, getAllProducts); // Staff + Admin
router.post('/', verifyToken, requireAdmin, uploadImage, createProduct); // Admin: add product
router.put('/:id', verifyToken, requireAdmin, updateProduct); // Admin: edit name / price / stock
router.patch('/:id/status', verifyToken, requireAdmin, updateProductStatus); // Admin: Active / Inactive

module.exports = router;