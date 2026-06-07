const mongoose = require('mongoose')

const categorySchema = new mongoose.Schema({
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
    imageUrl: {
        type: String,
        trim: true
    },
    isActive:{
        type: Boolean,
        default: true
    }
}, { timestamps: true})

module.exports = mongoose.model("Category", categorySchema)