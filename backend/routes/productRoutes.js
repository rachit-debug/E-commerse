const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");
const { getAllProducts, getProductById, getProductsByCategory, createProduct, updateProduct, getRecentProducts } = require("../controllers/productController");

const router = express.Router()

router.get('/get-recent-products', getRecentProducts)
router.get('/get-all-products', authMiddleware, getAllProducts)
router.get('/get-product/:id', authMiddleware, getProductById)
router.get('/get-product-by-category/:categoryId', authMiddleware, getProductsByCategory)
router.post('/create', authMiddleware, adminMiddleware, createProduct)
router.put('/update/:id', authMiddleware, adminMiddleware, updateProduct)

module.exports = router;