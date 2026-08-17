import express from 'express';
import { generateSignedURL } from './uploadController.js';
import { protect } from '../../middlewares/authMiddleware.js';

const router = express.Router();

// Generate a presigned URL for upload
router.post('/upload-url', protect, generateSignedURL);

export default router;
