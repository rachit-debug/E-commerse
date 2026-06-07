const Cart = require('../models/Cart')

exports.addToCart = async (req, res) => {
    try {
        const { product, quantity } = req.body
        const userId = req.user.userId

        let cart = await Cart.findOne({ userId })

        if (!cart) {
            // No cart yet — create one
            cart = new Cart({
                userId,
                products: [{ product, quantity }],
                totalItems: 1,
            })
        } else {
            const existingItem = cart.products.find(
                (item) => item.product.toString() === product
            )

            if (existingItem) {
                // Product already in cart — increase quantity
                existingItem.quantity += quantity
            } else {
                // New product — push to array
                cart.products.push({ product, quantity })
            }

            cart.totalItems = cart.products.length
        }

        await cart.save()
        res.status(201).json({ success: true, message: "Product added to cart successfully!", cart })
    } catch (err) {
        res.status(500).json({ success: false, message: "Internal Server Error!" })
    }
}

exports.getCart = async (req, res) => {
    try {
        const userId = req.user.userId
        const cart = await Cart.findOne({ userId }).populate('products.product')

        if (!cart) {
            return res.status(400).json({ success: false, message: "Cart not found!" })
        }

        res.status(200).json({ success: true, message: "Cart fetched successfully!", cart })
    } catch (err) {
        res.status(500).json({ success: false, message: "Internal Server Error!" })
    }
}

// Expects: products (array of { product, quantity }), totalAmount, totalItems
exports.updateCart = async (req, res) => {
    try {
        const { products, totalAmount, totalItems } = req.body
        const userId = req.user.userId

        const cart = await Cart.findOne({ userId })
        if (!cart) {
            return res.status(400).json({ success: false, message: "Cart not found!" })
        }

        cart.products = products
        cart.totalAmount = totalAmount
        cart.totalItems = totalItems
        cart.isOrderPlaced = false

        await cart.save()
        res.status(200).json({ success: true, message: "Cart updated successfully!", cart })
    } catch (err) {
        res.status(500).json({ success: false, message: "Internal Server Error!" })
    }
}
