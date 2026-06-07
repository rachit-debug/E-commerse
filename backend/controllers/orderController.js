const crypto = require('crypto')
const Razorpay = require('razorpay')
const Order = require('../models/Order')
const Cart = require('../models/Cart')

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
})

exports.createOrder = async (req, res) => {
    try {
        const { products, totalAmount, paymentMethod, razorpayPaymentId } = req.body
        const userId = req.user.userId

        const order = new Order({
            userId,
            products,
            totalAmount,
            paymentMethod,
            razorpayPaymentId: razorpayPaymentId ? razorpayPaymentId : null,
        })

        await order.save()
        res.status(201).json({ success: true, message: "Order created successfully!", order })
    } catch (err) {
        res.status(500).json({ success: false, message: "Internal Server Error!" })
    }
}

exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('userId', '-password')
            .populate('products.product')

        res.status(200).json({ success: true, message: "Fetched all orders successfully!", orders })
    } catch (err) {
        res.status(500).json({ success: false, message: "Internal Server Error!" })
    }
}

exports.getAllOrdersForUser = async (req, res) => {
    try {
        const userId = req.user.userId
        const orders = await Order.find({ userId })
            .populate('userId', '-password')
            .populate('products.product')

        res.status(200).json({ success: true, message: "Fetched all orders successfully!", orders })
    } catch (err) {
        res.status(500).json({ success: false, message: "Internal Server Error!" })
    }
}

exports.getOrderById = async (req, res) => {
    try {
        const orderId = req.params.id
        const order = await Order.findById(orderId)
            .populate('userId', '-password')
            .populate('products.product')

        if (!order) {
            return res.status(400).json({ success: false, message: "Invalid order id!" })
        }

        res.status(200).json({ success: true, message: "Fetched order successfully!", order })
    } catch (err) {
        res.status(500).json({ success: false, message: "Internal Server Error!" })
    }
}

exports.createRazorpayOrder = async (req, res) => {
    try {
        const { items } = req.body
        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Cart is empty' })
        }

        const totalPaise = Math.round(
            items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100
        )

        const rpOrder = await razorpay.orders.create({
            amount: totalPaise,
            currency: 'INR',
            receipt: `rcpt_${Date.now()}`,
        })

        res.json({
            success: true,
            orderId: rpOrder.id,
            amount: rpOrder.amount,
            currency: rpOrder.currency,
            keyId: process.env.RAZORPAY_KEY_ID,
        })
    } catch (err) {
        console.error('createRazorpayOrder error:', err)
        res.status(500).json({ success: false, message: err.message || 'Internal Server Error' })
    }
}

exports.verifyRazorpayPayment = async (req, res) => {
    try {
        const {
            items,
            shippingAddress,
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
        } = req.body

        // Verify signature
        const body = `${razorpay_order_id}|${razorpay_payment_id}`
        const expectedSig = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex')

        if (expectedSig !== razorpay_signature) {
            return res.status(400).json({ success: false, message: 'Payment verification failed' })
        }

        const userId = req.user.userId
        const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

        const order = new Order({
            userId,
            products: items.map((item) => ({ product: item.product, quantity: item.quantity })),
            totalAmount,
            paymentMethod: 'Razorpay',
            razorpayPaymentId: razorpay_payment_id,
            razorpayOrderId: razorpay_order_id,
            shippingAddress: shippingAddress || '',
        })
        await order.save()

        // Clear the user's cart
        await Cart.findOneAndUpdate(
            { userId },
            { products: [], totalAmount: 0, totalItems: 0 }
        )

        res.json({ success: true, message: 'Payment verified & order placed!', order })
    } catch (err) {
        console.error('verifyRazorpayPayment error:', err)
        res.status(500).json({ success: false, message: err.message || 'Internal Server Error' })
    }
}

exports.updateOrderStatus = async (req, res) => {
    try {
        const orderId = req.params.id
        const { status } = req.body

        const order = await Order.findByIdAndUpdate(
            orderId,
            { status },
            { new: true, runValidators: true }
        )

        if (!order) {
            return res.status(400).json({ success: false, message: "Invalid order id!" })
        }

        res.status(200).json({ success: true, message: "Order status updated successfully!", order })
    } catch (err) {
        res.status(500).json({ success: false, message: "Internal Server Error!" })
    }
}
