import express from 'express';
import { addResource, deleteResource, editResource, getAllResources, getResources } from '../controllers/resourceController.js';
import { checkResourceAdmin } from '../middlewares/checkResourceAdmin.js';
import { checkAuth } from '../middlewares/checkAuth.js';

const router = express.Router();

router.post('/resources', checkAuth, checkResourceAdmin, addResource);
router.get('/resources', checkAuth, getResources);
router.get('/resources/all', checkAuth, checkResourceAdmin, getAllResources);
router.delete('/resources/:id', checkAuth, checkResourceAdmin, deleteResource);
router.patch('/resources/:id', checkAuth, checkResourceAdmin, editResource);

export default router;