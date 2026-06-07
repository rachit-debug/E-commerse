const jwt = require("jsonwebtoken")

const authMiddleware = (req, res, next) => {
    try{
        const token = req.cookies.token

        if(!token){
            return res.status(401).json({
                success: false,
                message: "Access denied. No token provided!"
            })
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET) // Payload is returned
        req.user = decoded

        next()
    }catch(err){
        res.status(401).json({ success: false, message: "Invalid or expired token!"})
    }
}

module.exports = authMiddleware

// 403 -> Forbidden -> Customer -> Admin
// 401 -> Unauthorized -> Auth -> Logged In