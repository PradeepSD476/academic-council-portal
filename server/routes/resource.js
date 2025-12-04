import express from 'express';
import { addResource, deleteResource, editResource, getResources } from '../controllers/resourceController.js';
import { checkAdmin } from '../middlewares/checkAdmin.js';

const router = express.Router();

router.post('/upload', checkAdmin, addResource);
router.get('/getResources', getResources);
router.post('/delete', checkAdmin, deleteResource);
router.post('/update', checkAdmin, editResource);

export default router;