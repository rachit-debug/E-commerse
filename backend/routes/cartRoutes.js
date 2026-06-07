const express = require('express')
const authMiddleware = require('../middlewares/authMiddleware')
const { addToCart, getCart, updateCart } = require('../controllers/cartController')
const router = express.Router()

router.post('/add-to-cart', authMiddleware, addToCart)
router.get('/get-cart', authMiddleware, getCart)
router.put('/update-cart', authMiddleware, updateCart)

module.exports = router