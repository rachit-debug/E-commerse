const Category = require('../models/Category')
const joi = require('joi')

exports.getAllCategories = async (req, res) => {
    try{
        const categories = await Category.find({ isActive: true })

        res.status(200).json( { 
            success: true, 
            message: "Fetched all categories successfully!", 
            categories
        })
    }catch(err){
        res.status(500).json( { success: true, message: "Internal Server Error!"})
    }
}

exports.getCategoryById = async (req, res) => {
    try{
        const categoryId = req.params.id
        const category = await Category.findById(categoryId)

        if(!category){
            res.status(400).json({ success: false, message: "Invalid Category Id!"})
        }

        res.status(200).json( { 
            success: true, 
            message: "Fetched category successfully!", 
            category
        })
    }catch(err){
        res.status(500).json( { success: true, message: "Internal Server Error!"})
    }
}

exports.createCategory = async (req, res) => {
    try{
        const { title, description, imageUrl } = req.body

        const schema = joi.object({
            title: joi.string().min(3).max(50).required(),
            description: joi.string().min(5).max(200).optional(),
            imageUrl: joi.string().optional()
        })

        const { error } = schema.validate(req.body)
        if(error){
            res.status(400).json( { success: false, message: error.message })
        }

        const category = new Category({
            title,
            description: description? description : null,
            imageUrl: imageUrl? imageUrl : null,
        })

        category.save()

        res.status(201).json({ success: true, message: "Category Added Successfully!", category})
    }catch(err){
        res.status(500).json( { success: true, message: "Internal Server Error!"})
    }
}

exports.updateCategory = async (req, res) => {
    try{
        const categoryId = req.params.id
        const { title, description, imageUrl, isActive } = req.body

        const schema = joi.object({
            title: joi.string().min(3).max(50).required(),
            description: joi.string().min(5).max(200).optional(),
            imageUrl: joi.string().optional(),
            isActive: joi.boolean().required()
        })

        const { error } = schema.validate({ title, description, imageUrl, isActive })
        if(error){
            res.status(400).json( { success: false, message: error.message })
        }

        const updatedCategory = await Category.findByIdAndUpdate(
            categoryId, 
            { 
                title, 
                description, 
                imageUrl, 
                isActive 
            }, 
            { 
                new: true, 
                runValidators: true
            }
        )

        res.status(200).json({ success: true, message: "Category Updated Successfully!", category: updatedCategory}) // 
    }catch(err){
        res.status(500).json( { success: true, message: "Internal Server Error!"})
    }
}