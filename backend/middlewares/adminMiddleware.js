const adminMiddleware = (req, res, next) => {
    try{
        if(req.user.role !== 'admin'){
            return res.status(403).json({ success: false, message: "Access denied!"})
        }

        next()
    }catch(err){
        res.status(500).json({ success: false, message: "Server Error!"})
    }
}

module.exports = adminMiddleware