import express from 'express';
import signedURL from '../controllers/uploadController.js';
import { checkAdmin } from '../middlewares/checkAdmin.js';
import { checkAuth } from '../middlewares/checkAuth.js';

const router = express.Router();

router.post('/upload/get-upload-url', checkAuth, signedURL);

export default router