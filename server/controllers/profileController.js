import admin from '../config/firebaseAdmin.js';
import prisma from '../config/db.js';
import { parseRollNumber } from "../utils/extractDetails.js";

export const updateProfile = async (req, res) => {
    const { rollNumber } = req.body;
    const userEmail = req.user.email;
    const userDetails = parseRollNumber(rollNumber);
    if(!userDetails.valid){
        return res.status(400).json({
            success: false,
            message: "Invalid Roll Number..."
        })
    }
    try {
        if (!userEmail) {
            return res.status(401).json({
                success: false,
                message: "Authentication Required..."
            })
        }
        const user = await prisma.user.findUnique({
            where: {
                email: userEmail,
            }
        })
        if(!user){
            return res.status(404).json({
                success: false,
                message: "UnAuthorized User..."
            })
        }
        const userInfo = await prisma.user.update({
            where: {
                id: user.id,
            },
            data: {
                admissionYear: userDetails.admissionYear,
                branchName: userDetails.branchName,
                program: userDetails.program,
                rollNo: userDetails.rollNo
            }
        })
        return res.status(201).json({
            success: true,
            message: "Edited successfully...",
            data: userInfo
        })
    } catch (error) {
        
    }
}