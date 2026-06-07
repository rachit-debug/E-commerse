const express = require('express')
const adminMiddleware = require('../middlewares/adminMiddleware')
const authMiddleware = require('../middlewares/authMiddleware')
const {
    createOrder,
    getAllOrders,
    getAllOrdersForUser,
    getOrderById,
    updateOrderStatus,
    createRazorpayOrder,
    verifyRazorpayPayment,
} = require('../controllers/orderController')
const router = express.Router()

router.post('/create-order', authMiddleware, createOrder)
router.post('/razorpay/create', authMiddleware, createRazorpayOrder)
router.post('/razorpay/verify', authMiddleware, verifyRazorpayPayment)
router.get('/get-all-orders', authMiddleware, adminMiddleware, getAllOrders)
router.get('/get-all-orders-for-user', authMiddleware, getAllOrdersForUser)
router.get('/get-order-by-id/:id', authMiddleware, getOrderById)
router.put('/update-order-status/:id', authMiddleware, adminMiddleware, updateOrderStatus)

module.exports = router