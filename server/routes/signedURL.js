import express from 'express';
import signedURL from '../utils/signedURL.js';

const router = express.Router();

router.post('/get-upload-url', signedURL);

export default router