const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");
require("dotenv").config();
const app = express();

// Allow credentials(cookie) requests from known frontend origins.
// Important: if origin doesn't match exactly, browser will block cookie.
const allowedOrigins = (
  process.env.CORS_ORIGINS ||
  process.env.CORS_ORIGIN ||
  "http://localhost:5173"
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // allow non-browser requests (no origin)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS origin not allowed: ${origin}`));
    },
    credentials: true,
  }),
);

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");

app.use(express.json());
app.use(cookieParser());

// routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/product", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/order", orderRoutes);

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB Connected!"))
  .catch(() => console.log("Failed to connect to MongoDB"));

app.listen(process.env.PORT, () => {
  console.log("Server running at port: ", process.env.PORT);
});
