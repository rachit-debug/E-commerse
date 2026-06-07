const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");
const { getAllUsers, getUserById, updateUser, deleteUser } = require("../controllers/userController");
const router = express.Router()

router.get('/get-all-users', authMiddleware, adminMiddleware, getAllUsers)
router.get('/get-user', authMiddleware, getUserById)
router.put('/update-user', authMiddleware, updateUser)
router.delete('/delete-user', authMiddleware, deleteUser)

module.exports = router;