const express = require('express');
const {
  getProducts,
  getProductByIdentifier,
  createProduct,
  updateProduct,
  deleteProduct,
  syncFromPos,
  syncBulkFromPos
} = require('../controllers/productController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

// Cross-System Sync routes (Authenticated via POS token or Admin JWT)
router.post('/sync-from-pos', syncFromPos);
router.post('/sync-bulk-from-pos', syncBulkFromPos);

// Public routes
router.get('/', getProducts);
router.get('/:identifier', getProductByIdentifier);

// Admin protected routes
router.post('/admin', protect, admin, createProduct);
router.put('/admin/:id', protect, admin, updateProduct);
router.delete('/admin/:id', protect, admin, deleteProduct);

module.exports = router;
