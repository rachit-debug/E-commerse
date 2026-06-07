const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 50
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
        match: [/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/, "Invalid format of passsword!"]
    },
    contactNumber: {
        type: String,
        required: true,
        trim: true,
        minlength: 10,
        maxlength: 10
    },
    address: {
        type: String,
        required: true,
        trim: true
    },
    role: {
        type: String,
        enum: ["admin", "customer"],
        default: "customer"
    }

}, { timestamps: true})

module.exports = mongoose.model("User", userSchema, "users")