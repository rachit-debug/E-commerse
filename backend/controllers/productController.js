const Category = require('../models/Category')
const Product = require('../models/Product')
const joi = require('joi')

exports.getAllProducts = async (req, res) => {
    try{
        const products = await Product.find({ isActive: true })

        res.status(200).json( { 
            success: true, 
            message: "Fetched all products successfully!", 
            products
        })
    }catch(err){
        res.status(500).json( { success: true, message: "Internal Server Error!"})
    }
}

exports.getProductById = async (req, res) => {
    try{
        const productId = req.params.id
        const product = await Product.findById(productId)

        if(!product){
            res.status(400).json({ success: false, message: "Invalid Product Id!"})
        }

        res.status(200).json( { 
            success: true, 
            message: "Fetched product successfully!", 
            product
        })
    }catch(err){
        res.status(500).json( { success: true, message: "Internal Server Error!"})
    }
}

exports.createProduct = async (req, res) => {
    try{
        const { title, description, mrpPrice, sellingPrice, imageUrls, category, stockQty, brand, rating, noOfRatings } = req.body

        const schema = joi.object({
            title: joi.string().min(3).max(50).required(),
            description: joi.string().min(5).max(200).optional(),
            mrpPrice: joi.number().min(0).required(),
            sellingPrice: joi.number().min(0).required(),
            imageUrls: joi.array(),
            category: joi.string().required(),
            stockQty: joi.number().min(0).required(),
            brand: joi.string().required(),
            rating: joi.number().min(0).max(5).required(),
            noOfRatings: joi.number().min(0).required()
        })

        const { error } = schema.validate({ title, description, mrpPrice, sellingPrice, imageUrls, category, stockQty, brand, rating, noOfRatings })
        if(error){
            res.status(400).json( { success: false, message: error.message })
        }

        const product = new Product({
            title,
            description: description ? description : null,
            mrpPrice,
            sellingPrice,
            imageUrls: imageUrls.length <= 0 ? [] : imageUrls,
            category,
            stockQty,
            brand,
            rating,
            noOfRatings
        })

        product.save()

        res.status(201).json({ success: true, message: "Product Added Successfully!", product})
    }catch(err){
        res.status(500).json( { success: true, message: "Internal Server Error!"})
    }
}

exports.updateProduct = async (req, res) => {
    try{
        const productId = req.params.id
        const { title, description, mrpPrice, sellingPrice, imageUrls, category, stockQty, brand, rating, noOfRatings, isActive } = req.body

        const schema = joi.object({
            title: joi.string().min(3).max(50).required(),
            description: joi.string().min(5).max(200).optional(),
            mrpPrice: joi.number().min(0).required(),
            sellingPrice: joi.number().min(0).required(),
            imageUrls: joi.array(joi.string()),
            category: joi.string().required(),
            stockQty: joi.number().min(0).required(),
            brand: joi.string().required(),
            rating: joi.number().min(0).max(5).required(),
            noOfRatings: joi.number().min(0).required(),
            isActive: joi.boolean().required()
        })

        const { error } = schema.validate({ title, description, mrpPrice, sellingPrice, imageUrls, category, stockQty, brand, rating, noOfRatings, isActive })
        if(error){
            res.status(400).json( { success: false, message: error.message })
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            productId, 
            { title, description, mrpPrice, sellingPrice, imageUrls, category, stockQty, brand, rating, noOfRatings, isActive }, 
            { 
                new: true, 
                runValidators: true
            }
        )

        res.status(200).json({ success: true, message: "Product Updated Successfully!", product: updatedProduct})
    }catch(err){
        res.status(500).json( { success: true, message: "Internal Server Error!"})
    }
}

exports.getRecentProducts = async (req, res) => {
    try {
        const products = await Product.find({ isActive: true })
            .sort({ createdAt: -1 })
            .limit(5)

        res.status(200).json({ success: true, message: "Recent products fetched!", products })
    } catch (err) {
        res.status(500).json({ success: false, message: "Internal Server Error!" })
    }
}

exports.getProductsByCategory = async (req, res) => {
    try{
        const categoryId = req.params.categoryId
        const limit = 4
        const page  = Math.max(1, parseInt(req.query.page) || 1)
        const skip  = (page - 1) * limit

        const category = await Category.findById(categoryId)
        if(!category){
            return res.status(400).json({ success: false, message: "Invalid CategoryId!" })
        }

        const total    = await Product.countDocuments({ category: categoryId, isActive: true })
        const products = await Product.find({ category: categoryId, isActive: true })
            .skip(skip)
            .limit(limit)

        res.status(200).json({
            success: true,
            message: "Products of a category fetched successfully!",
            products,
            total,
            page,
            totalPages: Math.ceil(total / limit),
            limit,
        })
    }catch(err){
        res.status(500).json({ success: false, message: "Internal Server error!" })
    }
}