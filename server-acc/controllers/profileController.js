import prisma from '../config/db.js';
import { parseRollNumber } from "../utils/extractDetails.js";

export const updateProfile = async (req, res) => {
    const { rollNumber } = req.body;
    if (!rollNumber) {
        return res.status(400).json({
            success: false,
            error: "Bad Request",
            message: "Roll Number is required."
        })
    }
    const user = req.user;
    const userDetails = parseRollNumber(rollNumber);
    if (!userDetails.valid) {
        return res.status(422).json({
            success: false,
            error: "InvalidRollNumber",
            message: "Roll number format is invalid."
        });
    }
    const updates = {
        admissionYear: userDetails.admissionYear,
        branchName: userDetails.branchName,
        program: userDetails.program,
        rollNo: userDetails.rollNo
    }
    try {
        const updatedUser = await prisma.user.update({
            where: {
                id: user.id,
            },
            data: updates
        })
        return res.status(200).json({
            success: true,
            message: "Profile updated successfully.",
            data: updatedUser
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            error: "ServerError",
            message: "Unable to verify roll number due to a server issue. Please try again."
        });

    }
}
