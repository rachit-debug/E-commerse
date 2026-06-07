const User = require("../models/User");
const joi = require("joi");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.logoutUser = (req, res) => {
  res
    .clearCookie("token", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    })
    .status(200)
    .json({ success: true, message: "Logged out successfully!" });
};

exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, contactNumber, address } = req.body;

    const schema = joi.object({
      name: joi.string().trim().min(2).max(50).required(),
      email: joi.string().email().trim().lowercase().required(),
      password: joi
        .string()
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/)
        .required(),
      contactNumber: joi.string().trim().min(10).max(10).required(),
      address: joi.string().required(),
    });

    const { error } = schema.validate(req.body);
    if (error) {
      res.status(400).json({ success: false, message: error.message });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      res
        .status(400)
        .json({
          success: false,
          message: "User already exists, please register with different email.",
        });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      Number(process.env.SALTS),
    );

    const user = new User({
      name,
      email,
      contactNumber,
      password: hashedPassword,
      address,
    });

    user.save();

    res
      .status(201)
      .json({ success: true, message: "User registered successfully!" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const schema = joi.object({
      email: joi.string().email().trim().lowercase().required(),
      password: joi
        .string()
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/)
        .required(),
    });

    const { error } = schema.validate(req.body);
    if (error) {
      res.status(400).json({ success: false, message: error.message });
    }

    const userExists = await User.findOne({ email });
    if (!userExists) {
      res
        .status(400)
        .json({
          success: false,
          message: "User dosen't exist, please register!",
        });
    }

    const isMatch = await bcrypt.compare(password, userExists.password);
    if (!isMatch) {
      res
        .status(400)
        .json({ success: false, message: "Password is incorrect!" });
    }

    const token = jwt.sign(
      {
        userId: userExists._id,
        userEmail: userExists.email,
        role: userExists.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    res
      .cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 24 * 60 * 60 * 1000,
      })
      .status(200)
      .json({ success: true, message: "Successfully Logged In!" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
