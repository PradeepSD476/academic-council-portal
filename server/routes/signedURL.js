import express from 'express';
import signedURL from '../controllers/uploadController.js';
import { checkAdmin } from '../middlewares/checkAdmin.js';

const router = express.Router();

router.post('/get-upload-url', checkAdmin, signedURL);

export default router