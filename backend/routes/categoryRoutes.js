const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");
const { getAllCategories, getCategoryById, createCategory, updateCategory } = require("../controllers/categoryController");

const router = express.Router()

router.get('/get-all-categories', getAllCategories)
router.get('/get-category/:id', getCategoryById)
router.post('/create', authMiddleware, adminMiddleware, createCategory)
router.put('/update/:id', authMiddleware, adminMiddleware, updateCategory)

module.exports = router;