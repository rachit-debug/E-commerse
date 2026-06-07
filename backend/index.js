const express = require('express')
const mongoose = require('mongoose')
const cookieParser = require('cookie-parser')
const cors = require('cors')
require('dotenv').config();
const app = express()

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}))

const authRoutes = require("./routes/authRoutes")
const userRoutes = require("./routes/userRoutes")
const categoryRoutes = require("./routes/categoryRoutes")
const productRoutes = require("./routes/productRoutes")
const cartRoutes = require("./routes/cartRoutes")
const orderRoutes = require("./routes/orderRoutes")

app.use(express.json())
app.use(cookieParser())

// routes
app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/category', categoryRoutes)
app.use('/api/product', productRoutes)
app.use('/api/cart', cartRoutes)
app.use('/api/order', orderRoutes)

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("MongoDB Connected!"))
    .catch(() => console.log("Failed to connect to MongoDB"))

app.listen(process.env.PORT, () => {
    console.log("Server running at port: ", process.env.PORT)
})