import admin from '../config/firebaseAdmin.js';
import prisma from '../config/db.js';

const uploadResource = async (req, res) => {
    const { title, description, file, resourceType, courseCode } = req.body;
    if(!title || !file || !resourceType || !courseCode){
        return res.status(400).json({
            success: false,
            message: "Validation failed. Required fields are missing."
        })
    }
    
}