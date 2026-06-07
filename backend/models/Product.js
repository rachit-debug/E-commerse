const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        unique: true,
        minlength: 3,
        maxlength: 50,
        trim: true
    },
    description: {
        type: String,
        trim: true,
        minlength: 5,
        maxlength: 200
    },
    mrpPrice: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    sellingPrice: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    imageUrls: [{
        type: String, // ["asdfasd", "asdasd", "adsasd"]
        trim: true
    }],
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'categories',
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    stockQty: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    brand: {
        type: String,
        required: true,
        trim: true,
    },
    rating: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
        max: 5
    },
    noOfRatings: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    }
}, { timestamps: true})

module.exports = mongoose.model("Product", productSchema)