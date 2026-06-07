const mongoose = require('mongoose')

const cartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    products: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: [true, "Product is required!"],
        },
        quantity: {
            type: Number,
            required: [true, "Quantity is required!"],
            min: 1,
            default: 1,
        },
    }],
    totalAmount: {
        type: Number,
        required: true,
        default: 0,
    },
    totalItems: {
        type: Number,
        required: true,
        default: 0,
    },
    isOrderPlaced: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true })

module.exports = mongoose.model('carts', cartSchema)