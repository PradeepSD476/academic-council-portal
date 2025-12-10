import express from 'express';
import { addResource, deleteResource, editResource, getResources } from '../controllers/resourceController.js';
import { checkAdmin } from '../middlewares/checkAdmin.js';

const router = express.Router();

router.post('/resources', checkAdmin, addResource);
router.get('/resources', getResources);
router.delete('/resources/:id', checkAdmin, deleteResource);
router.patch('/resources/:id', checkAdmin, editResource);

export default router;