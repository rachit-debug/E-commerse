const User = require('../models/User')

exports.getAllUsers = async (req, res) => {
    try{
        const users = await User.find({ role: "customer" }).select("-password")

        res.status(200).json({ success: true, message: "Fetched all users!", users})
    }catch(err){
        res.status(500).json({ success: false, message: "Internal Server Error!"})
    }
}

exports.getUserById = async (req, res) => {
    try{
        const userId = req.user.userId

        const user = await User.findById(userId).select("-password")

        if(!user){
            res.status(400).json({ success: false, message: "Invalid user id!" })
        }

        res.status(200).json({ success: true, message: "Fetched user details!", user})
    }catch(err){
        res.status(500).json({ success: false, message: "Internal Server Error!"})
    }
}

exports.updateUser = async (req, res) => {
    try{
        const userId = req.user.userId

        const user = await User.findById(userId)
        if(!user){
            res.status(400).json({ success: false, message: "Invalid user id!" })
        }

        // This is the case for Auditing or History based
        // const oldData = await User.findByIdAndUpdate(userId, req.body)

        const updatedData = await User.findByIdAndUpdate(userId, req.body, {
            new : true,
            // runValidators: true -> This is for the custom validators which we have built in Model.
        })

        res.status(200).json({ success: true, message: "Updated user successfully!", user: updatedData})
    }catch(err){
        res.status(500).json({ success: false, message: "Internal Server Error!"})
    }
}

exports.deleteUser = async (req, res) => {
    try{
        const userId = req.user.userId

        const user = await User.findById(userId)
        if(!user){
            res.status(400).json({ success: false, message: "Invalid user id!" })
        }

        await User.findByIdAndDelete(userId)

        res.status(200).json({ success: true, message: "User deleted successfully!"})
    }catch(err){
        res.status(500).json({ success: false, message: "Internal Server Error!"})
    }
}