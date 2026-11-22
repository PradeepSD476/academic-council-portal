import prisma from '../config/db.js';
import { parseRollNumber } from "../utils/extractDetails.js";
import { z } from 'zod';
import { createPhotoUpload, validateStoredPhoto, removeOwnedPhoto, safeUser, safeUserSelect, resolvePhotoURL } from '../services/profile/photos.js';

const editSchema = z.object({ displayName: z.string().trim().min(1).max(100).optional(), photoURL: z.string().min(1).nullable().optional() }).strict().refine((value) => Object.keys(value).length > 0);
const uploadSchema = z.object({ contentType: z.string(), size: z.number().int().positive() }).strict();
const fail = (res, err) => res.status(err.status || 500).json({ success: false, message: err.status ? err.message : 'Unable to update your profile. Please try again.' });

export const getPhotoUpload = async (req, res) => {
    const parsed = uploadSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, message: 'Provide the photo content type and size.' });
    try { return res.status(200).json({ success: true, ...await createPhotoUpload(req.user.id, parsed.data) }); }
    catch (err) { return fail(res, err); }
};

export const editProfile = async (req, res) => {
    const parsed = editSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, message: 'Only name and photo can be updated. Name must be between 1 and 100 characters.' });
    try {
        const updates = parsed.data;
        if (updates.photoURL) await validateStoredPhoto(updates.photoURL, req.user.id);
        const updated = await prisma.user.update({ where: { id: req.user.id }, data: updates, select: safeUserSelect });
        if ('photoURL' in updates && req.user.photoURL !== updates.photoURL) await removeOwnedPhoto(req.user.photoURL, req.user.id);
        return res.status(200).json({ success: true, message: 'Profile updated successfully.', data: await safeUser(updated) });
    } catch (err) { return fail(res, err); }
};

export const getProfilePhoto = async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ success: false, message: 'Invalid user ID.' });
    if (id !== req.user.id && !['SUPER_ADMIN', 'FACULTY'].includes(req.user.role)) return res.status(403).json({ success: false, message: 'You cannot view this profile photo.' });
    try {
        const user = await prisma.user.findUnique({ where: { id }, select: { photoURL: true } });
        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
        res.set('Cache-Control', 'no-store');
        return res.status(200).json({ success: true, data: { photoURL: await resolvePhotoURL(user.photoURL) } });
    } catch (err) { return fail(res, err); }
};

function isValidRollNumber(roll) {
    if (typeof roll !== 'string') return false;
    roll = roll.toUpperCase(); 
    const pattern = /^[0-9]{4}[A-Z]{2}[0-9]{2}$/;
    return pattern.test(roll);
}

export const updateProfile = async (req, res) => {
    if (req.user.rollNo) return res.status(409).json({ success: false, message: 'Your roll number is already assigned and cannot be changed.' });
    const { rollNumber } = req.body;
    if (!rollNumber || !isValidRollNumber(rollNumber)) {
        return res.status(400).json({
            success: false,
            error: "Bad Request",
            message: "Valid Roll Number is required."
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
        const result = await prisma.user.updateMany({
            where: {
                id: user.id,
                OR: [{ rollNo: null }, { rollNo: '' }],
            },
            data: updates
        })
        if (!result.count) return res.status(409).json({ success: false, message: 'Your roll number is already assigned and cannot be changed.' });
        const updatedUser = await prisma.user.findUnique({ where: { id: user.id }, select: safeUserSelect });
        return res.status(200).json({
            success: true,
            message: "Profile updated successfully.",
            data: await safeUser(updatedUser)
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
