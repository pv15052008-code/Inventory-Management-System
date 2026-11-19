const express = require('express');
const router = express.Router();

// Import controller functions
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  restockProduct,
  sellProduct,
  getLowStockProducts,
  getCategorySummary,
} = require('../controllers/productController');

// Route for creating a product and getting all products
router.post('/', createProduct);
router.get('/', getAllProducts);

// Specific report routes (Placed BEFORE /:id so they are not mistaken for IDs)
router.get('/low-stock', getLowStockProducts);
router.get('/category-summary', getCategorySummary);

// Stock adjustment routes (Restock & Sale)
// Supports both POST and PATCH
router.post('/:id/restock', restockProduct);
router.patch('/:id/restock', restockProduct);

router.post('/:id/sale', sellProduct);
router.patch('/:id/sale', sellProduct);

// Routes for single product operations by ID
router.get('/:id', getProductById);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

module.exports = router;
