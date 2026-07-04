import express from 'express';
import {
    createOpportunity,
    updateOpportunity,
    deleteOpportunity,
    getOpportunities,
    getOpportunityById,
    getMarqueeOpportunities
} from '../controllers/financeVault.js';
import { checkAuth } from '../middlewares/checkAuth.js';
import { checkFinanceAdmin } from '../middlewares/checkFinanceAdmin.js';

const router = express.Router();

// Public routes (Student Side)
router.get('/', getOpportunities);
router.get('/marquee', getMarqueeOpportunities);
router.get('/:id', getOpportunityById);

// Protected routes (Admin Side)
router.post('/', checkAuth, checkFinanceAdmin, createOpportunity);
router.put('/:id', checkAuth, checkFinanceAdmin, updateOpportunity);
router.delete('/:id', checkAuth, checkFinanceAdmin, deleteOpportunity);

export default router;
