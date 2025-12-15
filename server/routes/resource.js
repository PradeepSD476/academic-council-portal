import express from 'express';
import { addResource, deleteResource, editResource, getResources } from '../controllers/resourceController.js';
import { checkResourceAdmin } from '../middlewares/checkResourceAdmin.js';

const router = express.Router();

router.post('/resources', checkResourceAdmin, addResource);
router.get('/resources', getResources);
router.delete('/resources/:id', checkResourceAdmin, deleteResource);
router.patch('/resources/:id', checkResourceAdmin, editResource);

export default router;