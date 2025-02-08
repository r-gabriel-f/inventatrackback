const express = require('express');
const router = express.Router();
const productController = require('../controllers/products');

router.get('/products', productController.getProducts);
router.post('/products', productController.createProduct);
router.delete('/products/:id', productController.deleteProduct);
router.put('/products/:id', productController.updateProduct);

module.exports = router;
